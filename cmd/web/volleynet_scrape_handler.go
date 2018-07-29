package main

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	log "github.com/sirupsen/logrus"

	"github.com/gin-gonic/gin"
	"github.com/raphi011/scores/db/sqlite"
	"github.com/raphi011/scores/volleynet"
)

type volleynetScrapeHandler struct {
	volleynetService *sqlite.VolleynetService
	userService      *sqlite.UserService
}

func (h *volleynetScrapeHandler) scrapeLadder(c *gin.Context) {
	gender := c.DefaultQuery("gender", "M")

	client := volleynet.DefaultClient()
	ranks, err := client.Ladder(gender)

	if err != nil {
		c.AbortWithError(http.StatusServiceUnavailable, err)
		return
	}

	persisted, err := h.volleynetService.AllPlayers()

	if err != nil {
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	syncInfos := volleynet.SyncPlayers(persisted, ranks...)

	for _, info := range syncInfos {
		if info.IsNew {
			log.Printf("adding player id: %v, name: %v",
				info.NewPlayer.ID,
				fmt.Sprintf("%v %v", info.NewPlayer.FirstName, info.NewPlayer.LastName))

			err = h.volleynetService.NewPlayer(info.NewPlayer)

		} else {
			merged := volleynet.MergePlayer(info.OldPlayer, info.NewPlayer)

			log.Printf("updating player id: %v, name: %v",
				info.NewPlayer.ID,
				fmt.Sprintf("%v %v", merged.FirstName, merged.LastName))

			err = h.volleynetService.UpdatePlayer(merged)

		}

		if err != nil {
			c.AbortWithError(http.StatusInternalServerError, err)
			return
		}
	}

	c.Status(http.StatusOK)
}

// ScrapeTournamentResult contains scrape statistics.
type ScrapeTournamentResult struct {
	NewTournaments      int
	UpdatedTournaments  int
	CanceledTournaments int
	NewTeams            int
	UpdatedTeams        int
	ScrapeDuration      time.Duration
	Success             bool
	Error               error
}

func (h *volleynetScrapeHandler) scrapeTournament(c *gin.Context) {
	tournamentID, err := strconv.Atoi(c.Param("tournamentID"))

	if err != nil {
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	tournament, err := h.volleynetService.Tournament(tournamentID)

	if err != nil {
		log.Warn(err)
	}

	client := volleynet.DefaultClient()
	fullTournament, err := client.ComplementTournament(tournament.Tournament)

	if err != nil {
		log.Warn(err)
	}

	syncInformation := volleynet.SyncTournaments([]volleynet.FullTournament{*tournament}, fullTournament.Tournament)
	sync := syncInformation[0]

	mergedTournament := volleynet.MergeTournament(sync.SyncType, sync.OldTournament, fullTournament)

	err = h.volleynetService.UpdateTournament(mergedTournament)

	if err != nil {
		log.Warn(err)
	}
}

func (h *volleynetScrapeHandler) scrapeTournaments(c *gin.Context) {
	gender := c.DefaultQuery("gender", "M")
	league := c.DefaultQuery("league", "AMATEUR TOUR")
	season := c.DefaultQuery("season", strconv.Itoa(time.Now().Year()))
	seasonInt, err := strconv.Atoi(season)

	if err != nil {
		c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	result := ScrapeTournamentResult{}

	client := volleynet.DefaultClient()

	start := time.Now()
	current, err := client.AllTournaments(gender, league, season)

	if err != nil {
		c.AbortWithError(http.StatusServiceUnavailable, err)
		return
	}

	persisted, err := h.volleynetService.SeasonTournaments(seasonInt)

	syncInformation := volleynet.SyncTournaments(persisted, current...)

	for _, t := range syncInformation {
		fullTournament, err := client.ComplementTournament(*t.NewTournament)

		if err != nil {
			c.AbortWithError(http.StatusServiceUnavailable, err)
			return
		}

		if t.IsNew {
			result.NewTournaments++
			log.Printf("adding tournament id: %v, name: %v, start: %v",
				fullTournament.ID,
				fullTournament.Name,
				fullTournament.Start)

			err = h.volleynetService.NewTournament(fullTournament)
		} else {
			result.UpdatedTournaments++
			log.Printf("updating tournament id: %v, name: %v, start: %v, sync: %v",
				fullTournament.ID,
				fullTournament.Name,
				fullTournament.Start,
				t.SyncType,
			)

			mergedTournament := volleynet.MergeTournament(t.SyncType, t.OldTournament, fullTournament)

			err = h.volleynetService.UpdateTournament(mergedTournament)
		}

		if err != nil {
			log.Print(err)
			c.AbortWithError(http.StatusInternalServerError, err)
			return
		}

		persistedTeams, err := h.volleynetService.TournamentTeams(t.NewTournament.ID)

		if err != nil {
			log.Print(err)
			c.AbortWithError(http.StatusInternalServerError, err)
			return
		}

		persistedPlayers, err := h.volleynetService.AllPlayers()

		if err != nil {
			log.Print(err)
			c.AbortWithError(http.StatusInternalServerError, err)
			return
		}

		syncTournamentTeams := volleynet.SyncTournamentTeams(t.SyncType, persistedTeams, fullTournament.Teams)

		for _, team := range syncTournamentTeams {
			if team.IsNew {
				persistedPlayers, err = h.addPlayersIfNew(persistedPlayers, team.NewTeam.Player1, team.NewTeam.Player2)

				if err == nil {
					result.NewTeams++

					log.Printf("adding tournament team tournamentid: %v, player1ID: %v, player2ID: %v",
						team.NewTeam.TournamentID,
						team.NewTeam.Player1.ID,
						team.NewTeam.Player2.ID,
					)

					err = h.volleynetService.NewTeam(team.NewTeam)
				}
			} else {
				result.UpdatedTeams++

				log.Printf("updating tournament team tournamentid: %v, player1ID: %v, player2ID: %v, sync: %v",
					team.NewTeam.TournamentID,
					team.NewTeam.Player1.ID,
					team.NewTeam.Player2.ID,
					t.SyncType,
				)

				if team.OldTeam == nil || team.NewTeam == nil {
					fmt.Print("asdasd")
				}

				mergedTeam := volleynet.MergeTournamentTeam(team.SyncType, team.OldTeam, team.NewTeam)

				err = h.volleynetService.UpdateTournamentTeam(mergedTeam)
			}

			if err != nil {
				log.Print(err)
				c.AbortWithError(http.StatusInternalServerError, err)
				return
			}
		}

	}

	result.ScrapeDuration = time.Since(start) / time.Millisecond
	result.Success = true

	jsonn(c, http.StatusOK, result, "")
}

func (h *volleynetScrapeHandler) addPlayersIfNew(persistedPlayers []volleynet.Player, players ...*volleynet.Player) (
	[]volleynet.Player, error) {

	for _, p := range players {
		player := volleynet.FindPlayer(persistedPlayers, p.ID)

		if player == nil {
			log.Printf("adding missing player id: %v, name: %v",
				p.ID,
				fmt.Sprintf("%v %v", p.FirstName, p.LastName))

			err := h.volleynetService.NewPlayer(p)

			if err != nil {
				return nil, err
			}
			persistedPlayers = append(persistedPlayers, *p)
		}
	}

	return persistedPlayers, nil
}

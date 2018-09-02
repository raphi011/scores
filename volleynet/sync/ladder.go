package sync

import (
	"log"

	"github.com/pkg/errors"
	"github.com/raphi011/scores/volleynet"
)

type LadderSyncReport struct {
	NewPlayers     int
	UpdatedPlayers int
}

func (s *SyncService) Ladder(gender string) (*LadderSyncReport, error) {
	ranks, err := s.Client.Ladder(gender)
	report := &LadderSyncReport{}

	if err != nil {
		return nil, errors.Wrap(err, "loading the ladder failed")
	}

	persisted, err := s.VolleynetService.AllPlayers()

	if err != nil {
		return nil, errors.Wrap(err, "loading persisted players failed")
	}

	syncInfos := SyncPlayers(persisted, ranks...)

	for _, info := range syncInfos {
		if info.IsNew {
			log.Printf("adding player id: %v, name: %s %s",
				info.NewPlayer.ID,
				info.NewPlayer.FirstName,
				info.NewPlayer.LastName)

			err = s.VolleynetService.NewPlayer(info.NewPlayer)
			report.NewPlayers++

		} else {
			merged := MergePlayer(info.OldPlayer, info.NewPlayer)

			log.Printf("updating player id: %d, name: %s %s",
				info.NewPlayer.ID,
				merged.FirstName,
				merged.LastName)

			err = s.VolleynetService.UpdatePlayer(merged)
			report.UpdatedPlayers++

		}

		if err != nil {
			return nil, errors.Wrap(err, "sync player update failed")
		}
	}

	return report, nil
}

// PlayerSyncInformation contains sync information for two `Player`s
type PlayerSyncInformation struct {
	IsNew     bool
	OldPlayer *volleynet.Player
	NewPlayer *volleynet.Player
}

// SyncPlayers takes a slice of current and old `Player`s and finds out which
// one is new and which needs to get updated
func SyncPlayers(persisted []volleynet.Player, current ...volleynet.Player) []PlayerSyncInformation {
	ps := []PlayerSyncInformation{}
	for i := range current {
		newPlayer := &current[i]
		oldPlayer := FindPlayer(persisted, newPlayer.ID)

		ps = append(ps, PlayerSyncInformation{
			NewPlayer: newPlayer,
			OldPlayer: oldPlayer,
			IsNew:     oldPlayer == nil,
		})
	}

	return ps
}

package sqlite

import (
	"testing"

	"github.com/raphi011/scores"
)

func TestGetPlayers(t *testing.T) {
	s := createServices()
	defer Reset(s.db)

	s.playerService.Create(&scores.Player{Name: "Test1"})
	s.playerService.Create(&scores.Player{Name: "Test2"})
	players, err := s.playerService.Players()

	if err != nil {
		t.Errorf("PlayerService.Players() err: %s", err)
	} else if len(players) != 2 {
		t.Errorf("PlayerService.Players(), want 2 players, got %d ", len(players))
	}
}

func TestCreatePlayer(t *testing.T) {
	s := createServices()
	defer Reset(s.db)

	player, err := s.playerService.Create(&scores.Player{Name: "Test"})

	if err != nil {
		t.Error("Can't create player")
	}
	if player.ID == 0 {
		t.Error("PlayerID not assigned")
	}

	playerID := player.ID

	player, err = s.playerService.Player(playerID)

	if err != nil {
		t.Errorf("PlayerService.Player() err: %s", err)
	}
	if player.ID != playerID {
		t.Errorf("PlayerService.Player(), want ID %d, got %d", playerID, player.ID)
	}
}

func TestDeletePlayer(t *testing.T) {
	s := createServices()
	defer Reset(s.db)

	player, _ := s.playerService.Create(&scores.Player{Name: "Test"})
	s.playerService.Create(&scores.Player{Name: "Test2"})

	err := s.playerService.Delete(player.ID)

	if err != nil {
		t.Errorf("PlayerService.Delete() err: %s", err)
	}

	players, _ := s.playerService.Players()
	playerCount := len(players)

	if playerCount != 1 {
		t.Errorf("len(PlayerService.Players()), want 1, got %d", playerCount)
	}

}

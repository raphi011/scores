// @flow

import React from "react";
import { withStyles } from "material-ui/styles";
import List, { ListItem, ListItemText, ListItemIcon } from "material-ui/List";
import Badge from "material-ui/Badge";
import PersonIcon from "material-ui-icons/Person";
import type { Player } from '../types';

const styles = theme => ({
  root: {
    width: "100%",
    background: theme.palette.background.paper
  }
});

const playerItemStyles = theme => ({
  default: {
    background: theme.palette.background.paper
  },
  team1: {
    background: "red"
  },
  team2: {
    background: "green"
  }
});

type Props = {
  players: Array<Player>,
  onUnsetPlayer: number => void,
  onSetPlayer: (number, number, boolean) => void,
  player1ID: number,
  player2ID: number,
  player3ID: number,
  player4ID: number,
  classes: Object,
};

class SelectPlayers extends React.Component<Props> {
  onSelectPlayer = ID => {
    const { onUnsetPlayer, onSetPlayer } = this.props;

    let unassigned;
    let assignedCount = 0;
    let selected;

    for (let i = 1; i < 5; i += 1) {
      const pID = this.props[`player${i}ID`];

      if (pID === ID) {
        selected = i;
        break;
      } else if (!unassigned && pID === 0) {
        unassigned = i;
      }

      if (pID) assignedCount += 1;
    }

    if (selected) {
      onUnsetPlayer(selected);
    } else if (unassigned) {
      onSetPlayer(unassigned, ID, assignedCount === 3);
    }
  };

  playerNr = playerID => {
    const { player1ID, player2ID, player3ID, player4ID } = this.props;

    if (playerID === player1ID) return 1;
    else if (playerID === player2ID) return 2;
    else if (playerID === player3ID) return 3;
    else if (playerID === player4ID) return 4;

    return 0;
  };

  render() {
    const {
      players = [],
      classes,
    } = this.props;

    return (
      <List className={classes.root}>
        {players.map(p => (
          <StyledPlayerListItem
            onClick={() => this.onSelectPlayer(p.ID)}
            key={p.ID}
            player={p}
            playerNr={this.playerNr(p.ID)}
          />
        ))}
      </List>
    );
  }
}

type PlayerListProps = {
  onClick: Event => void,
  player: Player,
  playerNr: number,
}

function PlayerListItem({ player, onClick, playerNr }: PlayerListProps) {
  let color;
  let team;

  switch (playerNr) {
    case 1:
    case 2:
      color = "primary";
      team = 1;
      break;
    case 3:
    case 4:
      color = "accent";
      team = 2;
      break;
    default: 
      color = "";
      team = null;
    ;
  }

  return (
    <ListItem onClick={onClick} button>
      {playerNr ? (
        <ListItemIcon>
          <Badge badgeContent={team} color={color}>
            <PersonIcon />
          </Badge>
        </ListItemIcon>
      ) : null}
      <ListItemText inset primary={player.Name} />
    </ListItem>
  );
}

const StyledSelectPlayers = withStyles(styles)(SelectPlayers);
const StyledPlayerListItem = withStyles(playerItemStyles)(PlayerListItem);

export default StyledSelectPlayers;

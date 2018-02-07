// @flow

import React from 'react';
import { withStyles } from 'material-ui/styles';
import List, { ListItem, ListItemText, ListItemIcon } from 'material-ui/List';
import Badge from 'material-ui/Badge';
import PersonIcon from 'material-ui-icons/Person';
import type { Player } from '../types';

const styles = theme => ({
  root: {
    width: '100%',
    background: theme.palette.background.paper,
  },
});

const playerItemStyles = theme => ({
  default: {
    background: theme.palette.background.paper,
  },
  team1: {
    background: 'red',
  },
  team2: {
    background: 'green',
  },
});

type Props = {
  players: Array<Player>,
  onUnsetPlayer: number => void,
  onSetPlayer: (number, Player, boolean) => void,
  player1: Player,
  player2: Player,
  player3: Player,
  player4: Player,
  classes: Object,
};

class SelectPlayers extends React.Component<Props> {
  onSelectPlayer = (selected: Player) => {
    const { onUnsetPlayer, onSetPlayer } = this.props;

    let unassigned = 0;
    let assignedCount = 0;
    let selectedNr = 0;

    for (let i = 1; i < 5; i += 1) {
      const player: Player = this.props[`player${i}`];
      const pId = player ? player.id : 0;

      if (pId === selected.id) {
        selectedNr = i;
        break;
      } else if (!unassigned && pId === 0) {
        unassigned = i;
      }

      if (pId) assignedCount += 1;
    }

    if (selectedNr) {
      onUnsetPlayer(selectedNr);
    } else if (unassigned) {
      onSetPlayer(unassigned, selected, assignedCount === 3);
    }
  };

  playerNr = (player: Player): number => {
    const { player1, player2, player3, player4 } = this.props;

    if (player === player1) return 1;
    else if (player === player2) return 2;
    else if (player === player3) return 3;
    else if (player === player4) return 4;

    return 0;
  };

  render() {
    const { players = [], classes } = this.props;

    return (
      <List className={classes.root}>
        {players.map(p => (
          <StyledPlayerListItem
            onClick={() => this.onSelectPlayer(p)}
            key={p.id}
            player={p}
            playerNr={this.playerNr(p)}
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
};

function PlayerListItem({ player, onClick, playerNr }: PlayerListProps) {
  let color;
  let team;

  switch (playerNr) {
    case 1:
    case 2:
      color = 'primary';
      team = 1;
      break;
    case 3:
    case 4:
      color = 'secondary';
      team = 2;
      break;
    default:
      color = '';
      team = null;
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
      <ListItemText inset primary={player.name} />
    </ListItem>
  );
}

const StyledSelectPlayers = withStyles(styles)(SelectPlayers);
const StyledPlayerListItem = withStyles(playerItemStyles)(PlayerListItem);

export default StyledSelectPlayers;
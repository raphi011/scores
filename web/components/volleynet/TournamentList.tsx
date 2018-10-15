import List from '@material-ui/core/List';
import { createStyles, withStyles } from '@material-ui/core/styles';
import React from 'react';

import TournamentListItem from './TournamentListItem';

import { Tournament } from '../../types';

const styles = createStyles({
  root: {
    width: '100%',
  },
});

interface Props {
  tournaments: Tournament[];
  onTournamentClick: (t: Tournament) => void;
  classes: any;
}

class TournamentList extends React.PureComponent<Props> {
  render() {
    const { tournaments = [], onTournamentClick, classes } = this.props;

    return (
      <List className={classes.root}>
        {tournaments.map(t => (
          <TournamentListItem
            key={t.id}
            onClick={onTournamentClick}
            tournament={t}
          />
        ))}
      </List>
    );
  }
}

export default withStyles(styles)(TournamentList);

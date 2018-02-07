// @flow

import React from 'react';
import { withStyles } from 'material-ui/styles';
import Button from 'material-ui/Button';
import BackIcon from 'material-ui-icons/KeyboardArrowLeft';
import NextIcon from 'material-ui-icons/KeyboardArrowRight';
import MobileStepper from 'material-ui/MobileStepper';
import Router from 'next/router';
import withRedux from 'next-redux-wrapper';

import { validateMatch } from '../validation/match';
import Layout from '../components/Layout';
import SelectPlayers from '../components/SelectPlayers';
import SetScores from '../components/SetScores';
import withRoot from '../styles/withRoot';
import initStore, { dispatchActions } from '../redux/store';
import { allPlayersSelector, matchSelector } from '../redux/reducers/entities';
import {
  createNewMatchAction,
  loadPlayersAction,
  loadMatchAction,
} from '../redux/actions/entities';
import { setStatusAction } from '../redux/actions/status';
import { userOrLoginRouteAction } from '../redux/actions/auth';
import type { NewMatch, Match, Player } from '../types';

const styles = theme => ({
  root: {
    width: '90%',
  },
  submitButton: {
    marginRight: theme.spacing.unit,
    width: '100%',
  },
  stepContainer: {
    padding: '0 20px',
  },
  actionsContainer: {
    marginTop: theme.spacing.unit,
  },
  resetContainer: {
    marginTop: 0,
    padding: theme.spacing.unit * 3,
  },
  transition: {
    paddingBottom: 4,
  },
  button: {
    margin: theme.spacing.unit,
  },
});

function calcWinnerScore(loserScore: number, targetScore: number): number {
  const winnerScore =
    loserScore <= targetScore - 2 ? targetScore : loserScore + 2;

  return winnerScore;
}

type Props = {
  match: ?Match,
  classes: Object,
  players: Array<Player>,
  createNewMatch: NewMatch => Promise<any>,
  setStatus: string => void,
  /* eslint-disable react/no-unused-prop-types */
  rematchId: number,
};

type State = {
  activeStep: number,
  teamsComplete: boolean,
  match: {
    player1: ?Player,
    player2: ?Player,
    player3: ?Player,
    player4: ?Player,
    scoreTeam1: string,
    scoreTeam2: string,
    targetScore: string,
  },
  errors: {
    valid: boolean,
  },
};

class CreateMatch extends React.Component<Props, State> {
  static async getInitialProps({ store, query, isServer, req, res }) {
    const actions = [loadPlayersAction(), userOrLoginRouteAction()];

    let { rematchId } = query;

    if (rematchId) {
      rematchId = Number.parseInt(rematchId, 10);
      actions.push(loadMatchAction(rematchId));
    }

    await dispatchActions(store.dispatch, isServer, req, res, actions);

    return { rematchId };
  }

  constructor(props: Props) {
    super(props);

    const { match } = props;

    const state: State = {
      activeStep: 0,
      teamsComplete: false,
      match: {
        player1: null,
        player2: null,
        player3: null,
        player4: null,
        scoreTeam1: '',
        scoreTeam2: '',
        targetScore: '15',
      },
      errors: {
        valid: true,
      },
    };

    if (match) {
      state.activeStep = 1;
      state.teamsComplete = true;
      state.match.player1 = match.team1.player1;
      state.match.player2 = match.team1.player2;
      state.match.player3 = match.team2.player1;
      state.match.player4 = match.team2.player2;
    }

    this.state = state;
  }

  onUnsetPlayer = (selected: number) => {
    const match = {
      ...this.state.match,
    };

    switch (selected) {
      case 1:
        match.player1 = null;
        break;
      case 2:
        match.player2 = null;
        break;
      case 3:
        match.player3 = null;
        break;
      case 4:
        match.player4 = null;
        break;
      default:
        throw new Error(`Can't unset player: ${selected}`);
    }

    this.setState({ match, teamsComplete: false });
  };

  onSetPlayer = (playerNr: number, player: Player, teamsComplete: boolean) => {
    const activeStep = teamsComplete ? 1 : 0;
    const match = {
      ...this.state.match,
    };

    switch (playerNr) {
      case 1:
        match.player1 = player;
        break;
      case 2:
        match.player2 = player;
        break;
      case 3:
        match.player3 = player;
        break;
      case 4:
        match.player4 = player;
        break;
      default:
        throw new Error(`Can't set player: ${playerNr}`);
    }

    this.setState({ match, teamsComplete, activeStep });
  };

  onPrevious = () => {
    const { activeStep } = this.state;

    if (activeStep === 0) {
      Router.push('/');
      return;
    }

    this.setState({ activeStep: 0 });
  };

  onSetScores = () => {
    this.setState({ activeStep: 1 });
  };

  onChangeScore = (teamNr: number, score: string) => {
    const match = {
      ...this.state.match,
    };

    switch (teamNr) {
      case 1:
        match.scoreTeam1 = score;
        break;
      case 2:
        match.scoreTeam2 = score;
        break;
      default:
        throw new Error(`Can't set score for team: ${teamNr}`);
    }

    this.setState({ match });
  };

  onChangeTargetScore = (e, targetScore: string) => {
    const match = {
      ...this.state.match,
      targetScore,
    };

    this.setState({ match });
  };

  onScoreLoseFocus = (teamNr: number) => {
    const match = {
      ...this.state.match,
    };

    const scoreTeam1 = Number.parseInt(match.scoreTeam1, 10);
    const scoreTeam2 = Number.parseInt(match.scoreTeam2, 10);
    const targetScore = Number.parseInt(match.targetScore, 10);

    switch (teamNr) {
      case 1: {
        if (Number.isNaN(scoreTeam1) || Number.isInteger(scoreTeam2)) return;

        match.scoreTeam2 = calcWinnerScore(scoreTeam1, targetScore).toString();
        break;
      }
      case 2: {
        if (Number.isNaN(scoreTeam2) || Number.isInteger(scoreTeam1)) return;

        match.scoreTeam1 = calcWinnerScore(scoreTeam2, targetScore).toString();
        break;
      }
      default:
        throw new Error(`Can't set score for team: ${teamNr}`);
    }

    this.setState({ match });
  };

  onCreateMatch = async (e: SyntheticInputEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const { createNewMatch, setStatus } = this.props;
    const match = this.getMatch();

    const errors = validateMatch(match);

    if (!errors.valid) {
      this.setState({ errors });
    } else {
      try {
        await createNewMatch(match);
        await Router.push('/');
        setStatus('New match created');
      } catch (error) {
        // ignore
      }
    }
  };

  getMatch = (): NewMatch => {
    const {
      scoreTeam1,
      scoreTeam2,
      targetScore,
      player1,
      player2,
      player3,
      player4,
    } = this.state.match;

    return {
      player1Id: player1 ? player1.id : 0,
      player2Id: player2 ? player2.id : 0,
      player3Id: player3 ? player3.id : 0,
      player4Id: player4 ? player4.id : 0,
      scoreTeam1: Number.parseInt(scoreTeam1, 10) || 0,
      scoreTeam2: Number.parseInt(scoreTeam2, 10) || 0,
      targetScore: Number.parseInt(targetScore, 10) || 0,
    };
  };

  render() {
    const { players, classes } = this.props;
    const { teamsComplete, activeStep, match, errors } = this.state;

    const {
      scoreTeam1,
      scoreTeam2,
      player1,
      player2,
      player3,
      player4,
      targetScore,
    } = match;

    return (
      <Layout title="New Match">
        <div>
          <MobileStepper
            position="static"
            className={classes.mobileStepper}
            steps={2}
            activeStep={activeStep}
            orientation="vertical"
            backButton={
              <Button size="small" onClick={this.onPrevious}>
                <BackIcon className={classes.button} />
                {activeStep === 0 ? 'Cancel' : 'Back'}
              </Button>
            }
            nextButton={
              <Button
                onClick={this.onSetScores}
                size="small"
                disabled={activeStep === 1 || !teamsComplete}
              >
                Next
                <NextIcon className={classes.button} />
              </Button>
            }
          />
          <div>
            {activeStep === 0 ? (
              <SelectPlayers
                player1={player1}
                player2={player2}
                player3={player3}
                player4={player4}
                players={players}
                onSetPlayer={this.onSetPlayer}
                onUnsetPlayer={this.onUnsetPlayer}
              />
            ) : (
              <div className={classes.stepContainer}>
                <SetScores
                  player1={player1}
                  player2={player2}
                  player3={player3}
                  player4={player4}
                  errors={errors}
                  scoreTeam1={scoreTeam1}
                  scoreTeam2={scoreTeam2}
                  targetScore={targetScore}
                  onLoseFocus={this.onScoreLoseFocus}
                  onChangeScore={this.onChangeScore}
                  onChangeTargetScore={this.onChangeTargetScore}
                  onCreateMatch={this.onCreateMatch}
                />
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }
}

function mapStateToProps(state, ownProps: Props) {
  const { rematchId } = ownProps;
  const players = allPlayersSelector(state);
  const match = rematchId ? matchSelector(state, rematchId) : null;

  return {
    players,
    match,
  };
}

const mapDispatchToProps = {
  loadPlayers: loadPlayersAction,
  createNewMatch: createNewMatchAction,
  setStatus: setStatusAction,
};

export default withStyles(styles)(
  withRedux(initStore, mapStateToProps, mapDispatchToProps)(
    withRoot(CreateMatch),
  ),
);

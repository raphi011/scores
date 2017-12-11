import * as actionNames from "../actionNames";

function createReducer(initialState, handlers) {
  return function reducer(state = initialState, action) {
    if (handlers.hasOwnProperty(action.type)) {
      return handlers[action.type](state, action);
    } 

    return state;
  };
}

function receiveMatch(state, action) {
  const matchesMap = {
    ...state.matchesMap,
    [action.ID]: action.payload,
  };

  return {
    ...state,
    matchesMap,
  };
}

function receiveMatches(state, action) {
  const matchesMap = {};
  const matchesIDs = [];
  action.payload.forEach(m => {
    matchesIDs.push(m.ID);
    matchesMap[m.ID] = m;
  });

  return {
    ...state,
    matchesMap,
    matchesIDs,
  };
}

function receivePlayers(state, action) {
  const playersMap = {};
  const playerIDs = [];
  action.payload.forEach(p => {
    playerIDs.push(p.ID);
    playersMap[p.ID] = p;
  });

  return {
    ...state,
    playersMap,
    playerIDs
  };
}

function loggedOut(state, action) {
  const { loginRoute } = action.payload;

  return {
    ...state,
    loginRoute,
    user: null,
  };
}

function login(state, action) {
  return {
    ...state,
    user: action.username
  };
}

function setUserOrLoginroute(state, action) {
  const { user, loginRoute } = action.payload;
  return {
    ...state,
    loginRoute,
    user
  };
}

function setStatus(state, action) {
  return {
    ...state,
    status: action.status
  };
}

function clearStatus(state) {
  return {
    ...state,
    status: ""
  };
}

function removeMatch(state, action) {
  const matchesIDs = state.matchesIDs.filter(ID => ID !== action.ID);
  return {
    ...state,
    matchesIDs,
  };
}

function receivePlayer(state, action) {
  const playersMap = {
    ...state.playersMap,
    [action.ID]: action.payload,
  };

  return {
    ...state,
    playersMap,
  };
}

function receiveStatistic(state, action) {
  const statisticsMap = {
    ...state.statisticsMap,
    [action.playerID]: action.payload,
  };

  return {
    ...state,
    statisticsMap,
  };
}

function receiveStatistics(state, action) {
  const statisticsMap = {};
  const statisticIDs = [];
  action.payload.forEach(p => {
    statisticIDs.push(p.playerId);
    statisticsMap[p.playerId] = p;
  });

  return {
    ...state,
    statisticsMap,
    statisticIDs, 
  };
}

const reducer = createReducer(
  {},
  {
    [actionNames.RECEIVE_STATISTIC]: receiveStatistic,
    [actionNames.RECEIVE_STATISTICS]: receiveStatistics,
    [actionNames.RECEIVE_MATCH]: receiveMatch,
    [actionNames.RECEIVE_PLAYER]: receivePlayer,
    [actionNames.RECEIVE_MATCHES]: receiveMatches,
    [actionNames.RECEIVE_PLAYERS]: receivePlayers,
    [actionNames.LOGGEDOUT]: loggedOut,
    [actionNames.LOGIN]: login,
    [actionNames.SET_USER_OR_LOGINROUTE]: setUserOrLoginroute,
    [actionNames.SET_STATUS]: setStatus,
    [actionNames.CLEAR_STATUS]: clearStatus,
    [actionNames.REMOVE_MATCH]: removeMatch
  }
);

export default reducer;

export const statisticSelector = (state, ID) => state.statisticsMap[ID];
export const statisticsSelector = state => state.statisticIDs.map(ID => state.statisticsMap[ID]);
export const loginRouteSelector = state => state.loginRoute;
export const statusSelector = state => state.status;
export const matchesSelector = state => state.matchesIDs.map(ID => state.matchesMap[ID]);
export const matchSelector = (state, ID) => state.matchesMap[ID];
export const playerSelector = (state, ID) => state.playersMap[ID];
export const playersSelector = state => ({
  playersMap: state.playersMap,
  playerIDs: state.playerIDs
});
export const userSelector = state => ({
  isLoggedIn: !!state.user,
  user: state.user
});

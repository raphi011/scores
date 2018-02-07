// @flow

import * as actionNames from '../actionNames';
import { createReducer } from '../reduxHelper';
import { denorm, norm } from '../entitySchemas';

import type { EntityName, EntityType } from '../../types';
import type { Store } from '../store';

export type EntityStore = {
  [EntityName]: { values: { [number]: EntityType } },
};

export type EntityMap = {
  [EntityName]: { [number]: EntityType },
};

export type ReceiveEntityAction = {
  payload: Array<Object>,
  entityName: EntityName,
  listName?: string,
  listKey?: number,
  mode?: 'replace' | 'append',
  assignId?: boolean,
};

export type DeleteEntityAction = {
  payload: Object,
  entityName: EntityName,
  listNames: Array<string>,
};

export const initialEntitiesState = {
  player: { values: {}, all: [] },
  team: { values: {} },
  match: { values: {}, all: [], byPlayer: {} },
  statistic: { values: {}, byPlayer: {} },
};

function deleteEntities(state, action: DeleteEntityAction) {
  const { entityName, listNames, payload } = action;

  const deletedId = payload.id;
  // TODO: delete from values
  // TODO: delete from [listName][listKey] lists
  const newLists = listNames.reduce((listObj, name) => {
    listObj[name] = state[entityName][name].filter(id => id !== deletedId);
    return listObj;
  }, {});

  return {
    ...state,
    [entityName]: {
      ...state[entityName],
      ...newLists,
    },
  };
}

function removeFromLists(listNames: Array<string>, state, id: number) {}

function receiveEntities(state: EntityStore, action: ReceiveEntityAction) {
  // STEP 1: normalize entites
  const {
    entityName,
    payload,
    listName,
    listKey,
    mode,
    assignId = false,
  } = action;

  const { result, entities } = norm(entityName, payload, assignId);

  const newIds = result;

  const newState = { ...state };

  // STEP 2: add entities to entity map(s)
  Object.keys(entities).forEach(entityKey => {
    const statePart = { ...state[entityKey] };

    statePart.values = {
      ...entities[entityKey],
      ...state[entityKey].values,
    };

    // STEP 3: append or replace ids
    if (listName && entityKey === entityName) {
      let list = [];

      if (mode === 'append') {
        const previousList = listKey
          ? (state[entityKey][listName] || {})[listKey]
          : state[entityKey][listName];

        if (previousList) list = previousList;
      }

      list = [...list, ...newIds];

      statePart[listName] = listKey
        ? { ...(state[entityKey][listName] || {}), [listKey]: list }
        : list;
    }

    newState[entityKey] = statePart;
  });

  return newState;
}

const reducer = createReducer(initialEntitiesState, {
  [actionNames.RECEIVE_ENTITIES]: receiveEntities,
  [actionNames.DELETE_ENTITIES]: deleteEntities,
});

export default reducer;

function entityMap(state: Store): EntityMap {
  const entities = {
    player: state.entities.player.values,
    team: state.entities.team.values,
    match: state.entities.match.values,
    statistic: state.entities.statistic.values,
  };

  return entities;
}

export const allPlayersSelector = (state: Store) =>
  state.entities.player.all.length
    ? denorm('player', entityMap(state), state.entities.player.all)
    : [];

export const matchSelector = (state: Store, id: number) =>
  denorm('match', entityMap(state), id);

export const allMatchesSelector = (state: Store) =>
  state.entities.match.all.length
    ? denorm('match', entityMap(state), state.entities.match.all)
    : [];

export const playerSelector = (state: Store, playerId: number) =>
  denorm('player', entityMap(state), playerId);

export const matchesByPlayerSelector = (state: Store, playerId: number) =>
  (state.entities.match.byPlayer[playerId] || []).length
    ? denorm('match', entityMap(state), state.entities.match.byPlayer[playerId])
    : [];

export const allStatisticSelector = (state: Store) =>
  state.entities.statistic.all.length
    ? denorm('statistic', entityMap(state), state.entities.statistic.all)
    : [];

export const statisticByPlayerSelector = (state: Store, playerId: number) =>
  (state.entities.statistic.byPlayer[playerId] || []).length
    ? denorm(
        'statistic',
        entityMap(state),
        state.entities.statistic.byPlayer[playerId][0],
      )
    : null;
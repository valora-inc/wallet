import { Actions, ActionTypes, InviteDetails } from 'src/invite/actions'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { RootState } from 'src/redux/reducers'

export interface State {
  invitees: InviteDetails[]
}

export const initialState: State = {
  invitees: [],
}

export const inviteReducer = (
  state: State | undefined = initialState,
  action: ActionTypes | RehydrateAction
): State => {
  switch (action.type) {
    case REHYDRATE: {
      return {
        invitees: getRehydratePayload(action, 'invite').invitees ?? [],
      }
    }
    case Actions.STORE_INVITEE_DATA:
      // TODO(Rossy / Tarik) decide on UI for showing users the invite codes they've sent, see #2639
      return {
        ...state,
        invitees: [...state.invitees, action.inviteDetails],
      }
    default:
      return state
  }
}

export const inviteesSelector = (state: RootState) => state.invite.invitees

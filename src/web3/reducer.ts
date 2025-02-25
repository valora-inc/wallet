import { REHYDRATE, RehydrateAction, getRehydratePayload } from 'src/redux/persist-helper'
import { ActionTypes, Actions } from 'src/web3/actions'

interface State {
  account: string | null // this is the wallet address (EOA)
  demoModeEnabled: boolean
}

const initialState: State = {
  account: null,
  demoModeEnabled: false,
}

export const reducer = (
  state: State | undefined = initialState,
  action: ActionTypes | RehydrateAction
): State => {
  switch (action.type) {
    case REHYDRATE: {
      // Ignore some persisted properties
      return {
        ...state,
        ...getRehydratePayload(action, 'web3'),
      }
    }
    case Actions.SET_ACCOUNT:
      return {
        ...state,
        account: action.address.toLowerCase(),
      }
    case Actions.DEMO_MODE_TOGGLED:
      return {
        ...state,
        demoModeEnabled: action.enabled,
      }
    default:
      return state
  }
}

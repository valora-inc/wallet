import { UpdateConfigValuesAction } from 'src/app/actions'
import { REHYDRATE, RehydrateAction, getRehydratePayload } from 'src/redux/persist-helper'
import { ActionTypes, Actions } from 'src/web3/actions'

interface State {
  account: string | null // this is the wallet address (EOA)
}

const initialState: State = {
  account: null,
}

export const reducer = (
  state: State | undefined = initialState,
  action: ActionTypes | RehydrateAction | UpdateConfigValuesAction
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
    default:
      return state
  }
}

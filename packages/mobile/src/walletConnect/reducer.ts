import WalletConnectClient from '@walletconnect/client'
import { RehydrateAction } from 'src/redux/persist-helper'
import { Actions, ActionTypes } from 'src/walletConnect/actions'

export interface State {
  connectedApplications: any[]
  pendingActions: any[]
  client: WalletConnectClient | null
}

const initialState: State = {
  client: null,
  connectedApplications: [],
  pendingActions: [],
}

export const reducer = (
  state: State = initialState,
  action: ActionTypes | RehydrateAction
): State => {
  switch (action.type) {
    case Actions.CLIENT_INITIALISED:
      return {
        ...state,
        client: action.client,
      }

    default:
      return state
  }
}

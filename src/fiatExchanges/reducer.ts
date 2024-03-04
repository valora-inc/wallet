import { RehydrateAction } from 'redux-persist'
import { Actions, ActionTypes } from 'src/fiatExchanges/actions'
import { getRehydratePayload, REHYDRATE } from 'src/redux/persist-helper'
import { RootState } from 'src/redux/reducers'

export interface ProviderLogos {
  [providerName: string]: string
}

export interface TxHashToProvider {
  [txHash: string]: string | undefined
}

export interface ProviderFeedInfo {
  name: string
  icon: string
}

interface TxHashToDisplayInfo {
  [txHash: string]: ProviderFeedInfo | undefined
}

interface State {
  txHashToProvider: TxHashToDisplayInfo
  providerLogos: ProviderLogos
}

const initialState = {
  txHashToProvider: {},
  providerLogos: {},
}

export const reducer = (
  state: State = initialState,
  action: ActionTypes | RehydrateAction
): State => {
  switch (action.type) {
    case REHYDRATE: {
      return {
        ...state,
        ...getRehydratePayload(action, 'fiatExchanges'),
      }
    }
    case Actions.SET_PROVIDER_LOGOS:
      return {
        ...state,
        providerLogos: action.providerLogos,
      }
    case Actions.ASSIGN_PROVIDER_TO_TX_HASH:
      const { txHash, displayInfo } = action

      return {
        ...state,
        txHashToProvider: {
          ...state.txHashToProvider,
          [txHash]: displayInfo,
        },
      }
    default:
      return state
  }
}

export const txHashToFeedInfoSelector = (state: RootState) => state.fiatExchanges.txHashToProvider
export const providerLogosSelector = (state: RootState) => state.fiatExchanges.providerLogos

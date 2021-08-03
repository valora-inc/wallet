import { RehydrateAction } from 'redux-persist'
import { Actions, ActionTypes } from 'src/fiatExchanges/actions'
import i18n from 'src/i18n'
import { getRehydratePayload, REHYDRATE } from 'src/redux/persist-helper'
import { RootState } from 'src/redux/reducers'
import { Currency } from 'src/utils/currencies'

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

export interface State {
  txHashToProvider: TxHashToDisplayInfo
  providerLogos: ProviderLogos
}

export const initialState = {
  txHashToProvider: {},
  providerLogos: {},
}

export const reducer = (state: State = initialState, action: ActionTypes | RehydrateAction) => {
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
      const { provider, currencyCode, txHash } = action

      const name =
        provider ??
        i18n.t(
          currencyCode === Currency.Celo
            ? 'fiatExchangeFlow:celoDeposit'
            : 'fiatExchangeFlow:cUsdDeposit'
        )

      const icon = provider
        ? state.providerLogos[provider]
        : 'https://firebasestorage.googleapis.com/v0/b/celo-mobile-alfajores.appspot.com/o/images%2Fcelo.jpg?alt=media'

      return {
        ...state,
        txHashToProvider: {
          ...state.txHashToProvider,
          [txHash]: { name, icon },
        },
      }
    default:
      return state
  }
}

export const txHashToFeedInfoSelector = (state: RootState) => state.fiatExchanges.txHashToProvider

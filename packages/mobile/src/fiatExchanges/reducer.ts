import { RehydrateAction } from 'redux-persist'
import { Actions, ActionTypes } from 'src/fiatExchanges/actions'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import i18n from 'src/i18n'
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

export interface State {
  lastUsedProvider: string | null
  txHashToProvider: TxHashToDisplayInfo
  providerLogos: ProviderLogos
}

export const initialState = {
  lastUsedProvider: null,
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
    case Actions.SELECT_PROVIDER:
      return {
        ...state,
        lastUsedProvider: action.provider,
      }
    case Actions.ASSIGN_PROVIDER_TO_TX_HASH:
      // Don't override if the tx already has a provider assigned.
      if (state.txHashToProvider[action.txHash]) {
        return state
      }

      let displayInfo
      if (state.lastUsedProvider) {
        displayInfo = state.providerLogos[state.lastUsedProvider]
      } else {
        const nameKey =
          action.currencyCode === CURRENCIES[CURRENCY_ENUM.GOLD].code
            ? 'fiatExchangeFlow:celoDeposit'
            : 'fiatExchangeFlow:cUsdDeposit'
        displayInfo = {
          name: i18n.t(nameKey),
          icon:
            'https://firebasestorage.googleapis.com/v0/b/celo-mobile-alfajores.appspot.com/o/images%2Fcelo.jpg?alt=media',
        }
      }

      return {
        ...state,
        lastUsedProvider: null,
        txHashToProvider: {
          ...state.txHashToProvider,
          [action.txHash]: displayInfo,
        },
      }
    case Actions.SET_PROVIDERS_FOR_TX_HASHES:
      const txHashToDisplayInfo: TxHashToDisplayInfo = {}
      for (const [txHash, provider] of Object.entries(action.txHashes)) {
        if (provider && state.providerLogos[provider]) {
          txHashToDisplayInfo[txHash] = {
            name: provider,
            icon: state.providerLogos[provider],
          }
        }
      }

      return {
        ...state,
        txHashToProvider: {
          ...state.txHashToProvider,
          ...txHashToDisplayInfo,
        },
      }
    default:
      return state
  }
}

export const lastUsedProviderSelector = (state: RootState) => state.fiatExchanges.lastUsedProvider
export const txHashToFeedInfoSelector = (state: RootState) => state.fiatExchanges.txHashToProvider

import { RehydrateAction } from 'redux-persist'
import { Actions, ActionTypes } from 'src/fiatExchanges/actions'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import i18n from 'src/i18n'
import { getRehydratePayload, REHYDRATE } from 'src/redux/persist-helper'
import { RootState } from 'src/redux/reducers'

export enum CicoProviderNames {
  MOONPAY = 'MOONPAY',
  RAMP = 'RAMP',
  SIMPLEX = 'SIMPLEX',
  TRANSAK = 'TRANSAK',
}

export const providersDisplayInfo: { [provider in CicoProviderNames]: ProviderFeedInfo } = {
  [CicoProviderNames.MOONPAY]: {
    name: 'Moonpay',
    icon:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fmoonpay.png?alt=media',
  },
  [CicoProviderNames.RAMP]: {
    name: 'Ramp',
    icon:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Framp.png?alt=media',
  },
  [CicoProviderNames.SIMPLEX]: {
    name: 'Simplex',
    icon:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media',
  },
  [CicoProviderNames.TRANSAK]: {
    name: 'Transak',
    icon:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Ftransak.png?alt=media',
  },
}

export interface TxHashToProvider {
  [txHash: string]: CicoProviderNames | undefined
}

interface ProviderFeedInfo {
  name: string
  icon: string
}

interface TxHashToDisplayInfo {
  [txHash: string]: ProviderFeedInfo | undefined
}

export interface State {
  lastUsedProvider: CicoProviderNames | null
  txHashToProvider: TxHashToDisplayInfo
}

export const initialState = {
  lastUsedProvider: null,
  txHashToProvider: {},
}

export const reducer = (state: State = initialState, action: ActionTypes | RehydrateAction) => {
  switch (action.type) {
    case REHYDRATE: {
      return {
        ...state,
        ...getRehydratePayload(action, 'fiatExchanges'),
      }
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
      let displayInfo = null
      if (state.lastUsedProvider) {
        displayInfo = providersDisplayInfo[state.lastUsedProvider]
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
        if (provider && providersDisplayInfo[provider]) {
          txHashToDisplayInfo[txHash] = providersDisplayInfo[provider]
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

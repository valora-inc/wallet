import { RehydrateAction } from 'redux-persist'
import { Actions, ActionTypes } from 'src/fiatExchanges/actions'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import i18n from 'src/i18n'
import { getRehydratePayload, REHYDRATE } from 'src/redux/persist-helper'
import { RootState } from 'src/redux/reducers'

export enum CiCoProvider {
  MOONPAY = 'MOONPAY',
  RAMP = 'RAMP',
  SIMPLEX = 'SIMPLEX',
  TRANSAK = 'TRANSAK',
}

export const providersDisplayInfo: { [provider in CiCoProvider]: ProviderFeedInfo } = {
  [CiCoProvider.MOONPAY]: {
    name: 'Moonpay',
    icon:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fmoonpay.png?alt=media&token=3617af49-7762-414d-a4d0-df05fbc49b97',
  },
  [CiCoProvider.RAMP]: {
    name: 'Ramp',
    icon:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Framp.png?alt=media&token=548ab5b9-7b03-49a2-a196-198f45958852',
  },
  [CiCoProvider.SIMPLEX]: {
    name: 'Simplex',
    icon:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media&token=6037b2f9-9d76-4076-b29e-b7e0de0b3f34',
  },
  [CiCoProvider.TRANSAK]: {
    name: 'Transak',
    icon:
      'https://storage.cloud.google.com/celo-mobile-mainnet.appspot.com/images/transak-icon.png',
  },
}

export interface TxHashToProvider {
  [txHash: string]: CiCoProvider | undefined
}

interface ProviderFeedInfo {
  name: string
  icon: string
}

interface TxHashToDisplayInfo {
  [txHash: string]: ProviderFeedInfo | undefined
}

export interface State {
  lastUsedProvider: CiCoProvider | null
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
      // Don't override in case it came from Firebase (Actions.SET_PROVIDERS_FOR_TX_HASHES).
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

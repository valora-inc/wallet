import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import BigNumber from 'bignumber.js'
import { REHYDRATE, RehydrateAction } from 'redux-persist'
import { getRehydratePayload } from 'src/redux/persist-helper'
import { NetworkId } from 'src/transactions/types'

export interface BaseToken {
  address: string | null
  tokenId: string
  decimals: number
  imageUrl?: string
  name: string
  symbol: string
  networkId: NetworkId
  priceFetchedAt?: number
  isNative?: boolean
  isFeeCurrency?: boolean
  canTransferWithComment?: boolean
  // Deprecated: This flag enables swapping the token in all the releases, use minimumAppVersionToSwap instead.
  isSwappable?: boolean
  minimumAppVersionToSwap?: string
  networkIconUrl?: string
  bridge?: string
  showZeroBalance?: boolean
  infoUrl?: string
  isCashInEligible?: boolean
  isCashOutEligible?: boolean
  isStableCoin?: boolean
}

interface HistoricalPricesUsd {
  lastDay: {
    price: BigNumber.Value
    at: number
  }
}

// Stored variant stores numbers as strings because BigNumber is not serializable.
export interface StoredTokenBalance extends BaseToken {
  balance: string | null
  priceUsd?: string
  historicalPricesUsd?: HistoricalPricesUsd
}

export interface StoredTokenBalanceWithAddress extends StoredTokenBalance {
  address: string
}

export interface StoredTokenBalanceWithAddress extends StoredTokenBalance {
  address: string
}

export interface TokenBalance extends BaseToken {
  balance: BigNumber
  priceUsd: BigNumber | null
  lastKnownPriceUsd: BigNumber | null
  historicalPricesUsd?: HistoricalPricesUsd
}

// The "WithAddress" suffixed types are legacy types, for places in the wallet
// that require an address to be present. Many are deprecated because in most places, we should
// be able to handle tokens without addresses the same way (just use tokenId instead if you need a token identifier).
// Exceptions include anything that directly interacts with the blockchain, where it makes a difference
// if a token doesn't have an address.

export interface TokenBalanceWithAddress extends TokenBalance {
  address: string
}

export interface NativeTokenBalance extends TokenBalance {
  isNative: true
}

export interface StoredTokenBalances {
  [tokenId: string]: StoredTokenBalance | undefined
}

/**
 * @deprecated use `StoredTokenBalances` for new code
 */
export interface StoredTokenBalancesWithAddress {
  [tokenId: string]: StoredTokenBalance | undefined
}

export interface TokenLoadingAction {
  showLoading: boolean
}

export interface TokenBalances {
  [tokenId: string]: TokenBalance | undefined
}

/**
 * @deprecated use `TokenBalances` for new code
 */
export interface TokenBalancesWithAddress {
  [tokenAddress: string]: TokenBalanceWithAddress | undefined
}

// Create imported token interface but from the base Token type

export interface State {
  tokenBalances: StoredTokenBalances
  loading: boolean
  error: boolean
  importedTokens: Record<string, BaseToken>
}

export function tokenBalanceHasAddress(
  tokenInfo: TokenBalance | TokenBalanceWithAddress
): tokenInfo is TokenBalanceWithAddress {
  return !!tokenInfo.address
}

export function isNativeTokenBalance(tokenInfo: TokenBalance): tokenInfo is NativeTokenBalance {
  return !!tokenInfo.isNative
}

export const initialState = {
  tokenBalances: {},
  loading: false,
  error: false,
  importedTokens: {},
}

const slice = createSlice({
  name: 'tokens',
  initialState,
  reducers: {
    setTokenBalances: (state, action: PayloadAction<StoredTokenBalances>) => ({
      ...state,
      tokenBalances: action.payload,
      loading: false,
      error: false,
    }),
    fetchTokenBalances: (state, action: PayloadAction<TokenLoadingAction>) => ({
      ...state,
      loading: action.payload.showLoading,
      error: false,
    }),
    fetchTokenBalancesSuccess: (state) => ({
      ...state,
      loading: false,
      error: false,
    }),
    fetchTokenBalancesFailure: (state) => ({
      ...state,
      loading: false,
      error: true,
    }),
    importToken: (state, action: PayloadAction<BaseToken>) => ({
      ...state,
      importedTokens: {
        ...state.importedTokens,
        [action.payload.tokenId]: action.payload,
      },
    }),
  },
  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state, action: RehydrateAction) => ({
      ...state,
      ...getRehydratePayload(action, 'tokens'),
    }))
  },
})

export const {
  setTokenBalances,
  fetchTokenBalances,
  fetchTokenBalancesSuccess,
  fetchTokenBalancesFailure,
  importToken,
} = slice.actions

export default slice.reducer

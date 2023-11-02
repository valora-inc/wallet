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
  // This field is for tokens that are part of the core contracts that allow paying for fees and
  // making transfers with a comment.
  isCoreToken?: boolean
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
// that require an address to be present. As we move to multichain, (where address
// is not guaranteed,) existing code should be updated to use the "address optional" types.
export interface TokenBalanceWithAddress extends TokenBalance {
  address: string
}

// The "WithAddress" suffixed types are legacy types, for places in the wallet
// that require an address to be present. As we move to multichain, (where address
// is not guaranteed,) existing code should be updated to use the "address optional" types.

/**
 * @deprecated use `TokenBalance` for new code
 */
export interface TokenBalanceWithAddress extends TokenBalance {
  address: string
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

export interface State {
  tokenBalances: StoredTokenBalances
  loading: boolean
  error: boolean
}

export function tokenBalanceHasAddress(
  tokenInfo: TokenBalance | TokenBalanceWithAddress
): tokenInfo is TokenBalanceWithAddress {
  return !!tokenInfo.address
}

export const initialState = {
  tokenBalances: {},
  loading: false,
  error: false,
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
} = slice.actions

export default slice.reducer

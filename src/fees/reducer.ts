import { createAction, createReducer } from '@reduxjs/toolkit'
import { FeeInfo } from 'src/fees/saga'

export enum FeeType {
  SEND = 'send',
  EXCHANGE = 'exchange',
  RECLAIM_ESCROW = 'reclaim-escrow',
  REGISTER_DEK = 'register-dek',
  SWAP = 'swap',
}

export interface FeeEstimateState {
  usdFee: string | null
  lastUpdated: number
  loading: boolean
  error: boolean
  feeInfo?: FeeInfo
}

export interface FeeEstimates {
  [tokenAddress: string]: {
    [feeType in FeeType]: FeeEstimateState | undefined
  }
}

interface State {
  estimates: FeeEstimates
}

const initialState: State = {
  estimates: {},
}

export interface EstimateFeeAction {
  feeType: FeeType
  tokenAddress: string
  paymentID?: string // Must be set if feeType === RECLAIM_ESCROW
}

export const estimateFee = createAction<EstimateFeeAction>('FEES/ESTIMATE_FEE')
export const feeEstimated = createAction<{
  tokenAddress: string
  feeType: FeeType
  estimation: FeeEstimateState
}>('FEES/FEE_ESTIMATED')

export const reducer = createReducer(initialState, (builder) => {
  builder
    .addCase(estimateFee, (state, action) => ({
      ...state,
      estimates: {
        ...state.estimates,
        [action.payload.tokenAddress]: {
          ...(state.estimates[action.payload.tokenAddress] ?? {}),
          [action.payload.feeType]: {
            loading: true,
            error: false,
            feeInWei: null,
            lastUpdated: null,
          },
        },
      },
    }))
    .addCase(feeEstimated, (state, action) => ({
      ...state,
      estimates: {
        ...state.estimates,
        [action.payload.tokenAddress]: {
          ...(state.estimates[action.payload.tokenAddress] ?? {}),
          [action.payload.feeType]: action.payload.estimation,
        },
      },
    }))
})

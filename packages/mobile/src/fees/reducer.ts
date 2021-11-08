import { createAction, createReducer } from '@reduxjs/toolkit'
import { FeeInfo } from 'src/fees/saga'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'

export enum FeeType {
  INVITE = 'invite',
  SEND = 'send',
  EXCHANGE = 'exchange',
  RECLAIM_ESCROW = 'reclaim-escrow',
  REGISTER_DEK = 'register-dek',
}

export interface FeeEstimateState {
  usdFee: string | null
  lastUpdated: number
  loading: boolean
  error: boolean
  feeInfo?: FeeInfo
}

export interface State {
  estimates: {
    [tokenAddress: string]: {
      [feeType in FeeType]: FeeEstimateState | undefined
    }
  }
}

export const initialState: State = {
  estimates: {},
}

export interface EstimateFeeAction {
  feeType: FeeType
  tokenAddress: string
  paymentID?: string // Must be set if feeType === RECLAIM_ESCROW
}

const rehydrate = createAction<any>(REHYDRATE)
export const estimateFee = createAction<EstimateFeeAction>('FEES/ESTIMATE_FEE')
export const feeEstimated = createAction<{
  tokenAddress: string
  feeType: FeeType
  estimation: FeeEstimateState
}>('FEES/FEE_ESTIMATED')

// Note that all the fees stored here are in cUSD.
export const reducer = createReducer(initialState, (builder) => {
  builder
    .addCase(rehydrate, (state, action) => {
      // hack to allow rehydrate actions here
      const hydrated = getRehydratePayload((action as unknown) as RehydrateAction, 'fees')
      return {
        ...state,
        ...hydrated,
      }
    })
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

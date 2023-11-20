import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { REHYDRATE, RehydrateAction } from 'redux-persist'
import { Actions as AppActions, UpdateConfigValuesAction } from 'src/app/actions'
import { getRehydratePayload } from 'src/redux/persist-helper'
import { SwapInfo, SwapInfoPrepared } from 'src/swap/types'

export enum SwapState {
  USER_INPUT = 'user-input',
  QUOTE = 'quote',
  START = 'start',
  APPROVE = 'approve',
  EXECUTE = 'execute',
  COMPLETE = 'complete',
  PRICE_CHANGE = 'price-change',
  ERROR = 'error',
}

export interface State {
  swapState: SwapState
  swapInfo: SwapInfo | null
  guaranteedSwapPriceEnabled: boolean
  priceImpactWarningThreshold: number
}

const initialState: State = {
  swapState: SwapState.QUOTE,
  swapInfo: null,
  guaranteedSwapPriceEnabled: false,
  priceImpactWarningThreshold: 0.04,
}

export const slice = createSlice({
  name: 'swap',
  initialState,
  reducers: {
    swapUserInput: (state) => {
      state.swapState = SwapState.USER_INPUT
      state.swapInfo = null
    },
    // Legacy
    swapStart: (state, action: PayloadAction<SwapInfo>) => {
      state.swapState = SwapState.START
      state.swapInfo = action.payload
    },
    // New flow with prepared transactions
    swapStartPrepared: (state, action: PayloadAction<SwapInfoPrepared>) => {
      state.swapState = SwapState.START
      // Compat for existing code
      state.swapInfo = {
        ...action.payload.quote.rawSwapResponse,
        userInput: action.payload.userInput,
        quoteReceivedAt: action.payload.quote.receivedAt,
      }
    },
    swapApprove: (state) => {
      state.swapState = SwapState.APPROVE
    },
    swapExecute: (state) => {
      state.swapState = SwapState.EXECUTE
    },
    swapSuccess: (state) => {
      state.swapState = SwapState.COMPLETE
      state.swapInfo = null
    },
    swapReset: (state) => {
      state.swapState = SwapState.USER_INPUT
      state.swapInfo = null
    },
    swapPriceChange: (state) => {
      state.swapState = SwapState.PRICE_CHANGE
    },
    swapError: (state) => {
      state.swapState = SwapState.ERROR
      state.swapInfo = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(
        AppActions.UPDATE_REMOTE_CONFIG_VALUES,
        (state, action: UpdateConfigValuesAction) => {
          state.guaranteedSwapPriceEnabled = action.configValues.guaranteedSwapPriceEnabled
          state.priceImpactWarningThreshold = action.configValues.priceImpactWarningThreshold
        }
      )
      .addCase(REHYDRATE, (state, action: RehydrateAction) => ({
        ...state,
        ...getRehydratePayload(action, 'swap'),
        swapState: SwapState.QUOTE,
        swapInfo: null,
      }))
  },
})

export const {
  swapUserInput,
  swapStart,
  swapStartPrepared,
  swapApprove,
  swapExecute,
  swapSuccess,
  swapReset,
  swapPriceChange,
  swapError,
} = slice.actions

export default slice.reducer

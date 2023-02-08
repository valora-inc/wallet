import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { REHYDRATE, RehydrateAction } from 'redux-persist'
import { Actions as AppActions, UpdateConfigValuesAction } from 'src/app/actions'
import { getRehydratePayload } from 'src/redux/persist-helper'
import { SwapInfo, SwapUserInput } from 'src/swap/types'

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
  swapUserInput: SwapUserInput | null
  guaranteedSwapPriceEnabled: boolean
}

const initialState: State = {
  swapState: SwapState.QUOTE,
  swapInfo: null,
  swapUserInput: null,
  guaranteedSwapPriceEnabled: false,
}

export const slice = createSlice({
  name: 'swap',
  initialState,
  reducers: {
    setSwapUserInput: (state, action: PayloadAction<SwapUserInput>) => {
      state.swapState = SwapState.USER_INPUT
      state.swapUserInput = action.payload
    },
    swapStart: (state, action: PayloadAction<SwapInfo>) => {
      state.swapState = SwapState.START
      state.swapInfo = action.payload
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
        }
      )
      .addCase(REHYDRATE, (state, action: RehydrateAction) => ({
        ...state,
        ...getRehydratePayload(action, 'swap'),
      }))
  },
})

export const {
  setSwapUserInput,
  swapStart,
  swapApprove,
  swapExecute,
  swapSuccess,
  swapReset,
  swapPriceChange,
  swapError,
} = slice.actions

export default slice.reducer

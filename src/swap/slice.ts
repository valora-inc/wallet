import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { REHYDRATE, RehydrateAction } from 'redux-persist'
import { Actions as AppActions, UpdateConfigValuesAction } from 'src/app/actions'
import { getRehydratePayload } from 'src/redux/persist-helper'
import { SwapInfo } from 'src/swap/types'

type SwapStatus = 'idle' | 'started' | 'success' | 'error'

interface SwapTask {
  id: string
  status: SwapStatus
}

export interface State {
  currentSwap: SwapTask | null
  guaranteedSwapPriceEnabled: boolean
  priceImpactWarningThreshold: number
}

const initialState: State = {
  currentSwap: null,
  guaranteedSwapPriceEnabled: false,
  priceImpactWarningThreshold: 0.04,
}

function updateCurrentSwapStatus(currentSwap: SwapTask | null, swapId: string, status: SwapStatus) {
  if (!currentSwap || currentSwap.id !== swapId) {
    return
  }
  currentSwap.status = status
}

export const slice = createSlice({
  name: 'swap',
  initialState,
  reducers: {
    swapStart: (state, action: PayloadAction<SwapInfo>) => {
      state.currentSwap = {
        id: action.payload.swapId,
        status: 'started',
      }
    },
    swapSuccess: (state, action: PayloadAction<string>) => {
      updateCurrentSwapStatus(state.currentSwap, action.payload, 'success')
    },
    swapError: (state, action: PayloadAction<string>) => {
      updateCurrentSwapStatus(state.currentSwap, action.payload, 'error')
    },
    swapCancel: (state, action: PayloadAction<string>) => {
      updateCurrentSwapStatus(state.currentSwap, action.payload, 'idle')
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
        currentSwap: null,
      }))
  },
})

export const { swapStart, swapSuccess, swapError, swapCancel } = slice.actions

export default slice.reducer

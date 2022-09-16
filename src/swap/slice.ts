import { createSlice } from '@reduxjs/toolkit'

export interface State {
  swapLoading: boolean
  swapError: boolean
  swapInfo: {} | null
}

const initialState: State = {
  swapLoading: false,
  swapError: false,
  swapInfo: null,
}

export const slice = createSlice({
  name: 'swap',
  initialState,
  reducers: {
    swapStart: (state, payload) => {
      state.swapLoading = true
      state.swapInfo = payload
    },
    swapError: (state) => {
      state.swapLoading = false
      state.swapError = true
    },
    swapSuccess: (state) => {
      ;(state.swapLoading = false), (state.swapError = false)
    },
  },
})

export const { swapStart, swapError, swapSuccess } = slice.actions

export default slice.reducer

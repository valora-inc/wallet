import { RootState } from 'src/redux/reducers'

export const swapStateSelector = (state: RootState) => state.swap.swapState

export const swapInfoSelector = (state: RootState) => state.swap.swapInfo

export const swapUserInputSelector = (state: RootState) => state.swap.swapUserInput

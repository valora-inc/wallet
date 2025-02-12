import { RootState } from 'src/redux/reducers'

export const currentSwapSelector = (state: RootState) => state.swap.currentSwap

export const lastSwappedSelector = (state: RootState) => state.swap.lastSwapped

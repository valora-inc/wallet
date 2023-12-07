import { RootState } from 'src/redux/reducers'

export const swapStateSelector = (state: RootState) => state.swap.swapState

export const currentSwapSelector = (state: RootState) => state.swap.currentSwap

export const guaranteedSwapPriceEnabledSelector = (state: RootState) =>
  state.swap.guaranteedSwapPriceEnabled

export const priceImpactWarningThresholdSelector = (state: RootState) =>
  state.swap.priceImpactWarningThreshold

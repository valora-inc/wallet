import { RootState } from 'src/redux/reducers'

export const currentSwapSelector = (state: RootState) => state.swap.currentSwap

export const guaranteedSwapPriceEnabledSelector = (state: RootState) =>
  state.swap.guaranteedSwapPriceEnabled

export const priceImpactWarningThresholdSelector = (state: RootState) =>
  state.swap.priceImpactWarningThreshold

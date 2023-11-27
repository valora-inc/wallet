import { RootState } from 'src/redux/reducers'

export const swapStateSelector = (state: RootState) => state.swap.swapState

export const swapInfoSelector = (state: RootState) => state.swap.swapInfo

export const guaranteedSwapPriceEnabledSelector = (state: RootState) =>
  state.swap.guaranteedSwapPriceEnabled

export const priceImpactWarningThresholdSelector = (state: RootState) =>
  state.swap.priceImpactWarningThreshold

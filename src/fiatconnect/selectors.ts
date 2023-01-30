import { CachedTransferDetails } from 'src/fiatconnect/slice'
import { RootState } from 'src/redux/reducers'

export const fiatConnectQuotesSelector = (state: RootState) => state.fiatConnect.quotes
export const fiatConnectQuotesLoadingSelector = (state: RootState) =>
  state.fiatConnect.quotesLoading
export const fiatConnectQuotesErrorSelector = (state: RootState) => state.fiatConnect.quotesError

export const cachedFiatAccountUsesSelector = (state: RootState) =>
  state.fiatConnect.cachedFiatAccountUses
export const attemptReturnUserFlowLoadingSelector = (state: RootState) =>
  state.fiatConnect.attemptReturnUserFlowLoading
export const selectFiatConnectQuoteLoadingSelector = (state: RootState) =>
  state.fiatConnect.selectFiatConnectQuoteLoading
export const fiatConnectTransferSelector = (state: RootState) => state.fiatConnect.transfer
export const fiatConnectProvidersSelector = (state: RootState) => state.fiatConnect.providers
export const sendingFiatAccountStatusSelector = (state: RootState) =>
  state.fiatConnect.sendingFiatAccountStatus
export const kycTryAgainLoadingSelector = (state: RootState) => state.fiatConnect.kycTryAgainLoading
export const cachedQuoteParamsSelector = (state: RootState) => state.fiatConnect.cachedQuoteParams
export const schemaCountryOverridesSelector = (state: RootState) =>
  state.fiatConnect.schemaCountryOverrides
export const personaInProgressSelector = (state: RootState) => state.fiatConnect.personaInProgress
export const getCachedFiatConnectTransferSelector =
  (txHash: string) =>
  (state: RootState): CachedTransferDetails | undefined =>
    state.fiatConnect.cachedTransfers[txHash]

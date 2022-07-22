import { RootState } from 'src/redux/reducers'

export const fiatConnectQuotesSelector = (state: RootState) => state.fiatConnect.quotes
export const fiatConnectQuotesLoadingSelector = (state: RootState) =>
  state.fiatConnect.quotesLoading
export const fiatConnectQuotesErrorSelector = (state: RootState) => state.fiatConnect.quotesError

export const fiatAccountsSelector = (state: RootState) => state.fiatConnect.fiatAccounts
export const fiatAccountsErrorSelector = (state: RootState) => state.fiatConnect.fiatAccountsError
export const fiatAccountsLoadingSelector = (state: RootState) =>
  state.fiatConnect.fiatAccountsLoading
export const cachedFiatAccountsSelector = (state: RootState) => state.fiatConnect.cachedFiatAccounts
export const fiatConnectTransferSelector = (state: RootState) => state.fiatConnect.transfer
export const fiatConnectProvidersSelector = (state: RootState) => state.fiatConnect.providers
export const fiatConnectProvidersLoadingSelector = (state: RootState) =>
  state.fiatConnect.providersLoading

import { RootState } from 'src/redux/reducers'

export const fiatConnectQuotesSelector = (state: RootState) => state.fiatConnect.quotes
export const fiatConnectQuotesLoadingSelector = (state: RootState) =>
  state.fiatConnect.quotesLoading
export const fiatConnectQuotesErrorSelector = (state: RootState) => state.fiatConnect.quotesError
export const fiatConnectTransferSelector = (state: RootState) => state.fiatConnect.transfer
export const fiatConnectProvidersSelector = (state: RootState) => state.fiatConnect.providers

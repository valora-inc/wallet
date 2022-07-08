import { FiatAccount } from 'src/fiatconnect/slice'
import { RootState } from 'src/redux/reducers'

export const fiatConnectQuotesSelector = (state: RootState) => state.fiatConnect.quotes
export const fiatConnectQuotesLoadingSelector = (state: RootState) =>
  state.fiatConnect.quotesLoading
export const fiatConnectQuotesErrorSelector = (state: RootState) => state.fiatConnect.quotesError

export const mostRecentFiatAccountSelector = (state: RootState): FiatAccount | null =>
  state.fiatConnect.mostRecentFiatAccounts[0] ?? null

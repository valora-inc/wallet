import { ObfuscatedFiatAccountData } from '@fiatconnect/fiatconnect-types'
import { FiatAccount } from 'src/fiatconnect/slice'
import { RootState } from 'src/redux/reducers'

export const fiatConnectQuotesSelector = (state: RootState) => state.fiatConnect.quotes
export const fiatConnectQuotesLoadingSelector = (state: RootState) =>
  state.fiatConnect.quotesLoading
export const fiatConnectQuotesErrorSelector = (state: RootState) => state.fiatConnect.quotesError

export const mostRecentFiatAccountSelector = (state: RootState): FiatAccount | null =>
  state.fiatConnect.mostRecentFiatAccountIds[0] ?? null

export const fiatAccountSelector = (state: RootState): ObfuscatedFiatAccountData | null =>
  state.fiatConnect.fiatAccount
export const fiatAccountErrorSelector = (state: RootState): string | null =>
  state.fiatConnect.fiatAccountError
export const fiatAccountLoadingSelector = (state: RootState): boolean =>
  state.fiatConnect.fiatAccountLoading

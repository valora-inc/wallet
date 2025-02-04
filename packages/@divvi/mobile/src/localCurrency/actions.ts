import { LocalCurrencyCode } from 'src/localCurrency/consts'

export enum Actions {
  FETCH_CURRENT_RATE_SUCCESS = 'LOCAL_CURRENCY/FETCH_CURRENT_RATE_SUCCESS',
  FETCH_CURRENT_RATE_FAILURE = 'LOCAL_CURRENCY/FETCH_CURRENT_RATE_FAILURE',
  SELECT_PREFERRED_CURRENCY = 'LOCAL_CURRENCY/SELECT_PREFERRED_CURRENCY',
}
export interface FetchCurrentRateSuccessAction {
  type: Actions.FETCH_CURRENT_RATE_SUCCESS
  currencyCode: LocalCurrencyCode
  usdToLocalRate: string
  now: number
}

export interface FetchCurrentRateFailureAction {
  type: Actions.FETCH_CURRENT_RATE_FAILURE
}

export interface SelectPreferredCurrencyAction {
  type: Actions.SELECT_PREFERRED_CURRENCY
  currencyCode: LocalCurrencyCode
}

export type ActionTypes =
  | FetchCurrentRateSuccessAction
  | FetchCurrentRateFailureAction
  | SelectPreferredCurrencyAction

export const fetchCurrentRateSuccess = (
  currencyCode: LocalCurrencyCode,
  usdToLocalRate: string,
  now: number
): FetchCurrentRateSuccessAction => ({
  type: Actions.FETCH_CURRENT_RATE_SUCCESS,
  currencyCode,
  usdToLocalRate,
  now,
})

export const fetchCurrentRateFailure = (): FetchCurrentRateFailureAction => ({
  type: Actions.FETCH_CURRENT_RATE_FAILURE,
})

export const selectPreferredCurrency = (
  currencyCode: LocalCurrencyCode
): SelectPreferredCurrencyAction => ({
  type: Actions.SELECT_PREFERRED_CURRENCY,
  currencyCode,
})

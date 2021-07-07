import { CURRENCIES, CURRENCY_ENUM } from '@celo/utils'

export const CGLD = CURRENCIES[CURRENCY_ENUM.GOLD].code
export const CUSD = CURRENCIES[CURRENCY_ENUM.DOLLAR].code
export const CEUR = CURRENCIES[CURRENCY_ENUM.EURO].code
export const EUR = 'EUR'
export const USD = 'USD'
export enum supportedStableTokens {
  CEUR,
  CUSD,
}
export enum supportedCurrencies {
  EUR,
  USD,
}
export enum supportedPairs {
  'cGLD/cUSD',
  'cUSD/cGLD',
  'cGLD/cEUR',
  'cEUR/cGLD',
}
export enum stablePairs {
  'cUSD/USD',
  'USD/cUSD',
  'EUR/cEUR',
  'cEUR/EUR',
}

export enum Currency {
  Celo = 'cGLD',
  Dollar = 'cUSD',
  Euro = 'cEUR',
}

export enum CiCoCurrency {
  CELO = 'CELO',
  CUSD = 'CUSD',
  CEUR = 'CEUR',
}

export interface CurrencyInfo {
  symbol: string
  displayDecimals: number
  cashTag: string
}

type CurrencyObject = { [key in Currency]: CurrencyInfo }

export type StableCurrency = Currency.Dollar | Currency.Euro
export const STABLE_CURRENCIES: StableCurrency[] = [Currency.Dollar, Currency.Euro]
export const ALL_CURRENCIES: Currency[] = [Currency.Dollar, Currency.Euro, Currency.Celo]

export const CURRENCIES: CurrencyObject = {
  [Currency.Celo]: {
    symbol: '',
    displayDecimals: 3,
    cashTag: 'CELO',
  },
  [Currency.Dollar]: {
    symbol: '$',
    displayDecimals: 2,
    cashTag: 'cUSD',
  },
  [Currency.Euro]: {
    symbol: '€',
    displayDecimals: 2,
    cashTag: 'cEUR',
  },
}

// TODO: maybe combine this with resolveCurrency
export function mapOldCurrencyToNew(currencyString: string): Currency {
  const oldMapping: Record<string, any> = {
    dollar: Currency.Dollar,
    euro: Currency.Euro,
    gold: Currency.Celo,
  }
  const currency = oldMapping[currencyString]
  if (currency) {
    return currency
  }

  if (currencyString in Currency) {
    return currencyString as Currency
  }

  // Default value
  return Currency.Dollar
}

export function resolveCurrency(currencyCode: string): Currency | undefined {
  const mapping: Record<string, Currency | undefined> = {
    CELO: Currency.Celo,
    CGLD: Currency.Celo,
    CUSD: Currency.Dollar,
    CEUR: Currency.Euro,
  }
  return mapping[currencyCode.toUpperCase()]
}

export enum Currency {
  Celo = 'cGLD',
  Dollar = 'cUSD',
  Euro = 'cEUR',
}

// Important: when adding new currencies, the string must match the symbol
// we use in address-metadata
export enum CiCoCurrency {
  CELO = 'CELO',
  cUSD = 'cUSD',
  cEUR = 'cEUR',
  cREAL = 'cREAL',
}

// A small hack to keep data continuity as we onboard cREAL but move away from the Currency enum
export type CurrencyOrCREAL = Currency | 'cReal'
export const currencyForAnalytics: {
  [key in CiCoCurrency]: CurrencyOrCREAL
} = {
  [CiCoCurrency.CELO]: Currency.Celo,
  [CiCoCurrency.cEUR]: Currency.Euro,
  [CiCoCurrency.cUSD]: Currency.Dollar,
  [CiCoCurrency.cREAL]: 'cReal',
}
export interface CurrencyInfo {
  symbol: string
  displayDecimals: number
  cashTag: string
}

type CurrencyObject = { [key in Currency]: CurrencyInfo }

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

export function resolveCurrency(currencyCode: string): Currency | undefined {
  const mapping: Record<string, Currency | undefined> = {
    CELO: Currency.Celo,
    CGLD: Currency.Celo,
    CUSD: Currency.Dollar,
    CEUR: Currency.Euro,
  }
  return mapping[currencyCode.toUpperCase()]
}

export function resolveCICOCurrency(currencyCode: string): CiCoCurrency {
  const mapping: Record<string, CiCoCurrency | undefined> = {
    CELO: CiCoCurrency.CELO,
    CGLD: CiCoCurrency.CELO,
    CUSD: CiCoCurrency.cUSD,
    CEUR: CiCoCurrency.cEUR,
    CREAL: CiCoCurrency.cREAL,
  }
  return mapping[currencyCode.toUpperCase()] || CiCoCurrency.CELO
}

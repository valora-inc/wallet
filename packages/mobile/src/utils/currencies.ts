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

interface CurrencyInfo {
  symbol: string
  displayDecimals: number
}

type CurrencyObject = { [key in Currency]: CurrencyInfo }

export type StableCurrency = Currency.Dollar | Currency.Euro

export const CURRENCIES: CurrencyObject = {
  [Currency.Celo]: {
    symbol: '',
    displayDecimals: 3,
  },
  [Currency.Dollar]: {
    symbol: '$',
    displayDecimals: 2,
  },
  [Currency.Euro]: {
    symbol: '€',
    displayDecimals: 2,
  },
}

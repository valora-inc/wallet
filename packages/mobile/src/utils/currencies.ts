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
}

type CurrencyObject = { [key in Currency]: CurrencyInfo }

export type StableCurrency = Currency.Dollar | Currency.Euro
export const STABLE_CURRENCIES: StableCurrency[] = [Currency.Dollar, Currency.Euro]

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

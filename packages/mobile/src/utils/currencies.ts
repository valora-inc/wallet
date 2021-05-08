export enum Currency {
  Celo = 'Celo Gold',
  Dollar = 'Celo Dollar',
  Euro = 'Celo Euro',
}

export interface CurrencyInfo {
  symbol: string
  code: string
  displayDecimals: number
}

type CurrencyObject = { [key in Currency]: CurrencyInfo }

export const CURRENCIES: CurrencyObject = {
  [Currency.Celo]: {
    symbol: '',
    code: 'cGLD',
    displayDecimals: 3,
  },
  [Currency.Dollar]: {
    symbol: '$',
    code: 'cUSD',
    displayDecimals: 2,
  },
  [Currency.Euro]: {
    symbol: '€',
    code: 'cEUR',
    displayDecimals: 2,
  },
}

export const currencyByCode = (code: string): Currency => {
  for (const [currency, currencyInfo] of Object.entries(CURRENCIES)) {
    if (currencyInfo.code === code) {
      return currency as Currency
    }
  }
  return Currency.Dollar
}

export const resolveCurrency = (label: string): Currency => {
  if (label && label.toLowerCase().includes('dollar')) {
    return Currency.Dollar
  } else if (label && label.toLowerCase().includes('euro')) {
    return Currency.Euro
  } else if (label && label.toLowerCase().includes('gold')) {
    return Currency.Celo
  } else {
    console.info('Unable to resolve currency from label: ' + label)
    return Currency.Dollar
  }
}

export enum ShortCurrency {
  Dollar = 'dollar',
  Celo = 'gold',
  Euro = 'euro',
}

export const currencyToShortMap = {
  [Currency.Dollar]: ShortCurrency.Dollar,
  [Currency.Celo]: ShortCurrency.Celo,
  [Currency.Euro]: ShortCurrency.Euro,
}

export const STABLE_CURRENCIES = [Currency.Dollar, Currency.Euro]

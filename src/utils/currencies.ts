export enum Currency {
  CNDL = 'CNDL',
  Dollar = 'cUSD',
  Euro = 'cEUR',
}

/**
 * @deprecated Should use tokenIds / symbols from token list instead.
 */
export enum CiCoCurrency {
  CNDL = 'CNDL',
  cUSD = 'cUSD',
  cEUR = 'cEUR',
  cREAL = 'cREAL',
}

export const tokenSymbolToAnalyticsCurrency = (symbol: string): string => {
  switch (symbol) {
    case 'cREAL':
      return 'cReal'
    case 'CNDL':
      return 'CNDL'
    default:
      return symbol
  }
}
export interface CurrencyInfo {
  symbol: string
  displayDecimals: number
  cashTag: string
}

type CurrencyObject = { [key in Currency]: CurrencyInfo }

export const CURRENCIES: CurrencyObject = {
  [Currency.CNDL]: {
    symbol: '',
    displayDecimals: 3,
    cashTag: 'CNDL',
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
    CNDL: Currency.CNDL,
    CUSD: Currency.Dollar,
    CEUR: Currency.Euro,
  }
  return mapping[currencyCode.toUpperCase()]
}

export function resolveCICOCurrency(currencyCode: string): CiCoCurrency {
  const mapping: Record<string, CiCoCurrency | undefined> = {
    CNDL: CiCoCurrency.CNDL,
    CUSD: CiCoCurrency.cUSD,
    CEUR: CiCoCurrency.cEUR,
    CREAL: CiCoCurrency.cREAL,
  }
  return mapping[currencyCode.toUpperCase()] || CiCoCurrency.CNDL
}

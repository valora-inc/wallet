import { FiatAccountType, FiatAccountTypeQuoteData } from '@fiatconnect/fiatconnect-types'
import BigNumber from 'bignumber.js'
import { FiatConnectQuoteError, FiatConnectQuoteSuccess } from 'src/fiatconnect'
import ExternalQuote from 'src/fiatExchanges/quotes/ExternalQuote'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import NormalizedQuote from 'src/fiatExchanges/quotes/NormalizedQuote'
import {
  CICOFlow,
  FetchProvidersOutput,
  RawProviderQuote,
  SimplexQuote,
} from 'src/fiatExchanges/utils'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'

const TAG = 'NormalizeQuotes'

// Take FiatConnect Quotes and External Provider Quotes and return NormalizedQuote class instances
export function normalizeQuotes(
  flow: CICOFlow,
  fiatConnectQuotes: (FiatConnectQuoteSuccess | FiatConnectQuoteError)[] = [],
  externalProviders: FetchProvidersOutput[] = []
): NormalizedQuote[] {
  return [
    ...normalizeFiatConnectQuotes(flow, fiatConnectQuotes),
    ...normalizeExternalProviders(flow, externalProviders),
  ].sort(quotesByFeeComparator)
}

export const quotesByFeeComparator = (quote1: NormalizedQuote, quote2: NormalizedQuote) => {
  // We can use a dummy exchange rate value here since its just a comparator
  const exchangeRates = {
    [Currency.Celo]: '1',
    [Currency.Dollar]: '1',
    [Currency.Euro]: '1',
    [Currency.Real]: '1',
  }
  const providerFee1 = quote1.getFeeInFiat(exchangeRates) ?? new BigNumber(Infinity)
  const providerFee2 = quote2.getFeeInFiat(exchangeRates) ?? new BigNumber(Infinity)

  return providerFee1.isGreaterThan(providerFee2) ? 1 : -1
}

const quoteHasErrors = (
  quote: FiatConnectQuoteSuccess | FiatConnectQuoteError
): quote is FiatConnectQuoteError => {
  return !quote.ok
}

export function normalizeFiatConnectQuotes(
  flow: CICOFlow,
  quotes: (FiatConnectQuoteSuccess | FiatConnectQuoteError)[]
): FiatConnectQuote[] {
  const normalizedQuotes: FiatConnectQuote[] = []

  quotes.forEach((quote) => {
    if (quoteHasErrors(quote)) {
      Logger.warn(TAG, `Error with quote for ${quote.provider.id}. ${quote.error}`)
    } else {
      // Iterate through every FiatAccountType. A single quote can have multiple
      Object.entries(quote.fiatAccount).forEach(
        ([key, value]: [string, FiatAccountTypeQuoteData | undefined]) => {
          try {
            const normalizedQuote = new FiatConnectQuote({
              quote,
              fiatAccountType: key as FiatAccountType,
              flow,
            })
            normalizedQuotes.push(normalizedQuote)
          } catch (err) {
            Logger.warn(TAG, err)
          }
        }
      )
    }
  })
  return normalizedQuotes
}

export function normalizeExternalProviders(
  flow: CICOFlow,
  input: FetchProvidersOutput[]
): NormalizedQuote[] {
  const normalizedQuotes: NormalizedQuote[] = []

  input.forEach((provider) => {
    try {
      if (provider.quote) {
        // Sometimes the quote is an array and sometimes its a single quote
        const quotes = Array.isArray(provider.quote) ? provider.quote : [provider.quote]
        quotes.forEach((quote: RawProviderQuote | SimplexQuote) => {
          const normalizedQuote = new ExternalQuote({ quote, provider, flow })
          normalizedQuotes.push(normalizedQuote)
        })
      }
    } catch (err) {
      Logger.warn(TAG, err)
    }
  })
  return normalizedQuotes
}

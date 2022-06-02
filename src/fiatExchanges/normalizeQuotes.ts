import { FiatAccountType, FiatAccountTypeQuoteData } from '@fiatconnect/fiatconnect-types'
import { FiatConnectQuoteError, FiatConnectQuoteSuccess } from 'src/fiatconnect'
import ExternalQuote from 'src/fiatExchanges/quotes/ExternalQuote'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import NormalizedQuote from 'src/fiatExchanges/quotes/NormalizedQuote'
import { CICOFlow, FetchProvidersOutput } from 'src/fiatExchanges/utils'
import Logger from 'src/utils/Logger'

const TAG = 'NormalizeQuotes'

export function normalizeQuotes(
  flow: CICOFlow,
  fiatConnectQuotes: (FiatConnectQuoteSuccess | FiatConnectQuoteError)[] = [],
  externalProviders: FetchProvidersOutput[] = []
): NormalizedQuote[] {
  return [
    ...normalizeFiatConnectQuotes(fiatConnectQuotes),
    ...normalizeExternalProviders(flow, externalProviders),
  ].sort(sortQuotesByFee)
}

export const sortQuotesByFee = (quote1: NormalizedQuote, quote2: NormalizedQuote) => {
  const providerFee1 = quote1.getFee() ?? 0
  const providerFee2 = quote2.getFee() ?? 0

  return providerFee1 > providerFee2 ? 1 : -1
}

const quoteHasErrors = (
  quote: FiatConnectQuoteSuccess | FiatConnectQuoteError
): quote is FiatConnectQuoteError => {
  return !quote.ok
}

export function normalizeFiatConnectQuotes(
  quotes: (FiatConnectQuoteSuccess | FiatConnectQuoteError)[]
): NormalizedQuote[] {
  const normalizedQuotes: NormalizedQuote[] = []

  quotes?.forEach((quote) => {
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

  input?.forEach((provider) => {
    try {
      // Sometimes the quote is an array and sometimes its a single quote
      const quotes = Array.isArray(provider.quote) ? provider.quote : [provider.quote]
      quotes.forEach((quote) => {
        if (quote) {
          const normalizedQuote = new ExternalQuote({ quote, provider, flow })
          normalizedQuotes.push(normalizedQuote)
        }
      })
    } catch (err) {
      Logger.warn(TAG, err)
    }
  })
  return normalizedQuotes
}

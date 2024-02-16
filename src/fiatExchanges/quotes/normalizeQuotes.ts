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
import Logger from 'src/utils/Logger'

const TAG = 'NormalizeQuotes'

// Take FiatConnect Quotes and External Provider Quotes and return NormalizedQuote class instances
export function normalizeQuotes(
  flow: CICOFlow,
  fiatConnectQuotes: (FiatConnectQuoteSuccess | FiatConnectQuoteError)[] = [],
  externalProviders: FetchProvidersOutput[] = [],
  tokenId: string,
  tokenSymbol: string
): NormalizedQuote[] {
  return [
    ...normalizeFiatConnectQuotes(flow, fiatConnectQuotes, tokenId),
    ...normalizeExternalProviders({ flow, input: externalProviders, tokenId, tokenSymbol }),
  ].sort(quotesByReceiveAmountComparator)
}

export const quotesByReceiveAmountComparator = (
  quote1: NormalizedQuote,
  quote2: NormalizedQuote
) => {
  const receiveAmount1 = quote1.getReceiveAmount() ?? new BigNumber(-1)
  const receiveAmount2 = quote2.getReceiveAmount() ?? new BigNumber(-1)

  return receiveAmount1.isGreaterThan(receiveAmount2) ? -1 : 1
}

const quoteHasErrors = (
  quote: FiatConnectQuoteSuccess | FiatConnectQuoteError
): quote is FiatConnectQuoteError => {
  return !quote.ok
}

export function normalizeFiatConnectQuotes(
  flow: CICOFlow,
  quotes: (FiatConnectQuoteSuccess | FiatConnectQuoteError)[],
  tokenId: string
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
              tokenId,
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

export function normalizeExternalProviders({
  flow,
  input,
  tokenId,
  tokenSymbol,
}: {
  flow: CICOFlow
  input: FetchProvidersOutput[]
  tokenId: string
  tokenSymbol: string
}): NormalizedQuote[] {
  const normalizedQuotes: NormalizedQuote[] = []
  input.forEach((provider) => {
    try {
      const quotes: (RawProviderQuote | SimplexQuote)[] = []
      if (Array.isArray(provider.quote)) {
        // If the quote object is an array, it may contain quotes, or be empty.
        // If it is empty, it does not necessarily mean that the provider does not
        // support transfers.
        if (provider.quote.length) {
          quotes.push(...provider.quote)
        } else if (!provider.unavailable && !provider.restricted) {
          // If no quotes are provided, but the provider is not marked as unavailable,
          // this means the provider supports transfers, but does not give specific quote details.
          // We construct a partial quote object for each payment method. N.B., this will never occur
          // for Simplex quotes, which are a special case.
          provider.paymentMethods.forEach((paymentMethod) =>
            quotes.push({
              digitalAsset: tokenSymbol,
              paymentMethod,
            })
          )
        }
      } else if (provider.quote) {
        // If the quote is not an array, but does exist, we assume it to be an object representing
        // a single quote.
        quotes.push(provider.quote)
      }

      quotes.forEach((quote: RawProviderQuote | SimplexQuote) => {
        const normalizedQuote = new ExternalQuote({ quote, provider, flow, tokenId })
        normalizedQuotes.push(normalizedQuote)
      })
    } catch (err) {
      Logger.warn(TAG, err)
    }
  })
  return normalizedQuotes
}

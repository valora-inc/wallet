import { FiatAccountType, FiatAccountTypeQuoteData } from '@fiatconnect/fiatconnect-types'
import BigNumber from 'bignumber.js'
import { FiatConnectQuoteError, FiatConnectQuoteSuccess } from 'src/fiatconnect'
import ExternalQuote from 'src/fiatExchanges/quotes/ExternalQuote'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import NormalizedQuote from 'src/fiatExchanges/quotes/NormalizedQuote'
import { CICOFlow, CicoQuote } from 'src/fiatExchanges/types'
import Logger from 'src/utils/Logger'

const TAG = 'NormalizeQuotes'

// Take FiatConnect Quotes and External Cico Quotes and return NormalizedQuote class instances
export function normalizeQuotes({
  flow,
  fiatConnectQuotes = [],
  cicoQuotes = [],
  tokenId,
}: {
  flow: CICOFlow
  fiatConnectQuotes?: (FiatConnectQuoteSuccess | FiatConnectQuoteError)[]
  cicoQuotes?: CicoQuote[]
  tokenId: string
}): NormalizedQuote[] {
  return [
    ...normalizeFiatConnectQuotes(flow, fiatConnectQuotes, tokenId),
    ...cicoQuotes.map((quote) => new ExternalQuote(quote)),
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

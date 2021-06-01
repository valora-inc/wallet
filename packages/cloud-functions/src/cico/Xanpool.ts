import { DigitalAsset, FETCH_TIMEOUT_DURATION, XANPOOL_DATA } from '../config'
import { PaymentMethod, ProviderQuote, UserLocationData } from './fetchProviders'
import { fetchLocalCurrencyAndExchangeRate, fetchWithTimeout, findContinguousSpaces } from './utils'

interface XanpoolQuote {
  crypto: number
  fiat: number
  cryptoPrice: number
  cryptoPriceUsd: number
  total: number
  serviceCharge: number
  referralDiscount: number
  referralDiscountInXlp: number
  referralDiscountInUsd: number
  payoutServiceCharge: number
  earnedXlp: number
  processingTime: string
  currency: string
}

export const Xanpool = {
  fetchQuote: async (
    txType: 'buy' | 'sell',
    digitalAsset: DigitalAsset,
    fiatCurrency: string,
    amount: number | undefined,
    userLocation: UserLocationData
  ): Promise<ProviderQuote[]> => {
    try {
      if (!amount) {
        throw Error('Amount not provided')
      }

      const { localCurrency, localAmount, exchangeRate } = await Xanpool.convertToLocalCurrency(
        userLocation.country,
        fiatCurrency,
        amount
      )

      if (!XANPOOL_DATA.supported_currencies.includes(localCurrency)) {
        throw Error('Currency not supported')
      }

      const baseUrl = `
        ${XANPOOL_DATA.api_url}
        /transactions
        /estimate
      `.replace(findContinguousSpaces, '')

      const requestBody =
        txType === 'buy'
          ? {
              type: 'buy',
              cryptoCurrency: digitalAsset,
              currency: localCurrency,
              fiat: localAmount,
            }
          : {
              type: 'sell',
              cryptoCurrency: digitalAsset,
              currency: localCurrency,
              crypto: amount,
            }

      const quote = await Xanpool.post(baseUrl, requestBody)

      return Xanpool.processRawQuotes(quote, exchangeRate, digitalAsset)
    } catch (error) {
      console.error('Error fetching Xanpool quote: ', error)
      return []
    }
  },
  convertToLocalCurrency: async (
    country: string | null,
    baseCurrency: string,
    baseCurrencyAmount: number
  ) => {
    const { localCurrency, exchangeRate } = await fetchLocalCurrencyAndExchangeRate(
      country,
      baseCurrency
    )

    return {
      localCurrency,
      exchangeRate,
      localAmount: baseCurrencyAmount * exchangeRate,
    }
  },
  processRawQuotes: (
    quote: XanpoolQuote | null,
    exchangeRate: number,
    digitalAsset: DigitalAsset
  ) => {
    const quotes: ProviderQuote[] = []
    if (quote) {
      quotes.push({
        paymentMethod: PaymentMethod.Bank,
        fiatFee: (quote.serviceCharge * quote.cryptoPrice) / exchangeRate,
        returnedAmount: quote.total,
        digitalAsset,
      })
    }

    return quotes
  },
  post: async (path: string, body: any) => {
    try {
      const response = await fetchWithTimeout(
        path,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
        FETCH_TIMEOUT_DURATION
      )

      const data = await response.json()
      if (!response.ok) {
        throw Error(`Response body: ${JSON.stringify(data)}`)
      }

      const quote: XanpoolQuote = data
      return quote
    } catch (error) {
      console.error(`Xanpool post request failed.\nURL: ${path}\n`, error)
      return null
    }
  },
}

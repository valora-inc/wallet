import { DigitalAsset, FETCH_TIMEOUT_DURATION, XANPOOL_DATA } from '../config'
import { PaymentMethod, ProviderQuote, UserLocationData } from './fetchProviders'
import { fetchLocalCurrencyAndExchangeRate, fetchWithTimeout } from './utils'

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

const Xanpool = {
  fetchQuote: async (
    txType: 'buy' | 'sell',
    digitalAsset: DigitalAsset,
    fiatCurrency: string,
    amount: number | undefined,
    userLocation: UserLocationData
  ) => {
    try {
      if (!amount) {
        throw Error('Amount not provided')
      }

      const { localCurrency, exchangeRate } = await fetchLocalCurrencyAndExchangeRate(
        userLocation.country,
        fiatCurrency
      )
      const localFiatAmount = amount * exchangeRate

      if (!XANPOOL_DATA.supported_currencies.includes(localCurrency)) {
        throw Error('Currency not supported')
      }

      const url = `
        ${XANPOOL_DATA.api_url}
        /transactions
        /estimate
      `.replace(/\s+/g, '')

      const requestBody =
        txType === 'buy'
          ? {
              type: 'buy',
              cryptoCurrency: digitalAsset,
              currency: localCurrency,
              fiat: localFiatAmount,
            }
          : {
              type: 'sell',
              cryptoCurrency: digitalAsset,
              currency: localCurrency,
              crypto: amount,
            }

      const bankQuote = await Xanpool.post(url, requestBody)
      if (!bankQuote) {
        throw Error('Could not fetch any quotes')
      }

      const quotes: ProviderQuote[] = [
        {
          paymentMethod: PaymentMethod.Bank,
          fiatFee: (bankQuote.serviceCharge * bankQuote.cryptoPrice) / exchangeRate,
          returnedAmount: bankQuote.total,
          digitalAsset,
        },
      ]

      if (!quotes.length) {
        return
      }

      return quotes
    } catch (error) {
      console.error('Error fetching Xanpool quote: ', error)
    }
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

      if (!response) {
        throw Error('Received no response')
      }

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

export default Xanpool

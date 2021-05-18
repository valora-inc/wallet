import { DigitalAsset, FETCH_TIMEOUT_DURATION, MOONPAY_DATA } from '../config'
import { PaymentMethod, StandardizedProviderQuote, UserLocationData } from './fetchProviders'
import { fetchWithTimeout } from './utils'

interface MoonpayQuote {
  baseCurrency: {
    id: string
    createdAt: string
    updatedAt: string
    type: string
    name: string
    code: string
    precision: number
  }
  baseCurrencyAmount: number
  currency: {
    id: string
    createdAt: string
    updatedAt: string
    type: string
    name: string
    code: string
    precision: number
    addressRegex: string
    testnetAddressRegex: string
    minAmount: number
    maxAmount: number
    supportsAddressTag: boolean
    addressTagRegex: string | null
    supportsTestMode: boolean
    isSuspended: boolean
    isSupportedInUS: boolean
    isSellSupported: boolean
    notAllowedUSStates: string[]
  }
  extraFeeAmount: number
  feeAmount: number
  networkFeeAmount: number
  paymentMethod: string
  quoteCurrencyAmount: number
  totalAmount: number
}

const Moonpay = {
  fetchQuote: async (
    digitalAsset: DigitalAsset,
    fiatCurrency: string,
    fiatAmount: number | undefined,
    userLocation: UserLocationData,
    unsupported: boolean
  ) => {
    try {
      if (unsupported) {
        throw Error('Location not supported')
      }

      if (!fiatAmount) {
        throw Error('Purchase amount not provided')
      }

      const paymentMethods = ['sepa_bank_transfer', 'gbp_bank_transfer', 'credit_debit_card']
      const baseUrl = `
        ${MOONPAY_DATA.api_url}
        /v3
        /currencies
        /${digitalAsset}
        /buy_quote
        /?apiKey=${MOONPAY_DATA.public_key}
        &baseCurrencyCode=${fiatCurrency}
        {fiat&baseCurrencyAmount=${fiatAmount}
      `.replace(/\s+/g, '')

      const responses: Response[] = await Promise.all(
        paymentMethods.map((method) => Moonpay.get(`${baseUrl}&paymentMethod=${method}`))
      )

      if (responses.every((response) => !response.ok)) {
        throw Error(
          `Fetchs failed with status codes ${responses[0].status} & ${responses[1].status}`
        )
      }

      const [sepaQuote, gbpQuote, cardQuote]: MoonpayQuote[] | null[] = await Promise.all(
        responses.map(async (response) => {
          if (response.ok) {
            return await response.json()
          }
          return null
        })
      )

      const quotes: StandardizedProviderQuote[] = []

      if (gbpQuote && userLocation.country === 'GB') {
        quotes.push({
          paymentMethod: PaymentMethod.Bank,
          fee: gbpQuote.feeAmount + gbpQuote.extraFeeAmount + gbpQuote.networkFeeAmount,
          totalAssetsAcquired: gbpQuote.quoteCurrencyAmount,
        })
      } else if (sepaQuote) {
        quotes.push({
          paymentMethod: PaymentMethod.Bank,
          fee: sepaQuote.feeAmount + sepaQuote.extraFeeAmount + sepaQuote.networkFeeAmount,
          totalAssetsAcquired: sepaQuote.quoteCurrencyAmount,
        })
      }

      if (cardQuote) {
        quotes.push({
          paymentMethod: PaymentMethod.Card,
          fee: cardQuote.feeAmount + cardQuote.extraFeeAmount + cardQuote.networkFeeAmount,
          totalAssetsAcquired: cardQuote.quoteCurrencyAmount,
        })
      }

      return quotes
    } catch (error) {
      console.error('Error fetching Moonpay quote: ', error)
    }
  },
  get: async (path: string) => {
    try {
      const response = await fetchWithTimeout(path, null, FETCH_TIMEOUT_DURATION)

      if (!response || !response.ok) {
        throw Error(`Moonpay get request failed with status ${response?.status}`)
      }

      return response
    } catch (error) {
      throw error
    }
  },
}

export default Moonpay

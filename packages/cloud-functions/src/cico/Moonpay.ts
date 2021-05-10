import { DigitalAsset, FETCH_TIMEOUT_DURATION, MOONPAY_DATA } from '../config'
import { PaymentMethod } from './fetchProviders'
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
  // From: https://support.moonpay.com/hc/en-gb/articles/360011931517-How-much-does-it-cost-to-buy-cryptocurrency-with-MoonPay-
  getFeePolicy: () => ({
    [PaymentMethod.Card]: {
      percent: 4.5,
      minimum: 3.99,
    },
    [PaymentMethod.Bank]: {
      percent: 1,
      minimum: 3.99,
    },
  }),
  fetchQuote: async (digitalAsset: DigitalAsset, fiatCurrency: string, fiatAmount: number) => {
    try {
      const paymentMethods = ['sepa_bank_transfer', 'credit_debit_card']
      const baseUrl = `
        ${MOONPAY_DATA.api_url}
        /v3
        /currencies
        /${digitalAsset}
        /buy_quote
        /?apiKey=${MOONPAY_DATA.public_key}
        &baseCurrencyCode=${fiatCurrency}
        &baseCurrencyAmount=${fiatAmount}
      `.replace(/\s+/g, '')

      const responses: Response[] = await Promise.all(
        paymentMethods.map((method) => Moonpay.get(`${baseUrl}&paymentMethod=${method}`))
      )

      if (responses.every((response) => !response.ok)) {
        throw Error(
          `Fetchs failed with status codes ${responses[0].status} & ${responses[1].status}`
        )
      }

      const [bankQuote, cardQuote]: MoonpayQuote[] = await Promise.all(
        responses.map((response) => response.json())
      )

      return {
        bank: {
          fee: bankQuote.feeAmount + bankQuote.extraFeeAmount + bankQuote.networkFeeAmount,
          totalAssetsAcquired: bankQuote.quoteCurrencyAmount,
        },
        card: {
          fee: cardQuote.feeAmount + cardQuote.extraFeeAmount + cardQuote.networkFeeAmount,
          totalAssetsAcquired: cardQuote.quoteCurrencyAmount,
        },
      }
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

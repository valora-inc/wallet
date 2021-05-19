import { DigitalAsset, FETCH_TIMEOUT_DURATION, TRANSAK_DATA } from '../config'
import { PaymentMethod, ProviderQuote, UserLocationData } from './fetchProviders'
import { fetchWithTimeout } from './utils'

interface TransakQuote {
  quoteId: string
  conversionPrice: number
  marketConversionPrice: number
  slippage: number
  fiatCurrency: string
  cryptoCurrency: string
  paymentMethod: string
  fiatAmount: number
  cryptoAmount: number
  isBuyOrSell: string
  network: string
  feeDecimal: number
  totalFee: number
  feeBreakdown: [
    {
      name: 'Network/Exchange fee'
      value: number
      id: 'network_fee' | 'network_fee_by_fiat_partner'
      ids: ['network_fee', 'network_fee_by_fiat_partner']
    },
    {
      name: 'Card processing fee'
      value: number
      id: 'fiat_liquidity_provider_fee'
      ids: ['fiat_liquidity_provider_fee']
    }
  ]
  nonce: number
  convertedFiatAmount: number
  convertedFiatCurrency: string
}

const Transak = {
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

      const paymentMethods = ['credit_debit_card']

      if (userLocation.country === 'IN') {
        paymentMethods.push('neft_bank_transfer')
      } else if (userLocation.country === 'GB') {
        paymentMethods.push('gbp_bank_transfer')
      } else {
        paymentMethods.push('sepa_bank_transfer')
      }

      const baseUrl = `
        ${TRANSAK_DATA.api_url}
        /v2
        /currencies
        /price
        /cryptocurrency=${digitalAsset}
        &fiatCurrency=${fiatCurrency}
        &fiatAmount=${fiatAmount}
        &isBuyOrSell='BUY'
      `.replace(/\s+/g, '')

      const responses: Response[] = await Promise.all(
        paymentMethods.map((method) => Transak.get(`${baseUrl}&paymentMethodId=${method}`))
      )

      if (responses.every((response) => !response.ok)) {
        throw Error(
          `Fetchs failed with status codes ${responses[0].status} & ${responses[1].status}`
        )
      }

      const [cardQuote, bankQuote]: TransakQuote[] | null[] = await Promise.all(
        responses.map(async (response) => {
          if (response.ok) {
            return await response.json()
          }
          return null
        })
      )

      const quotes: ProviderQuote[] = []

      if (cardQuote) {
        quotes.push({
          paymentMethod: PaymentMethod.Card,
          fiatFee: cardQuote.totalFee,
          digitalAssetsAmount: cardQuote.cryptoAmount,
          digitalAsset: cardQuote.cryptoCurrency,
          fiatCurrency: cardQuote.fiatCurrency,
        })
      }

      if (bankQuote) {
        quotes.push({
          paymentMethod: PaymentMethod.Bank,
          fiatFee: bankQuote.totalFee,
          digitalAssetsAmount: bankQuote.cryptoAmount,
          digitalAsset: bankQuote.cryptoCurrency,
          fiatCurrency: bankQuote.fiatCurrency,
        })
      }

      return quotes
    } catch (error) {
      console.error('Error fetching Transak quote: ', error)
    }
  },
  get: async (path: string) => {
    try {
      const response = await fetchWithTimeout(path, null, FETCH_TIMEOUT_DURATION)

      if (!response || !response.ok) {
        throw Error(`Transak get request failed with status ${response?.status}`)
      }

      return response
    } catch (error) {
      throw error
    }
  },
}

export default Transak

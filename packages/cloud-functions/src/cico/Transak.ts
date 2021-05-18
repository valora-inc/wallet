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

      const paymentMethods = [
        'sepa_bank_transfer',
        'gbp_bank_transfer',
        'neft_bank_transfer',
        'credit_debit_card',
      ]
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

      const [sepaQuote, gbpQuote, neftQuote, cardQuote]:
        | TransakQuote[]
        | null[] = await Promise.all(
        responses.map(async (response) => {
          if (response.ok) {
            return await response.json()
          }
          return null
        })
      )

      const quotes: ProviderQuote[] = []

      if (neftQuote && userLocation.country === 'IN') {
        quotes.push({
          paymentMethod: PaymentMethod.Bank,
          fiatFee: neftQuote.totalFee,
          digitalAssetsAmount: neftQuote.cryptoAmount,
          digitalAsset: neftQuote.cryptoCurrency,
          fiatCurrency: neftQuote.fiatCurrency,
        })
      } else if (gbpQuote && userLocation.country === 'GB') {
        quotes.push({
          paymentMethod: PaymentMethod.Bank,
          fiatFee: gbpQuote.totalFee,
          digitalAssetsAmount: gbpQuote.cryptoAmount,
          digitalAsset: gbpQuote.cryptoCurrency,
          fiatCurrency: gbpQuote.fiatCurrency,
        })
      } else if (sepaQuote) {
        quotes.push({
          paymentMethod: PaymentMethod.Bank,
          fiatFee: sepaQuote.totalFee,
          digitalAssetsAmount: sepaQuote.cryptoAmount,
          digitalAsset: sepaQuote.cryptoCurrency,
          fiatCurrency: sepaQuote.fiatCurrency,
        })
      }

      if (cardQuote) {
        quotes.push({
          paymentMethod: PaymentMethod.Card,
          fiatFee: cardQuote.totalFee,
          digitalAssetsAmount: cardQuote.cryptoAmount,
          digitalAsset: cardQuote.cryptoCurrency,
          fiatCurrency: cardQuote.fiatCurrency,
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

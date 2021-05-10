import { DigitalAsset, FETCH_TIMEOUT_DURATION, TRANSAK_DATA } from '../config'
import { PaymentMethod } from './fetchProviders'
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
  // From: https://www.notion.so/On-ramp-Buy-Crypto-976ee96fc0764628ba990b550b1310d3
  getFeePolicy: () => ({
    [PaymentMethod.Card]: {
      percentage: 3.9,
      fixedFee: 0.3,
      minimum: 5,
    },
    [PaymentMethod.Bank]: {
      percentage: [0.25, 0.5],
      minimum: 5,
    },
  }),
  fetchQuote: async (digitalAsset: DigitalAsset, fiatCurrency: string, fiatAmount: number) => {
    try {
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
        ?partnerApiKey=${TRANSAK_DATA.public_key}
        &cryptocurrency=${digitalAsset}
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

      const [sepaQuote, gbpQuote, neftQuote, cardQuote]: TransakQuote[] = await Promise.all(
        responses.map((response) => response.json())
      )

      return {
        bank: [
          {
            type: 'sepa',
            fee: sepaQuote.totalFee,
            totalAssetsAcquired: sepaQuote.cryptoAmount,
          },
          {
            type: 'gbp',
            fee: gbpQuote.totalFee,
            totalAssetsAcquired: gbpQuote.cryptoAmount,
          },
          {
            type: 'neft',
            fee: neftQuote.totalFee,
            totalAssetsAcquired: neftQuote.cryptoAmount,
          },
        ],
        card: {
          fee: cardQuote.totalFee,
          totalAssetsAcquired: cardQuote.cryptoAmount,
        },
      }
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

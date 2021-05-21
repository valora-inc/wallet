import { DigitalAsset, FETCH_TIMEOUT_DURATION, TRANSAK_DATA } from '../config'
import { PaymentMethod, ProviderQuote, UserLocationData } from './fetchProviders'
import { bankingSystemToCountry } from './providerAvailability'
import { fetchLocalCurrencyAndExchangeRate, fetchWithTimeout } from './utils'

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
    userLocation: UserLocationData
  ) => {
    try {
      if (!fiatAmount) {
        throw Error('Purchase amount not provided')
      }

      const { localCurrency, exchangeRate } = await fetchLocalCurrencyAndExchangeRate(
        userLocation.country,
        fiatCurrency
      )
      const localFiatAmount = fiatAmount * exchangeRate

      const paymentMethods = ['credit_debit_card']
      if (userLocation.country) {
        if (bankingSystemToCountry.neft[userLocation.country]) {
          paymentMethods.push('neft_bank_transfer')
        } else if (bankingSystemToCountry.gbp[userLocation.country]) {
          paymentMethods.push('gbp_bank_transfer')
        } else if (bankingSystemToCountry.sepa[userLocation.country]) {
          paymentMethods.push('sepa_bank_transfer')
        }
      }

      const baseUrl = `
        ${TRANSAK_DATA.api_url}
        /v2
        /currencies
        /price
        ?partnerApiKey=${TRANSAK_DATA.public_key}
        &cryptoCurrency=${digitalAsset}
        &fiatCurrency=${localCurrency}
        &fiatAmount=${localFiatAmount}
        &isBuyOrSell=BUY
      `.replace(/\s+/g, '')

      const rawQuotes: Array<TransakQuote | null> = await Promise.all(
        paymentMethods.map((method) => Transak.get(`${baseUrl}&paymentMethodId=${method}`))
      )

      const quotes: ProviderQuote[] = []
      for (const quote of rawQuotes) {
        if (!quote) {
          continue
        }

        const paymentMethod =
          quote.paymentMethod === 'credit_debit_card' ? PaymentMethod.Card : PaymentMethod.Bank

        quotes.push({
          paymentMethod,
          fiatFee: quote.totalFee / exchangeRate,
          returnedAmount: quote.cryptoAmount,
          digitalAsset: quote.cryptoCurrency,
        })
      }

      if (!quotes.length) {
        return
      }

      return quotes
    } catch (error) {
      console.error('Error fetching Transak quote: ', error)
    }
  },
  get: async (path: string) => {
    try {
      const response = await fetchWithTimeout(path, null, FETCH_TIMEOUT_DURATION)
      if (!response) {
        throw Error('Received no response')
      }

      const body = await response.json()
      if (!response.ok) {
        throw Error(`Response body: ${JSON.stringify(body)}`)
      }

      return body.response
    } catch (error) {
      console.error(`Transak get request failed.\nURL: ${path}\n`, error)
      return null
    }
  },
}

export default Transak

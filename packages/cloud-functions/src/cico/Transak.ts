import { DigitalAsset, TRANSAK_DATA } from '../config'
import { PaymentMethod, ProviderQuote } from './fetchProviders'
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

export const Transak = {
  fetchQuote: async (
    digitalAsset: DigitalAsset,
    fiatCurrency: string,
    fiatAmount: number | undefined,
    userCountry: string | null
  ): Promise<ProviderQuote[]> => {
    try {
      if (!fiatAmount) {
        throw Error('Purchase amount not provided')
      }

      const { localCurrency, localAmount, exchangeRate } = await Transak.convertToLocalCurrency(
        userCountry,
        fiatCurrency,
        fiatAmount
      )

      const baseUrl = `
        ${TRANSAK_DATA.api_url}
        /v2
        /currencies
        /price
        ?partnerApiKey=${TRANSAK_DATA.public_key}
        &cryptoCurrency=${digitalAsset}
        &fiatCurrency=${localCurrency}
        &fiatAmount=${localAmount}
        &isBuyOrSell=BUY
      `.replace(/\s+/g, '')

      const validPaymentMethods = Transak.determineValidPaymentMethods(userCountry)

      const rawQuotes: Array<TransakQuote | null> = await Promise.all(
        validPaymentMethods.map((method) => Transak.get(`${baseUrl}&paymentMethodId=${method}`))
      )

      return Transak.processRawQuotes(rawQuotes, exchangeRate)
    } catch (error) {
      console.error('Error fetching Transak quote: ', error)
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
  determineValidPaymentMethods: (country: string | null) => {
    const validPaymentMethods = ['credit_debit_card']
    if (country) {
      if (bankingSystemToCountry.neft[country]) {
        validPaymentMethods.push('neft_bank_transfer')
      } else if (bankingSystemToCountry.gbp[country]) {
        validPaymentMethods.push('gbp_bank_transfer')
      } else if (bankingSystemToCountry.sepa[country]) {
        validPaymentMethods.push('sepa_bank_transfer')
      }
    }
    return validPaymentMethods
  },
  processRawQuotes: (rawQuotes: Array<TransakQuote | null>, exchangeRate: number) => {
    const quotes: ProviderQuote[] = []
    for (const quote of rawQuotes) {
      if (!quote) {
        continue
      }

      quotes.push({
        paymentMethod:
          quote.paymentMethod === 'credit_debit_card' ? PaymentMethod.Card : PaymentMethod.Bank,
        fiatFee: quote.totalFee / exchangeRate,
        returnedAmount: quote.cryptoAmount,
        digitalAsset: quote.cryptoCurrency,
      })
    }

    return quotes
  },
  get: async (path: string) => {
    try {
      const response = await fetchWithTimeout(path)
      const data = await response.json()
      if (!response.ok) {
        throw Error(`Response body: ${JSON.stringify(data)}`)
      }

      return data.response
    } catch (error) {
      console.error(`Transak get request failed.\nURL: ${path}\n`, error)
      return null
    }
  },
}

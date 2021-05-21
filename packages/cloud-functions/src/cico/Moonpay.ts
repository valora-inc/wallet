import { DigitalAsset, FETCH_TIMEOUT_DURATION, MOONPAY_DATA } from '../config'
import { PaymentMethod, ProviderQuote, UserLocationData } from './fetchProviders'
import { bankingSystemToCountry } from './providerAvailability'
import { fetchLocalCurrencyAndExchangeRate, fetchWithTimeout } from './utils'

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
    userLocation: UserLocationData
  ) => {
    try {
      if (!fiatAmount) {
        throw Error('Purchase amount not provided')
      }

      let { localCurrency, exchangeRate } = await fetchLocalCurrencyAndExchangeRate(
        userLocation.country,
        fiatCurrency
      )

      // If the local currency is not supported by Moonpay, then get estimate in USD
      if (!MOONPAY_DATA.supported_currencies.includes(localCurrency)) {
        ;({ localCurrency, exchangeRate } = await fetchLocalCurrencyAndExchangeRate(
          userLocation.country,
          fiatCurrency,
          'USD'
        ))
      }

      const localFiatAmount = fiatAmount * exchangeRate

      const paymentMethods = ['credit_debit_card']
      if (userLocation.country) {
        if (bankingSystemToCountry.gbp[userLocation.country]) {
          paymentMethods.push('gbp_bank_transfer')
        } else if (bankingSystemToCountry.sepa[userLocation.country]) {
          paymentMethods.push('sepa_bank_transfer')
        }
      }

      const baseUrl = `
        ${MOONPAY_DATA.api_url}
        /v3
        /currencies
        /${digitalAsset.toLowerCase()}
        /buy_quote
        /?apiKey=${MOONPAY_DATA.public_key}
        &baseCurrencyCode=${localCurrency.toLowerCase()}
        &baseCurrencyAmount=${localFiatAmount.toFixed(2)}
      `.replace(/\s+/g, '')

      const rawQuotes: Array<MoonpayQuote | null> = await Promise.all(
        paymentMethods.map((method) => Moonpay.get(`${baseUrl}&paymentMethod=${method}`))
      )

      const quotes: ProviderQuote[] = []
      for (const quote of rawQuotes) {
        if (!quote) {
          continue
        }

        const paymentMethod =
          quote.paymentMethod === 'credit_debit_card' ? PaymentMethod.Card : PaymentMethod.Bank

        const { feeAmount, extraFeeAmount, networkFeeAmount } = quote
        quotes.push({
          paymentMethod,
          fiatFee: (feeAmount + extraFeeAmount + networkFeeAmount) / exchangeRate,
          digitalAssetsAmount: quote.quoteCurrencyAmount,
          digitalAsset: quote.currency.code,
        })
      }

      if (!quotes.length) {
        return
      }

      return quotes
    } catch (error) {
      console.error('Error fetching Moonpay quote: ', error)
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

      return body
    } catch (error) {
      console.error(`Moonpay get request failed.\nURL: ${path}\n`, error)
      return null
    }
  },
}

export default Moonpay

import { DigitalAsset, MOONPAY_DATA } from '../config'
import { PaymentMethod, ProviderQuote } from './fetchProviders'
import { bankingSystemToCountry } from './providerAvailability'
import {
  fetchLocalCurrencyAndExchangeRate,
  fetchWithTimeout,
  findContinguousSpaces,
  roundDecimals,
} from './utils'

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

export const Moonpay = {
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

      const { localCurrency, localAmount, exchangeRate } = await Moonpay.convertToLocalCurrency(
        userCountry,
        fiatCurrency,
        fiatAmount
      )

      const baseUrl = `
        ${MOONPAY_DATA.api_url}
        /v3
        /currencies
        /${digitalAsset.toLowerCase()}
        /buy_quote
        /?apiKey=${MOONPAY_DATA.public_key}
        &baseCurrencyCode=${localCurrency.toLowerCase()}
        &baseCurrencyAmount=${localAmount}
      `.replace(findContinguousSpaces, '')

      const validPaymentMethods = Moonpay.determineValidPaymentMethods(userCountry)

      const rawQuotes: Array<MoonpayQuote | null> = await Promise.all(
        validPaymentMethods.map((method) => Moonpay.get(`${baseUrl}&paymentMethod=${method}`))
      )

      return Moonpay.processRawQuotes(rawQuotes, exchangeRate)
    } catch (error) {
      console.error('Error fetching Moonpay quote: ', error)
      return []
    }
  },
  convertToLocalCurrency: async (
    country: string | null,
    baseCurrency: string,
    baseCurrencyAmount: number
  ) => {
    let { localCurrency, exchangeRate } = await fetchLocalCurrencyAndExchangeRate(
      country,
      baseCurrency
    )

    // If the local currency is not supported by Moonpay, then convert local currency to USD
    // and get USD denominated estimate
    if (!MOONPAY_DATA.supported_currencies.includes(localCurrency)) {
      ;({ localCurrency, exchangeRate } = await fetchLocalCurrencyAndExchangeRate(
        country,
        baseCurrency,
        'USD'
      ))
    }

    return {
      localCurrency,
      exchangeRate,
      localAmount: roundDecimals(baseCurrencyAmount * exchangeRate, 2),
    }
  },
  determineValidPaymentMethods: (country: string | null) => {
    const validPaymentMethods = ['credit_debit_card']
    if (country) {
      if (bankingSystemToCountry.gbp[country]) {
        validPaymentMethods.push('gbp_bank_transfer')
      } else if (bankingSystemToCountry.sepa[country]) {
        validPaymentMethods.push('sepa_bank_transfer')
      }
    }

    return validPaymentMethods
  },
  processRawQuotes: (rawQuotes: Array<MoonpayQuote | null>, exchangeRate: number) => {
    const quotes: ProviderQuote[] = []
    for (const quote of rawQuotes) {
      if (!quote) {
        continue
      }

      const { feeAmount, extraFeeAmount, networkFeeAmount } = quote
      quotes.push({
        paymentMethod:
          quote.paymentMethod === 'credit_debit_card' ? PaymentMethod.Card : PaymentMethod.Bank,
        fiatFee: roundDecimals((feeAmount + extraFeeAmount + networkFeeAmount) / exchangeRate, 2),
        returnedAmount: quote.quoteCurrencyAmount,
        digitalAsset: quote.currency.code,
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

      return data
    } catch (error) {
      console.error(`Moonpay get request failed.\nURL: ${path}\n`, error)
      return null
    }
  },
}

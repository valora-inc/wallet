import BigNumber from 'bignumber.js'
import { DigitalAsset, RAMP_DATA } from '../config'
import { PaymentMethod, ProviderQuote } from './fetchProviders'
import { bankingSystemToCountry } from './providerAvailability'
import {
  fetchLocalCurrencyAndExchangeRate,
  fetchWithTimeout,
  findContinguousSpaces,
  roundDecimals,
} from './utils'

//https://docs.ramp.network/rest-api-reference/
enum RampPaymentMethod {
  MANUAL_BANK_TRANSFER = 'MANUAL_BANK_TRANSFER',
  AUTO_BANK_TRANSFER = 'AUTO_BANK_TRANSFER',
  CARD_PAYMENT = 'CARD_PAYMENT',
  APPLE_PAY = 'APPLE_PAY',
}

interface RampQuote {
  cryptoAssetSymbol: string
  fiatCurrency: string // three-letter currency code
  cryptoAmount: string // number-string, in wei or token units
  fiatValue: number // total value the user pays for the purchase, in fiatCurrency
  paymentMethodType: RampPaymentMethod // type of payment method used to pay for the swap - see values below
  assetExchangeRate: number // price of 1 whole token of purchased asset, in fiatCurrency
  assetExchangeRateEur: number // price of 1 whole token of purchased asset, in EUR
  fiatExchangeRateEur: number // price of fiatCurrency in EUR
  baseRampFee: number // base Ramp fee before any modifications, in fiatCurrency
  networkFee: number // network fee for transferring the purchased asset, in fiatCurrency
  appliedFee: number // final fee the user pays (included in fiatValue), in fiatCurrency
}

export const Ramp = {
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

      const { localCurrency, localAmount, exchangeRate } = await Ramp.convertToLocalCurrency(
        userCountry,
        fiatCurrency,
        fiatAmount
      )

      const url = `
        ${RAMP_DATA.api_url}
        /quote
        /?hostApiKey=${RAMP_DATA.public_key}
      `.replace(findContinguousSpaces, '')

      const validPaymentMethods = Ramp.determineValidPaymentMethods(userCountry)

      const rawQuotes: Array<RampQuote | null> = await Promise.all(
        validPaymentMethods.map((method) =>
          Ramp.post(url, {
            cryptoAssetSymbol: digitalAsset,
            fiatValue: localAmount,
            fiatCurrency: localCurrency,
            paymentMethodType: method,
          })
        )
      )

      return Ramp.processRawQuotes(rawQuotes, exchangeRate)
    } catch (error) {
      console.error('Error fetching Ramp quote: ', error)
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

    // If the local currency is not supported by Ramp, then convert local currency to USD
    // and get USD denominated estimate
    if (!RAMP_DATA.supported_currencies.includes(localCurrency)) {
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
    const validPaymentMethods = ['CARD_PAYMENT']
    if (country && (bankingSystemToCountry.gbp[country] || bankingSystemToCountry.sepa[country])) {
      validPaymentMethods.push('MANUAL_BANK_TRANSFER')
    }

    return validPaymentMethods
  },
  processRawQuotes: (rawQuotes: Array<RampQuote | null>, exchangeRate: number) => {
    const quotes: ProviderQuote[] = []
    for (const quote of rawQuotes) {
      if (!quote) {
        continue
      }

      const { appliedFee, cryptoAmount, cryptoAssetSymbol, paymentMethodType } = quote
      quotes.push({
        paymentMethod:
          paymentMethodType === 'CARD_PAYMENT' ? PaymentMethod.Card : PaymentMethod.Bank,
        fiatFee: roundDecimals(appliedFee / exchangeRate, 2),
        returnedAmount: new BigNumber(cryptoAmount).toNumber(),
        digitalAsset: cryptoAssetSymbol,
      })
    }

    return quotes
  },
  post: async (path: string, body: any) => {
    try {
      const response = await fetchWithTimeout(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await response.json()

      if (!response.ok) {
        throw Error(`Response body: ${JSON.stringify(data)}`)
      }

      return data
    } catch (error) {
      console.error(`Ramp post request failed.\nURL: ${path}\n`, error)
      return null
    }
  },
}

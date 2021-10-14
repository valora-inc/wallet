import 'jest-fetch-mock'
import { DigitalAsset } from '../config'
import { PaymentMethod } from './fetchProviders'
import { Moonpay } from './Moonpay'

const FIAT_CASH_IN_AMOUNT = 100
const FIAT_FEE_AMOUNT = 1
const CRYPTO_AMOUNT_ACQUIRED = 99
const EXCHANGE_RATE = 20

export const MOCK_BLOCKCHAIN_API_EXCHANGE_RATE = JSON.stringify({
  data: {
    currencyConversion: {
      rate: EXCHANGE_RATE,
    },
  },
})

const createMoonpayQuoteResponse = (
  fiatCurrency: string,
  digitalCurrency: string,
  paymentMethod: string
) =>
  JSON.stringify({
    baseCurrency: {
      id: 'baseCurrency_id',
      createdAt: 'baseCurrency_createdAt',
      updatedAt: 'baseCurrency_updatedAt',
      type: 'baseCurrency_type',
      name: 'baseCurrency_type',
      code: fiatCurrency,
      precision: 1,
    },
    baseCurrencyAmount: FIAT_CASH_IN_AMOUNT,
    currency: {
      id: 'currency_id',
      createdAt: 'currency_createdAt',
      updatedAt: 'currency_updatedAt',
      type: 'currency_type',
      name: 'currency_type',
      code: digitalCurrency,
      precision: 1,
      addressRegex: 'addressRegex',
      testnetAddressRegex: 'testnetAddressRegex',
      minAmount: 0,
      maxAmount: 10000,
      supportsAddressTag: false,
      addressTagRegex: null,
      supportsTestMode: true,
      isSuspended: false,
      isSupportedInUS: false,
      isSellSupported: false,
      notAllowedUSStates: [],
    },
    extraFeeAmount: 0,
    feeAmount: FIAT_FEE_AMOUNT / 2,
    networkFeeAmount: FIAT_FEE_AMOUNT / 2,
    paymentMethod,
    quoteCurrencyAmount: CRYPTO_AMOUNT_ACQUIRED,
    totalAmount: 101,
  })

describe('Moonpay', () => {
  beforeEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
    fetchMock.resetMocks()
  })

  it('fetches quotes correctly when digital asset is cUSD', async () => {
    const fiatCurrency = 'USD'
    const digitalAsset = DigitalAsset.CUSD
    const userCountry = 'US'

    fetchMock.mockResponse(
      createMoonpayQuoteResponse(fiatCurrency, digitalAsset, 'credit_debit_card')
    )

    const quotes = await Moonpay.fetchQuote(
      digitalAsset,
      fiatCurrency,
      FIAT_CASH_IN_AMOUNT,
      userCountry
    )

    expect(quotes).toEqual([
      {
        paymentMethod: PaymentMethod.Card,
        fiatFee: FIAT_FEE_AMOUNT,
        returnedAmount: CRYPTO_AMOUNT_ACQUIRED,
        digitalAsset,
      },
    ])
  })

  it('fetches quotes correctly when digital asset is CELO', async () => {
    const fiatCurrency = 'USD'
    const digitalAsset = DigitalAsset.CELO
    const userCountry = 'US'

    fetchMock.mockResponse(
      createMoonpayQuoteResponse(fiatCurrency, digitalAsset, 'credit_debit_card')
    )

    const quotes = await Moonpay.fetchQuote(
      digitalAsset,
      fiatCurrency,
      FIAT_CASH_IN_AMOUNT,
      userCountry
    )

    expect(quotes).toEqual([
      {
        paymentMethod: PaymentMethod.Card,
        fiatFee: FIAT_FEE_AMOUNT,
        returnedAmount: CRYPTO_AMOUNT_ACQUIRED,
        digitalAsset,
      },
    ])
  })

  it('does not fetch quotes when digital asset is cEUR', async () => {
    const fiatCurrency = 'USD'
    const digitalAsset = DigitalAsset.CEUR
    const userCountry = 'US'

    fetchMock.mockResponse(
      createMoonpayQuoteResponse(fiatCurrency, digitalAsset, 'credit_debit_card')
    )

    const quotes = await Moonpay.fetchQuote(
      digitalAsset,
      fiatCurrency,
      FIAT_CASH_IN_AMOUNT,
      userCountry
    )

    expect(quotes).toEqual([])
  })

  it("fetches quotes correctly when fiatCurrency is not native to the user's location", async () => {
    const fiatCurrency = 'PHP'
    const digitalAsset = DigitalAsset.CUSD
    const userCountry = 'US'

    fetchMock.mockResponses(
      MOCK_BLOCKCHAIN_API_EXCHANGE_RATE,
      createMoonpayQuoteResponse(fiatCurrency, digitalAsset, 'credit_debit_card')
    )

    const quotes = await Moonpay.fetchQuote(
      digitalAsset,
      fiatCurrency,
      FIAT_CASH_IN_AMOUNT,
      userCountry
    )

    expect(quotes).toEqual([
      {
        paymentMethod: PaymentMethod.Card,
        fiatFee: FIAT_FEE_AMOUNT / EXCHANGE_RATE,
        returnedAmount: CRYPTO_AMOUNT_ACQUIRED,
        digitalAsset,
      },
    ])
  })

  it("fetches quotes correctly when user's location has banking cash-in options", async () => {
    const fiatCurrency = 'EUR'
    const digitalAsset = DigitalAsset.CUSD
    const userCountry = 'FR'

    fetchMock.mockResponses(
      createMoonpayQuoteResponse(fiatCurrency, digitalAsset, 'credit_debit_card'),
      createMoonpayQuoteResponse(fiatCurrency, digitalAsset, 'sepa_bank_transfer')
    )

    const quotes = await Moonpay.fetchQuote(
      digitalAsset,
      fiatCurrency,
      FIAT_CASH_IN_AMOUNT,
      userCountry
    )

    expect(quotes).toEqual([
      {
        paymentMethod: PaymentMethod.Card,
        fiatFee: FIAT_FEE_AMOUNT,
        returnedAmount: CRYPTO_AMOUNT_ACQUIRED,
        digitalAsset,
      },
      {
        paymentMethod: PaymentMethod.Bank,
        fiatFee: FIAT_FEE_AMOUNT,
        returnedAmount: CRYPTO_AMOUNT_ACQUIRED,
        digitalAsset,
      },
    ])
  })

  it('gracefully handles when a quote fetch fails', async () => {
    const fiatCurrency = 'USD'
    const digitalAsset = DigitalAsset.CUSD
    const userCountry = 'US'

    fetchMock.mockReject()

    const quotes = await Moonpay.fetchQuote(
      digitalAsset,
      fiatCurrency,
      FIAT_CASH_IN_AMOUNT,
      userCountry
    )

    expect(quotes).toEqual([])
  })

  it('gracefully handles when one quote fetch fails and the other succeeds', async () => {
    const fiatCurrency = 'EUR'
    const digitalAsset = DigitalAsset.CUSD
    const userCountry = 'FR'

    fetchMock.mockRejectOnce()

    fetchMock.mockResponse(
      createMoonpayQuoteResponse(fiatCurrency, digitalAsset, 'sepa_bank_transfer')
    )

    const quotes = await Moonpay.fetchQuote(
      digitalAsset,
      fiatCurrency,
      FIAT_CASH_IN_AMOUNT,
      userCountry
    )

    expect(quotes).toEqual([
      {
        paymentMethod: PaymentMethod.Bank,
        fiatFee: FIAT_FEE_AMOUNT,
        returnedAmount: CRYPTO_AMOUNT_ACQUIRED,
        digitalAsset,
      },
    ])
  })
})

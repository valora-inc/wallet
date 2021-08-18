import 'jest-fetch-mock'
import { DigitalAsset } from '../config'
import { PaymentMethod } from './fetchProviders'
import { Ramp } from './Ramp'

const FIAT_CASH_IN_AMOUNT = 100
const FIAT_FEE_AMOUNT = 0
const CRYPTO_AMOUNT_ACQUIRED = 100
const EXCHANGE_RATE = 20

export const MOCK_BLOCKCHAIN_API_EXCHANGE_RATE = JSON.stringify({
  data: {
    currencyConversion: {
      rate: EXCHANGE_RATE,
    },
  },
})

const createRampQuoteResponse = (
  fiatCurrency: string,
  digitalCurrency: string,
  paymentMethod: string
) =>
  JSON.stringify({
    cryptoAssetSymbol: digitalCurrency,
    fiatCurrency,
    cryptoAmount: CRYPTO_AMOUNT_ACQUIRED,
    fiatValue: FIAT_CASH_IN_AMOUNT,
    paymentMethodType: paymentMethod,
    assetExchangeRate: 1,
    assetExchangeRateEur: 0.83,
    fiatExchangeRateEur: 0.83,
    baseRampFee: 1.2,
    networkFee: 0.01,
    appliedFee: FIAT_FEE_AMOUNT,
  })

describe('Ramp', () => {
  beforeEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
    fetchMock.resetMocks()
  })

  it('fetches quotes correctly when digital asset is cUSD', async () => {
    const fiatCurrency = 'USD'
    const digitalAsset = DigitalAsset.CUSD
    const userCountry = 'US'

    fetchMock.mockResponse(createRampQuoteResponse(fiatCurrency, digitalAsset, 'CARD_PAYMENT'))

    const quotes = await Ramp.fetchQuote(
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

    fetchMock.mockResponse(createRampQuoteResponse(fiatCurrency, digitalAsset, 'CARD_PAYMENT'))

    const quotes = await Ramp.fetchQuote(
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

  it('fetches quotes correctly when digital asset is cEUR', async () => {
    const fiatCurrency = 'USD'
    const digitalAsset = DigitalAsset.CEUR
    const userCountry = 'US'

    fetchMock.mockResponse(createRampQuoteResponse(fiatCurrency, digitalAsset, 'CARD_PAYMENT'))

    const quotes = await Ramp.fetchQuote(
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

  it("fetches quotes correctly when fiatCurrency is not native to the user's location", async () => {
    const fiatCurrency = 'PHP'
    const digitalAsset = DigitalAsset.CUSD
    const userCountry = 'US'

    fetchMock.mockResponses(
      MOCK_BLOCKCHAIN_API_EXCHANGE_RATE,
      createRampQuoteResponse(fiatCurrency, digitalAsset, 'CARD_PAYMENT')
    )

    const quotes = await Ramp.fetchQuote(
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
      createRampQuoteResponse(fiatCurrency, digitalAsset, 'CARD_PAYMENT'),
      createRampQuoteResponse(fiatCurrency, digitalAsset, 'MANUAL_BANK_TRANSFER')
    )

    const quotes = await Ramp.fetchQuote(
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

    const quotes = await Ramp.fetchQuote(
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
      createRampQuoteResponse(fiatCurrency, digitalAsset, 'MANUAL_BANK_TRANSFER')
    )

    const quotes = await Ramp.fetchQuote(
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

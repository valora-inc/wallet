import 'jest-fetch-mock'
import { DigitalAsset } from '../config'
import { PaymentMethod } from './fetchProviders'
import { Xanpool } from './Xanpool'

const FIAT_CASH_IN_AMOUNT = 100
const FIAT_FEE_AMOUNT = 1
const CRYPTO_AMOUNT_ACQUIRED = 98
const EXCHANGE_RATE = 0.05

export const MOCK_BLOCKCHAIN_API_EXCHANGE_RATE = JSON.stringify({
  data: {
    currencyConversion: {
      rate: EXCHANGE_RATE,
    },
  },
})

const createXanpoolQuoteResponse = (fiatCurrency: string) =>
  JSON.stringify({
    crypto: FIAT_CASH_IN_AMOUNT,
    fiat: FIAT_CASH_IN_AMOUNT,
    cryptoPrice: 1,
    cryptoPriceUsd: 1,
    total: CRYPTO_AMOUNT_ACQUIRED,
    serviceCharge: FIAT_FEE_AMOUNT,
    referralDiscount: 0,
    referralDiscountInXlp: 0,
    referralDiscountInUsd: 0,
    payoutServiceCharge: 0,
    earnedXlp: 0,
    processingTime: '0',
    currency: fiatCurrency,
  })

describe('Xanpool', () => {
  beforeEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
    fetchMock.resetMocks()
  })

  it('fetches quotes correctly when digital asset is cUSD', async () => {
    const fiatCurrency = 'PHP'
    const digitalAsset = DigitalAsset.CUSD
    const userLocation = {
      ipAddress: '1.0.0.7',
      country: 'PH',
      state: null,
    }

    fetchMock.mockResponse(createXanpoolQuoteResponse(fiatCurrency))

    const quotes = await Xanpool.fetchQuote(
      'buy',
      digitalAsset,
      fiatCurrency,
      FIAT_CASH_IN_AMOUNT,
      userLocation
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

  it('fetches quotes correctly when digital asset is CELO', async () => {
    const fiatCurrency = 'PHP'
    const digitalAsset = DigitalAsset.CUSD
    const userLocation = {
      ipAddress: '1.0.0.7',
      country: 'PH',
      state: null,
    }

    fetchMock.mockResponse(createXanpoolQuoteResponse(fiatCurrency))

    const quotes = await Xanpool.fetchQuote(
      'buy',
      digitalAsset,
      fiatCurrency,
      FIAT_CASH_IN_AMOUNT,
      userLocation
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

  it("fetches quotes correctly when fiatCurrency is not native to the user's location", async () => {
    const fiatCurrency = 'USD'
    const digitalAsset = DigitalAsset.CUSD
    const userLocation = {
      ipAddress: '1.0.0.7',
      country: 'PH',
      state: null,
    }

    fetchMock.mockResponses(
      MOCK_BLOCKCHAIN_API_EXCHANGE_RATE,
      createXanpoolQuoteResponse(fiatCurrency)
    )

    const quotes = await Xanpool.fetchQuote(
      'buy',
      digitalAsset,
      fiatCurrency,
      FIAT_CASH_IN_AMOUNT,
      userLocation
    )

    expect(quotes).toEqual([
      {
        paymentMethod: PaymentMethod.Bank,
        fiatFee: FIAT_FEE_AMOUNT / EXCHANGE_RATE,
        returnedAmount: CRYPTO_AMOUNT_ACQUIRED,
        digitalAsset,
      },
    ])
  })

  it('gracefully handles when a quote fetch fails', async () => {
    const fiatCurrency = 'USD'
    const digitalAsset = DigitalAsset.CUSD
    const userLocation = {
      ipAddress: '1.0.0.7',
      country: 'US',
      state: 'CA',
    }

    fetchMock.mockReject()

    const quotes = await Xanpool.fetchQuote(
      'buy',
      digitalAsset,
      fiatCurrency,
      FIAT_CASH_IN_AMOUNT,
      userLocation
    )

    expect(quotes).toEqual([])
  })

  it("gracefully fails when a user's location is unsupported", async () => {
    const fiatCurrency = 'USD'
    const digitalAsset = DigitalAsset.CUSD
    const userLocation = {
      ipAddress: '1.0.0.7',
      country: 'US',
      state: 'CA',
    }

    fetchMock.mockReject()

    const quotes = await Xanpool.fetchQuote(
      'buy',
      digitalAsset,
      fiatCurrency,
      FIAT_CASH_IN_AMOUNT,
      userLocation
    )

    expect(quotes).toEqual([])
  })
})

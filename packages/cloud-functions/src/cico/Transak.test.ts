import 'jest-fetch-mock'
import { DigitalAsset } from '../config'
import { PaymentMethod } from './fetchProviders'
import { Transak } from './Transak'

const FIAT_CASH_IN_AMOUNT = 100
const FIAT_FEE_AMOUNT = 1
const CRYPTO_AMOUNT_ACQUIRED = 98
const EXCHANGE_RATE = 20

export const MOCK_BLOCKCHAIN_API_EXCHANGE_RATE = JSON.stringify({
  data: {
    currencyConversion: {
      rate: EXCHANGE_RATE,
    },
  },
})

const createTransakQuoteResponse = (
  fiatCurrency: string,
  digitalCurreny: string,
  paymentMethod: string
) =>
  JSON.stringify({
    response: {
      quoteId: 'quoteId',
      conversionPrice: 1,
      marketConversionPrice: 1,
      slippage: 0,
      fiatCurrency,
      cryptoCurrency: digitalCurreny,
      paymentMethod,
      fiatAmount: FIAT_CASH_IN_AMOUNT,
      cryptoAmount: CRYPTO_AMOUNT_ACQUIRED,
      isBuyOrSell: 'buy',
      network: 'Celo',
      feeDecimal: 1,
      totalFee: FIAT_FEE_AMOUNT,
      feeBreakdown: [
        {
          name: 'Network/Exchange fee',
          value: FIAT_FEE_AMOUNT / 2,
          id: 'network_fee',
          ids: ['network_fee'],
        },
        {
          name: 'Card processing fee',
          value: FIAT_FEE_AMOUNT / 2,
          id: 'fiat_liquidity_provider_fee',
          ids: ['fiat_liquidity_provider_fee'],
        },
      ],
      nonce: 100,
      convertedFiatAmount: FIAT_CASH_IN_AMOUNT - FIAT_FEE_AMOUNT,
      convertedFiatCurrency: fiatCurrency,
    },
  })

describe('Transak', () => {
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
      createTransakQuoteResponse(fiatCurrency, digitalAsset, 'credit_debit_card')
    )

    const quotes = await Transak.fetchQuote(
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
      createTransakQuoteResponse(fiatCurrency, digitalAsset, 'credit_debit_card')
    )

    const quotes = await Transak.fetchQuote(
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
      createTransakQuoteResponse(fiatCurrency, digitalAsset, 'credit_debit_card')
    )

    const quotes = await Transak.fetchQuote(
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
      createTransakQuoteResponse(fiatCurrency, digitalAsset, 'credit_debit_card')
    )

    const quotes = await Transak.fetchQuote(
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
      createTransakQuoteResponse(fiatCurrency, digitalAsset, 'credit_debit_card'),
      createTransakQuoteResponse(fiatCurrency, digitalAsset, 'sepa_bank_transfer')
    )

    const quotes = await Transak.fetchQuote(
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

    const quotes = await Transak.fetchQuote(
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
      createTransakQuoteResponse(fiatCurrency, digitalAsset, 'sepa_bank_transfer')
    )

    const quotes = await Transak.fetchQuote(
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

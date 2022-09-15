import {
  normalizeExternalProviders,
  normalizeFiatConnectQuotes,
  normalizeQuotes,
} from 'src/fiatExchanges/quotes/normalizeQuotes'
import { CICOFlow } from 'src/fiatExchanges/utils'
import Logger from 'src/utils/Logger'
import {
  mockFiatConnectQuotes,
  mockFiatConnectQuotesWithUnknownFees,
  mockProviders,
} from 'test/values'

jest.mock('src/utils/Logger', () => ({
  __esModule: true,
  namedExport: jest.fn(),
  default: {
    info: jest.fn(),
    warn: jest.fn(),
  },
}))

describe('normalizeQuotes', () => {
  it('sorts and returns both fiatconnect and external quotes', () => {
    const normalizedQuotes = normalizeQuotes(CICOFlow.CashIn, mockFiatConnectQuotes, mockProviders)
    expect(
      normalizedQuotes.map((quote) => [
        quote.getProviderId(),
        quote
          .getFeeInCrypto({
            cGLD: '1',
            cUSD: '1',
            cEUR: '1',
          })
          ?.toNumber(),
      ])
    ).toEqual([
      ['Ramp', 0],
      ['provider-two', 0.53],
      ['provider-three', 4.22],
      ['Moonpay', 5],
      ['Simplex', 6],
      ['Moonpay', 10],
    ])
  })

  it('sorts FiatConnect quotes with no fee returned at the end of quotes', () => {
    const normalizedQuotes = normalizeQuotes(
      CICOFlow.CashIn,
      mockFiatConnectQuotesWithUnknownFees,
      []
    )
    expect(
      normalizedQuotes.map((quote) => [
        quote.getProviderId(),
        quote
          .getFeeInCrypto({
            cGLD: '1',
            cUSD: '1',
            cEUR: '1',
          })
          ?.toNumber(),
      ])
    ).toEqual([
      ['provider-one', 0.97],
      ['provider-two', undefined],
    ])
  })
})

describe('normalizeFiatConnectQuotes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('logs quotes with errors and does not normalize them', () => {
    const normalizedFiatConnectQuotes = normalizeFiatConnectQuotes(CICOFlow.CashIn, [
      mockFiatConnectQuotes[0],
    ])
    expect(Logger.warn).toHaveBeenCalledWith(
      'NormalizeQuotes',
      'Error with quote for provider-one. FiatAmountTooHigh'
    )
    expect(normalizedFiatConnectQuotes).toHaveLength(0)
  })

  it('logs when normalization fails', () => {
    const normalizedFiatConnectQuotes = normalizeFiatConnectQuotes(CICOFlow.CashIn, [
      mockFiatConnectQuotes[2],
    ])
    expect(Logger.warn).toHaveBeenCalledWith(
      'NormalizeQuotes',
      Error(`Error: provider-three. Quote requires KYC, but only unsupported schemas.`)
    )
    expect(normalizedFiatConnectQuotes).toHaveLength(0)
  })
  it('returns normalized quotes', () => {
    const normalizedFiatConnectQuotes = normalizeFiatConnectQuotes(CICOFlow.CashIn, [
      mockFiatConnectQuotes[1],
      mockFiatConnectQuotes[3],
    ])
    expect(Logger.warn).not.toHaveBeenCalled()
    expect(normalizedFiatConnectQuotes).toHaveLength(2)
  })
})

describe('normalizeExternalProviders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('logs when normalization fails', () => {
    const normalizedExternalQuotes = normalizeExternalProviders(CICOFlow.CashIn, [mockProviders[3]])
    expect(Logger.warn).toHaveBeenCalledWith(
      'NormalizeQuotes',
      Error('Error: Xanpool. Quote is restricted')
    )
    expect(normalizedExternalQuotes).toHaveLength(0)
  })
  it('returns normalized quotes when quote is an array', () => {
    // Moonpay with two quotes
    const normalizedExternalQuotes = normalizeExternalProviders(CICOFlow.CashIn, [mockProviders[1]])
    expect(Logger.warn).not.toHaveBeenCalled()
    expect(normalizedExternalQuotes).toHaveLength(2)
  })
  it('returns normalized quotes when quote is not an array', () => {
    // Simplex quote
    const normalizedExternalQuotes = normalizeExternalProviders(CICOFlow.CashIn, [mockProviders[0]])
    expect(Logger.warn).not.toHaveBeenCalled()
    expect(normalizedExternalQuotes).toHaveLength(1)
  })
})

import {
  normalizeExternalProviders,
  normalizeFiatConnectQuotes,
  normalizeQuotes,
} from 'src/fiatExchanges/quotes/normalizeQuotes'
import { CICOFlow } from 'src/fiatExchanges/utils'
import Logger from 'src/utils/Logger'
import { mockFiatConnectQuotes, mockProviders } from 'test/values'

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
    expect(normalizedQuotes.map((quote) => [quote.getProviderId(), quote.getFee()])).toEqual([
      ['Simplex', -13],
      ['Ramp', 0],
      ['provider-two', 0.53],
      ['Moonpay', 5],
      ['Moonpay', 10],
    ])
  })
})

describe('normalizeFiatConnectQuotes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('logs quotes with errors and does not normalize them', () => {
    const normalizedFiatConnectQuotes = normalizeFiatConnectQuotes([mockFiatConnectQuotes[0]])
    expect(Logger.warn).toHaveBeenCalledWith(
      'NormalizeQuotes',
      'Error with quote for provider-two. FiatAmountTooHigh'
    )
    expect(normalizedFiatConnectQuotes).toHaveLength(0)
  })

  it('logs when normalization fails', () => {
    const normalizedFiatConnectQuotes = normalizeFiatConnectQuotes([mockFiatConnectQuotes[2]])
    expect(Logger.warn).toHaveBeenCalledWith(
      'NormalizeQuotes',
      Error(`Error: provider-three. We don't support KYC for fiatconnect yet`)
    )
    expect(normalizedFiatConnectQuotes).toHaveLength(0)
  })
  it('returns normalized quotes', () => {
    const normalizedFiatConnectQuotes = normalizeFiatConnectQuotes([mockFiatConnectQuotes[1]])
    expect(Logger.warn).not.toHaveBeenCalled()
    expect(normalizedFiatConnectQuotes).toHaveLength(1)
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

import BigNumber from 'bignumber.js'
import {
  normalizeExternalProviders,
  normalizeFiatConnectQuotes,
  normalizeQuotes,
} from 'src/fiatExchanges/quotes/normalizeQuotes'
import { CICOFlow, PaymentMethod } from 'src/fiatExchanges/utils'
import { getFeatureGate } from 'src/statsig'
import { TokenBalance } from 'src/tokens/slice'
import Logger from 'src/utils/Logger'
import {
  mockCusdTokenId,
  mockFiatConnectQuotes,
  mockFiatConnectQuotesWithUnknownFees,
  mockProviders,
} from 'test/values'

const mockUseTokenInfo = jest.fn(() => {
  return { address: 'mockAddress', symbol: 'mockSymbol' }
})
jest.mock('src/tokens/hooks', () => ({
  useTokenInfo: () => mockUseTokenInfo(),
}))
jest.mock('src/utils/Logger', () => ({
  __esModule: true,
  namedExport: jest.fn(),
  default: {
    info: jest.fn(),
    warn: jest.fn(),
  },
}))
jest.mock('src/statsig')

describe('normalizeQuotes', () => {
  it('returns both fiatconnect and external quotes sorted by fee if feature gate is false', () => {
    jest.mocked(getFeatureGate).mockReturnValue(false)
    const normalizedQuotes = normalizeQuotes(
      CICOFlow.CashIn,
      mockFiatConnectQuotes,
      mockProviders,
      mockCusdTokenId,
      'cUSD'
    )
    expect(
      normalizedQuotes.map((quote) => [
        quote.getProviderId(),
        quote.getFeeInCrypto('1', { priceUsd: BigNumber('1') } as TokenBalance)?.toNumber(),
      ])
    ).toEqual([
      ['Ramp', 0],
      ['provider-two', 0.53],
      ['provider-three', 4.22], //provider-three supports Mobile Money and Bank Account
      ['provider-three', 4.22],
      ['Moonpay', 5],
      ['Simplex', 6],
      ['Fonbnk', 7],
      ['Moonpay', 10],
    ])
  })

  it('returns both fiatconnect and external quotes sorted by receive amount if feature gate is true', () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
    const normalizedQuotes = normalizeQuotes(
      CICOFlow.CashIn,
      mockFiatConnectQuotes,
      mockProviders,
      mockCusdTokenId,
      'cUSD'
    )
    expect(
      normalizedQuotes.map((quote) => [quote.getProviderId(), quote.getReceiveAmount()?.toNumber()])
    ).toEqual([
      ['provider-two', 100],
      ['provider-three', 100], //provider-three supports Mobile Money and Bank Account
      ['provider-three', 100],
      ['Ramp', 100],
      ['Moonpay', 95],
      ['Fonbnk', 93],
      ['Moonpay', 90],
      ['Simplex', 25],
    ])
  })

  it('sorts FiatConnect quotes with no fee returned at the end of quotes if feature gate is false', () => {
    jest.mocked(getFeatureGate).mockReturnValue(false)
    const normalizedQuotes = normalizeQuotes(
      CICOFlow.CashIn,
      mockFiatConnectQuotesWithUnknownFees,
      [],
      mockCusdTokenId,
      'cUSD'
    )
    expect(
      normalizedQuotes.map((quote) => [
        quote.getProviderId(),
        quote.getFeeInCrypto('1', { priceUsd: BigNumber('1') } as TokenBalance)?.toNumber(),
      ])
    ).toEqual([
      ['provider-one', 0.97],
      ['provider-two', undefined],
    ])
  })

  it('sorts quotes with no receive amount at the end of quotes if feature gate is true', () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
    const normalizedQuotes = normalizeQuotes(
      CICOFlow.CashIn,
      [],
      [
        mockProviders[0],
        mockProviders[2],
        {
          ...mockProviders[1],
          quote: [{ paymentMethod: PaymentMethod.Bank, digitalAsset: 'cusd' }],
        },
      ],
      mockCusdTokenId,
      'cUSD'
    )
    expect(
      normalizedQuotes.map((quote) => [quote.getProviderId(), quote.getReceiveAmount()?.toNumber()])
    ).toEqual([
      ['Ramp', 100],
      ['Simplex', 25],
      ['Moonpay', undefined],
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
    const normalizedExternalQuotes = normalizeExternalProviders(
      CICOFlow.CashIn,
      [mockProviders[3]],
      mockCusdTokenId,
      'cUSD'
    )
    expect(Logger.warn).toHaveBeenCalledWith(
      'NormalizeQuotes',
      Error('Error: Xanpool. Quote is restricted')
    )
    expect(normalizedExternalQuotes).toHaveLength(0)
  })
  it('returns normalized quotes when quote is an array', () => {
    // Moonpay with two quotes
    const normalizedExternalQuotes = normalizeExternalProviders(
      CICOFlow.CashIn,
      [mockProviders[1]],
      mockCusdTokenId,
      'cUSD'
    )
    expect(Logger.warn).not.toHaveBeenCalled()
    expect(normalizedExternalQuotes).toHaveLength(2)
  })
  it('returns normalized quotes when quote is not an array', () => {
    // Simplex quote
    const normalizedExternalQuotes = normalizeExternalProviders(
      CICOFlow.CashIn,
      [mockProviders[0]],
      mockCusdTokenId,
      'cUSD'
    )
    expect(Logger.warn).not.toHaveBeenCalled()
    expect(normalizedExternalQuotes).toHaveLength(1)
  })
  it('returns normalized quotes when quote is an empty array, but provider is available', () => {
    // Ramp quote, Bank and Card
    const normalizedExternalQuotes = normalizeExternalProviders(
      CICOFlow.CashOut,
      [mockProviders[6]],
      mockCusdTokenId,
      'cUSD'
    )
    expect(Logger.warn).not.toHaveBeenCalled()
    expect(normalizedExternalQuotes).toHaveLength(2)
  })
})

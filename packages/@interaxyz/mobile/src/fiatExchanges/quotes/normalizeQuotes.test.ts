import {
  normalizeFiatConnectQuotes,
  normalizeQuotes,
} from 'src/fiatExchanges/quotes/normalizeQuotes'
import { CICOFlow } from 'src/fiatExchanges/types'
import Logger from 'src/utils/Logger'
import { mockCicoQuotes, mockCusdTokenId, mockFiatConnectQuotes } from 'test/values'

jest.mock('src/utils/Logger', () => ({
  __esModule: true,
  namedExport: jest.fn(),
  default: {
    info: jest.fn(),
    warn: jest.fn(),
  },
}))

describe('normalizeQuotes', () => {
  it('returns both fiatconnect and external quotes sorted by receive amount', () => {
    const normalizedQuotes = normalizeQuotes({
      flow: CICOFlow.CashIn,
      fiatConnectQuotes: mockFiatConnectQuotes,
      cicoQuotes: mockCicoQuotes,
      tokenId: mockCusdTokenId,
    })
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

  it('sorts quotes with no receive amount at the end of quotes', () => {
    const normalizedQuotes = normalizeQuotes({
      flow: CICOFlow.CashIn,
      fiatConnectQuotes: [],
      cicoQuotes: [
        mockCicoQuotes[0],
        mockCicoQuotes[3],
        {
          ...mockCicoQuotes[1],
          cryptoAmount: undefined as any,
        },
      ],
      tokenId: mockCusdTokenId,
    })
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
    const normalizedFiatConnectQuotes = normalizeFiatConnectQuotes(
      CICOFlow.CashIn,
      [mockFiatConnectQuotes[0]],
      mockCusdTokenId
    )
    expect(Logger.warn).toHaveBeenCalledWith(
      'NormalizeQuotes',
      'Error with quote for provider-one. FiatAmountTooHigh'
    )
    expect(normalizedFiatConnectQuotes).toHaveLength(0)
  })

  it('logs when normalization fails', () => {
    const normalizedFiatConnectQuotes = normalizeFiatConnectQuotes(
      CICOFlow.CashIn,
      [mockFiatConnectQuotes[2]],
      mockCusdTokenId
    )
    expect(Logger.warn).toHaveBeenCalledWith(
      'NormalizeQuotes',
      Error(`Error: provider-three. Quote requires KYC, but only unsupported schemas.`)
    )
    expect(normalizedFiatConnectQuotes).toHaveLength(0)
  })
  it('returns normalized quotes', () => {
    const normalizedFiatConnectQuotes = normalizeFiatConnectQuotes(
      CICOFlow.CashIn,
      [mockFiatConnectQuotes[1], mockFiatConnectQuotes[3]],
      mockCusdTokenId
    )
    expect(Logger.warn).not.toHaveBeenCalled()
    expect(normalizedFiatConnectQuotes).toHaveLength(2)
  })
})

import BigNumber from 'bignumber.js'
import ExchangeRateManager, { ExchangeProvider } from './ExchangeRateManager'
import { Exchange, PriceByAddress } from './ExchangesGraph'

const addExchangeMock = jest.fn()
const estimatePricesMock = jest.fn()
const getAllExchangesMock = jest.fn()

const cUSD = '0x765DE816845861e75A25fCA122bb6898B8B1282a'.toLocaleLowerCase()

jest.mock('./ExchangesGraph', () =>
  jest.fn().mockImplementation(() => ({
    addExchange: (exchange: Exchange) => addExchangeMock(exchange),
    estimatePrices: (token: string) => estimatePricesMock(token),
    getAllExchanges: (prices: PriceByAddress) => getAllExchangesMock(prices),
  }))
)

const mockedSource1: ExchangeProvider = {
  getExchanges: function (): Promise<Exchange[]> {
    return Promise.resolve([createExchange(cUSD, 'b', 1.2), createExchange('b', cUSD, 0.8)])
  },
}

const mockedSource2: ExchangeProvider = {
  getExchanges: function (): Promise<Exchange[]> {
    return Promise.resolve([createExchange(cUSD, 'c', 1.3), createExchange('c', cUSD, 0.7)])
  },
}

describe('ExchangeRateManager', () => {
  let exchangeManager: ExchangeRateManager

  beforeEach(() => {
    jest.clearAllMocks()

    exchangeManager = new ExchangeRateManager([mockedSource1, mockedSource2])

    getAllExchangesMock.mockReturnValue({
      [cUSD]: {
        [cUSD]: mockExchangeResult(1),
        b: mockExchangeResult(1.2),
        c: mockExchangeResult(1.3),
      },
      b: {
        [cUSD]: mockExchangeResult(0.8),
        b: mockExchangeResult(1),
        c: mockExchangeResult(0.8 * 1.3),
      },
      c: {
        [cUSD]: mockExchangeResult(0.7),
        b: mockExchangeResult(0.7 * 1.2),
        c: mockExchangeResult(1),
      },
    })
  })

  it('calculates USD prices correctly', async () => {
    const prices = await exchangeManager.calculateUSDPrices()

    expect(addExchangeMock).toHaveBeenCalledTimes(4)
    expect(addExchangeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: cUSD,
        to: 'b',
        rate: new BigNumber(1.2),
      })
    )
    expect(addExchangeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'b',
        to: cUSD,
        rate: new BigNumber(0.8),
      })
    )
    expect(addExchangeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: cUSD,
        to: 'c',
        rate: new BigNumber(1.3),
      })
    )
    expect(addExchangeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'c',
        to: cUSD,
        rate: new BigNumber(0.7),
      })
    )
    expect(estimatePricesMock).toHaveBeenCalledTimes(1)

    expect(prices[cUSD].toNumber()).toBeCloseTo(1, 10)
    expect(prices['b'].toNumber()).toBeCloseTo((1 / 1.2 + 0.8) / 2, 10)
    expect(prices['c'].toNumber()).toBeCloseTo((1 / 1.3 + 0.7) / 2, 10)
  })
})

function createExchange(from: string, to: string, rate: number): Exchange {
  return {
    from,
    to,
    rate: new BigNumber(rate),
    hasEnoughLiquidity: (usdPrice) => true,
  }
}

function mockExchangeResult(rate: number) {
  return {
    rate: new BigNumber(rate),
    lastExchange: {},
  }
}

import { StableToken } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import { handleExchangeQuery } from '.'

// TODO: There's too much mocking in this test, write e2e tests that run using a node.

const CELO_EXCHANGE_RATES = {
  [StableToken.cUSD]: {
    buy: 6,
    sell: 0.16,
  },
  [StableToken.cEUR]: {
    buy: 5,
    sell: 0.2,
  },
}

const writeExchangeMock = jest.fn()

jest.mock('../firebase', () => ({
  database: () => ({
    ref: jest.fn((path: string) => ({
      push: (rate: BigNumber) => writeExchangeMock(path, rate),
    })),
  }),
}))
jest.mock('../contractKit', () => ({
  getContractKit: () => ({
    contracts: {
      getExchange: (stableToken: StableToken) =>
        Promise.resolve({
          getExchangeRate: (_: BigNumber.Value, sellGold: boolean) => {
            const rate = sellGold
              ? CELO_EXCHANGE_RATES[stableToken].buy
              : CELO_EXCHANGE_RATES[stableToken].sell
            return Promise.resolve(rate)
          },
        }),
    },
  }),
}))

describe('updateExchangeRates', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('write correct values', async () => {
    await handleExchangeQuery()

    expect(writeExchangeMock).toHaveBeenCalledTimes(4)
    expect(writeExchangeMock).toHaveBeenCalledWith(
      '/exchangeRates/cGLD/cUSD',
      expect.objectContaining({
        exchangeRate: CELO_EXCHANGE_RATES[StableToken.cUSD].sell.toString(),
      })
    )
    expect(writeExchangeMock).toHaveBeenCalledWith(
      '/exchangeRates/cUSD/cGLD',
      expect.objectContaining({
        exchangeRate: CELO_EXCHANGE_RATES[StableToken.cUSD].buy.toString(),
      })
    )
    expect(writeExchangeMock).toHaveBeenCalledWith(
      '/exchangeRates/cGLD/cEUR',
      expect.objectContaining({
        exchangeRate: CELO_EXCHANGE_RATES[StableToken.cEUR].sell.toString(),
      })
    )
    expect(writeExchangeMock).toHaveBeenCalledWith(
      '/exchangeRates/cEUR/cGLD',
      expect.objectContaining({
        exchangeRate: CELO_EXCHANGE_RATES[StableToken.cEUR].buy.toString(),
      })
    )
  })
})

import BigNumber from 'bignumber.js'
import { ubeswapLiquidityPool } from './UbeswapLiquidityPool'

const FACTORY_ADDRESS = '0x62d5b84bE28a183aBB507E125B384122D2C25fAE'

const mockedFactoryContract = jest.fn((address) => ({
  getPastEvents: (event: string, config: any) => [
    createPairEvent('a', 'b', 'pairAB'),
    createPairEvent('b', 'c', 'pairBC'),
    createPairEvent('b', 'd', 'pairBD'), // 'd' token doesn't exist
    createPairEvent('a', 'c', 'pairAC'), // This pair doesn't exist
  ],
}))
const mockedPairContract = jest.fn((address) => ({
  methods: {
    getReserves: () => ({
      call: () => {
        switch (address) {
          case 'pairab':
            return { reserve0: '10000000000000000000', reserve1: '20000000000000000000' }
          case 'pairbc':
            return { reserve0: '20000000000000000000', reserve1: '30000000' }
          case 'pairbd':
            return { reserve0: '20000000000000000000', reserve1: '30000000' }
          default:
            throw new Error()
        }
      },
    }),
  },
}))
const mockedTokenContract = jest.fn((address) => ({
  methods: {
    decimals: () => ({
      call: () => {
        switch (address) {
          case 'a':
          case 'b':
            return 18
          case 'c':
            return 6
          default:
            throw new Error()
        }
      },
    }),
  },
}))

const tokens = ['a', 'b', 'c']

jest.mock('../../contractKit', () => ({
  getContractKit: () => ({
    web3: {
      eth: {
        Contract: jest.fn().mockImplementation((abi, address) => {
          if (address === FACTORY_ADDRESS) {
            return mockedFactoryContract(address)
          }
          if (tokens.includes(address)) {
            return mockedTokenContract(address)
          }
          return mockedPairContract(address)
        }),
      },
    },
  }),
}))

describe('UbeswapLiquidityPool', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns expected exchanges', async () => {
    const exchanges = await ubeswapLiquidityPool.getExchanges()

    expect(exchanges).toHaveLength(4)

    const exchangeAB = exchanges[0]
    const exchangeBA = exchanges[1]
    const exchangeBC = exchanges[2]
    const exchangeCB = exchanges[3]

    expect(exchangeAB).toMatchObject({
      from: 'a',
      to: 'b',
    })
    expect(exchangeAB.rate.toNumber()).toBeCloseTo((20 * 997) / (10 * 1000 + 997), 10)
    expect(exchangeAB.hasEnoughLiquidity(new BigNumber(1000))).toBeFalsy()
    expect(exchangeAB.hasEnoughLiquidity(new BigNumber(10000))).toBeTruthy()

    expect(exchangeBA).toMatchObject({
      from: 'b',
      to: 'a',
    })
    expect(exchangeBA.rate.toNumber()).toBeCloseTo((10 * 997) / (20 * 1000 + 997), 10)
    expect(exchangeBA.hasEnoughLiquidity(new BigNumber(1000))).toBeFalsy()
    expect(exchangeBA.hasEnoughLiquidity(new BigNumber(10000))).toBeTruthy()

    expect(exchangeBC).toMatchObject({
      from: 'b',
      to: 'c',
    })
    expect(exchangeBC.rate.toNumber()).toBeCloseTo((30 * 997) / (20 * 1000 + 997), 10)
    expect(exchangeBC.hasEnoughLiquidity(new BigNumber(1000))).toBeFalsy()
    expect(exchangeBC.hasEnoughLiquidity(new BigNumber(10000))).toBeTruthy()

    expect(exchangeCB).toMatchObject({
      from: 'c',
      to: 'b',
    })
    expect(exchangeCB.rate.toNumber()).toBeCloseTo((20 * 997) / (30 * 1000 + 997), 10)
    expect(exchangeCB.hasEnoughLiquidity(new BigNumber(1000))).toBeFalsy()
    expect(exchangeCB.hasEnoughLiquidity(new BigNumber(10000))).toBeTruthy()
  })
})

function createPairEvent(token0: string, token1: string, pair: string) {
  return {
    returnValues: {
      token0,
      token1,
      pair,
    },
  }
}

import BigNumber from 'bignumber.js'
import ExchangesGraph from './ExchangesGraph'

describe('ExchangeGraph', () => {
  let exchangeGraph: ExchangesGraph

  beforeEach(() => {
    exchangeGraph = new ExchangesGraph()
  })

  it('estimates prices correctly when there is no liquidity filtering', () => {
    addExchange(exchangeGraph, 'a', 'b', 1.2, 0)
    addExchange(exchangeGraph, 'a', 'c', 1.3, 0)
    addExchange(exchangeGraph, 'a', 'd', 1.1, 0)
    addExchange(exchangeGraph, 'b', 'e', 1.5, 0)
    addExchange(exchangeGraph, 'c', 'f', 1.4, 0)
    addExchange(exchangeGraph, 'e', 'f', 1.4, 0) // Since the estimation uses bfs, this exchanges shouldn't be used

    const expectedPrices = {
      a: 1,
      b: 1 / 1.2, // a -> b
      c: 1 / 1.3, // a -> c
      d: 1 / 1.1, // a -> d
      e: 1 / 1.2 / 1.5, // a -> b -> e
      f: 1 / 1.3 / 1.4, // a -> c -> f
    }

    const prices = exchangeGraph.estimatePrices('a')

    for (const [key, expectValue] of Object.entries(expectedPrices)) {
      expect(prices[key]?.toNumber()).toBeCloseTo(expectValue, 10)
    }
  })

  it('estimates prices correctly when there is liquidity filtering', () => {
    addExchange(exchangeGraph, 'a', 'b', 1.2, 0)
    addExchange(exchangeGraph, 'a', 'c', 1.3, 0)
    addExchange(exchangeGraph, 'a', 'd', 1.1, 0)
    addExchange(exchangeGraph, 'b', 'e', 1.5, 0)
    addExchange(exchangeGraph, 'c', 'f', 1.4, 1)
    addExchange(exchangeGraph, 'e', 'f', 1.4, 0) // Now c-f is filtered out so this exchanges should be used

    const expectedPrices = {
      a: 1,
      b: 1 / 1.2, // a -> b
      c: 1 / 1.3, // a -> c
      d: 1 / 1.1, // a -> d
      e: 1 / 1.2 / 1.5, // a -> b -> e
      f: 1 / 1.2 / 1.5 / 1.4, // a -> b -> e -> f
    }

    const prices = exchangeGraph.estimatePrices('a')

    for (const [key, expectValue] of Object.entries(expectedPrices)) {
      expect(prices[key]?.toNumber()).toBeCloseTo(expectValue, 10)
    }
  })

  it('calculates exchanges when there is no liquidity filtering', () => {
    addExchange(exchangeGraph, 'a', 'b', 1.2, 0)
    addExchange(exchangeGraph, 'a', 'c', 1.4, 0)
    addExchange(exchangeGraph, 'b', 'd', 1.3, 0)
    addExchange(exchangeGraph, 'c', 'd', 1.3, 0)
    addExchange(exchangeGraph, 'd', 'a', 0.5, 0)
    addExchange(exchangeGraph, 'd', 'b', 0.7, 0)

    const estimatedPrices = {
      a: new BigNumber(1),
      b: new BigNumber(1),
      c: new BigNumber(1),
      d: new BigNumber(1),
    }

    const expectedExchanges = {
      a: {
        a: { rate: '1' },
        b: { rate: '1.274', lastExchange: { from: 'd', to: 'b', rate: '0.7' } }, // a -> c -> d -> b
        c: { rate: '1.4', lastExchange: { from: 'a', to: 'c', rate: '1.4' } }, // a -> c
        d: { rate: '1.82', lastExchange: { from: 'c', to: 'd', rate: '1.3' } }, // a -> c -> d
      },
      b: {
        b: { rate: '1' },
        d: { rate: '1.3', lastExchange: { from: 'b', to: 'd', rate: '1.3' } }, // b -> d
        a: { rate: '0.65', lastExchange: { from: 'd', to: 'a', rate: '0.5' } }, // b -> d -> a
        c: { rate: '0.91', lastExchange: { from: 'a', to: 'c', rate: '1.4' } }, // b -> d -> a -> c
      },
      c: {
        c: { rate: '1' },
        d: { rate: '1.3', lastExchange: { from: 'c', to: 'd', rate: '1.3' } }, // c -> d
        a: { rate: '0.65', lastExchange: { from: 'd', to: 'a', rate: '0.5' } }, // c -> d -> a
        b: { rate: '0.91', lastExchange: { from: 'd', to: 'b', rate: '0.7' } }, // c -> d -> b
      },
      d: {
        d: { rate: '1' },
        a: { rate: '0.5', lastExchange: { from: 'd', to: 'a', rate: '0.5' } }, // d -> a
        b: { rate: '0.7', lastExchange: { from: 'd', to: 'b', rate: '0.7' } }, // d -> b
        c: { rate: '0.7', lastExchange: { from: 'a', to: 'c', rate: '1.4' } }, // d -> a -> c
      },
    }

    const exchanges = exchangeGraph.getAllExchanges(estimatedPrices)

    expect(JSON.stringify(exchanges)).toBe(JSON.stringify(expectedExchanges))
  })

  it('calculates exchanges when there is liquidity filtering', () => {
    addExchange(exchangeGraph, 'a', 'b', 1.2, 0)
    addExchange(exchangeGraph, 'a', 'c', 1.4, 0)
    addExchange(exchangeGraph, 'b', 'd', 1.3, 0)
    addExchange(exchangeGraph, 'c', 'd', 1.3, 0)
    addExchange(exchangeGraph, 'd', 'a', 0.5, 0)
    addExchange(exchangeGraph, 'd', 'b', 0.7, 2)

    const estimatedPrices = {
      a: new BigNumber(1),
      b: new BigNumber(1),
      c: new BigNumber(1),
      d: new BigNumber(1),
    }

    const expectedExchanges = {
      a: {
        a: { rate: '1' },
        b: { rate: '1.2', lastExchange: { from: 'a', to: 'b', rate: '1.2' } }, // a -> b
        c: { rate: '1.4', lastExchange: { from: 'a', to: 'c', rate: '1.4' } }, // a -> c
        d: { rate: '1.82', lastExchange: { from: 'c', to: 'd', rate: '1.3' } }, // a -> d
      },
      b: {
        b: { rate: '1' },
        d: { rate: '1.3', lastExchange: { from: 'b', to: 'd', rate: '1.3' } }, // b -> d
        a: { rate: '0.65', lastExchange: { from: 'd', to: 'a', rate: '0.5' } }, // b -> d -> a
        c: { rate: '0.91', lastExchange: { from: 'a', to: 'c', rate: '1.4' } }, // b -> d -> a -> c
      },
      c: {
        c: { rate: '1' },
        d: { rate: '1.3', lastExchange: { from: 'c', to: 'd', rate: '1.3' } }, // c -> d
        a: { rate: '0.65', lastExchange: { from: 'd', to: 'a', rate: '0.5' } }, // c -> d -> a
        b: { rate: '0.78', lastExchange: { from: 'a', to: 'b', rate: '1.2' } }, // c -> d -> a -> b
      },
      d: {
        d: { rate: '1' },
        a: { rate: '0.5', lastExchange: { from: 'd', to: 'a', rate: '0.5' } }, // d -> a
        b: { rate: '0.6', lastExchange: { from: 'a', to: 'b', rate: '1.2' } }, // d -> a -> b
        c: { rate: '0.7', lastExchange: { from: 'a', to: 'c', rate: '1.4' } }, // d -> a -> c
      },
    }

    const exchanges = exchangeGraph.getAllExchanges(estimatedPrices)

    expect(JSON.stringify(exchanges)).toBe(JSON.stringify(expectedExchanges))
  })

  it('throws an error if there is a possible arbitrage', () => {
    addExchange(exchangeGraph, 'a', 'b', 1.2, 0)
    addExchange(exchangeGraph, 'b', 'c', 1.4, 0)
    addExchange(exchangeGraph, 'c', 'a', 1.3, 0)

    const estimatedPrices = {
      a: new BigNumber(1),
      b: new BigNumber(1),
      c: new BigNumber(1),
    }

    expect(() => {
      exchangeGraph.getAllExchanges(estimatedPrices)
    }).toThrowError('Arbitrage')
  })
})

function addExchange(
  graph: ExchangesGraph,
  from: string,
  to: string,
  rate: number,
  liquidityPrice: number
): void {
  graph.addExchange({
    from,
    to,
    rate: new BigNumber(rate),
    hasEnoughLiquidity: (usdPrice: BigNumber) => usdPrice.isGreaterThan(liquidityPrice),
  })
}

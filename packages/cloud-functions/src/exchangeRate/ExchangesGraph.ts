import BigNumber from 'bignumber.js'

interface Graph {
  [from: string]: { [to: string]: Exchange[] }
}

interface ExchangesResult {
  [from: string]: { [to: string]: { rate: BigNumber; lastExchange?: Exchange } }
}

export interface Exchange {
  from: string
  to: string
  rate: BigNumber
  hasEnoughLiquidity(usdPrices?: BigNumber): boolean
  metadata?: any
}

export interface PriceByAddress {
  [address: string]: BigNumber
}

export default class ExchangesGraph {
  private graph: Graph = {}

  addExchange(exchange: Exchange): void {
    const { from, to, rate } = exchange

    if (rate.isLessThanOrEqualTo(0)) {
      console.warn("Exchange rates can't be negative or zero")
      return
    }

    if (!this.graph[from]) {
      this.graph[from] = {}
    }

    if (!this.graph[from][to]) {
      this.graph[from][to] = []
    }

    this.graph[from][to].push(exchange)
  }

  // High level price estimation
  estimatePrices(tokenPattern: string): PriceByAddress {
    const prices: PriceByAddress = {}
    prices[tokenPattern] = new BigNumber(1)
    const queue = [tokenPattern]

    while (queue.length > 0) {
      const from = queue.pop()!
      if (this.graph[from]) {
        for (const [to, exchangesTo] of Object.entries(this.graph[from])) {
          if (!prices[to]) {
            for (const exchange of exchangesTo) {
              if (exchange.hasEnoughLiquidity(prices[from])) {
                prices[to] = prices[from].times(exchange.rate.pow(-1))
                queue.push(to)
                break
              }
            }
          }
        }
      }
    }

    return prices
  }

  // This approach uses a Floyd-Wharshall algorithm: https://en.wikipedia.org/wiki/Floyd%E2%80%93Warshall_algorithm
  // Its time complexity is O(n^3) where n is the numbers of tokens
  // If we expect to have thoudsans of tokens we should try with a different approach.
  // Throws an error if there was an arbitrage
  // Given estimated prices are used to filter out exchanges with low liquidity
  getAllExchanges(estimatedPrices: PriceByAddress): ExchangesResult {
    const result: ExchangesResult = {}
    const tokens = Object.keys(this.graph)

    // Initialization
    tokens.forEach((token: any) => {
      result[token] = {}
      result[token][token] = { rate: new BigNumber(1) }

      const neighbours = Object.entries(this.graph[token])
      for (const [to, exchangesTo] of neighbours) {
        const exchanges = exchangesTo.filter((exchange) =>
          exchange.hasEnoughLiquidity(estimatedPrices[token])
        )

        if (exchanges.length > 0) {
          let bestPriceIndex = 0
          exchanges.forEach((exchange, i) => {
            if (exchange.rate.isGreaterThan(exchanges[bestPriceIndex].rate)) {
              bestPriceIndex = i
            }
          })

          result[token][to] = {
            rate: exchanges[bestPriceIndex].rate,
            lastExchange: exchanges[bestPriceIndex],
          }
        }
      }
    })

    // Calculating all exchanges
    for (const k of tokens) {
      for (const i of tokens) {
        if (!result[i][k]) {
          continue
        }

        for (const j of tokens) {
          if (!result[k][j]) {
            continue
          }

          if (
            !result[i][j] ||
            result[i][j].rate.isLessThan(result[i][k].rate.times(result[k][j].rate))
          ) {
            result[i][j] = {
              rate: result[i][k].rate.times(result[k][j].rate),
              lastExchange: result[k][j].lastExchange,
            }

            if (i == j) {
              this.logArbitrage(result, i, estimatedPrices)
              throw new Error('There is a possible Arbitrage')
            }
          }
        }
      }
    }

    return result
  }

  logArbitrage(result: ExchangesResult, start: string, prices: PriceByAddress) {
    console.log('There is a possible Arbitrage')

    let current = start
    let prev = result[start][current].lastExchange?.from
    let first = true

    while (prev && (first || current !== start)) {
      first = false
      const lastExchange = result[prev][current].lastExchange
      if (!lastExchange) {
        return
      }
      console.log(`
      FROM: ${lastExchange.from} (estimated price: ${prices[lastExchange.from]})
      TO: ${lastExchange.to} (estimated price: ${prices[lastExchange.to]})
      AT: ${lastExchange.rate.toNumber()} (metadata: ${JSON.stringify(lastExchange.metadata)})`)
      current = prev
      prev = result[start][current].lastExchange?.from
    }
  }
}

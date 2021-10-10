import BigNumber from 'bignumber.js'

interface Graph {
  [from: string]: { [to: string]: BigNumber }
}

// lastExchangeFrom is useful to build the full exchange path.
interface ExchangesResult {
  [from: string]: { [to: string]: { rate: BigNumber; lastExchangeFrom: string } }
}

export interface Exchange {
  from: string
  to: string
  rate: BigNumber
}

export default class ExchangesGraph {
  private graph: Graph = {}

  addExchange({ from, to, rate }: Exchange): void {
    if (rate.isLessThanOrEqualTo(0)) {
      console.warn("Exchange rates can't be negative or zero")
      return
    }

    if (!this.graph[from]) {
      this.graph[from] = {}
    }

    if (this.graph[from][to]) {
      console.warn(`The exchange ${from} - ${to} was already set, best value will be kept`)
    }

    if (rate.isGreaterThan(this.graph[from][to] ?? 0)) {
      this.graph[from][to] = rate
    }
  }

  // This approach uses a Floyd-Wharshall algorithm: https://en.wikipedia.org/wiki/Floyd%E2%80%93Warshall_algorithm
  // Its time complexity is O(n^3) where n is the numbers of tokens
  // If we expect to have thoudsans of tokens we should try with a different approach.
  // Returns null if there was an arbitrage
  getAllExchanges(): ExchangesResult | null {
    const result: ExchangesResult = {}
    const tokens = Object.keys(this.graph)
    tokens.forEach((token: any) => {
      result[token] = {}
      result[token][token] = { rate: new BigNumber(1), lastExchangeFrom: token }

      const neighbours = Object.entries(this.graph[token])
      for (const [to, rate] of neighbours) {
        result[token][to] = { rate, lastExchangeFrom: token }
      }
    })

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
              lastExchangeFrom: result[k][j].lastExchangeFrom,
            }

            if (i == j) {
              this.logArbitrage(result, i)
              return null
            }
          }
        }
      }
    }

    return result
  }

  logArbitrage(result: ExchangesResult, i: string) {
    console.log('There is a possible Arbitrage')

    let current = i
    let prev = result[i][current].lastExchangeFrom
    let first = true

    while (first || current !== i) {
      first = false
      console.log(`From ${prev} - ${current} at ${result[prev][current].rate}`)
      current = prev
      prev = result[i][current].lastExchangeFrom
    }
  }
}

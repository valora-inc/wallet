interface Graph {
  [from: string]: { [to: string]: number }
}

// lastExchangeFrom is useful to build the exchange path.
interface ExchangesResult {
  [from: string]: { [to: string]: { rate: number; lastExchangeFrom: string } }
}

interface Exchange {
  from: string
  to: string
  rate: number
}

export class ExchangesGraph {
  private graph: Graph = {}

  addExchange({ from, to, rate }: Exchange): void {
    if (rate <= 0) {
      console.warn("Exchange rates can't be negative or zero")
      return
    }

    if (!this.graph[from]) {
      this.graph[from] = {}
    }

    if (this.graph[from][to]) {
      console.warn(`The exchange ${from} - ${to} was already set, best value will be kept`)
    }

    this.graph[from][to] = Math.max(this.graph[from][to] ?? 0, rate)
  }

  // This approach uses a Floyd-Wharshall algorithm: https://en.wikipedia.org/wiki/Floyd%E2%80%93Warshall_algorithm
  // Its time complexity is O(n^3) where n is the numbers of tokens
  // If we expect to have thoudsans of tokens we should try with a different approach.
  getAllExchanges(): ExchangesResult {
    const result: ExchangesResult = {}
    const tokens = Object.keys(this.graph)
    tokens.forEach((token: any) => {
      result[token] = {}
      result[token][token] = { rate: 1, lastExchangeFrom: token }

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

          if (!result[i][j] || result[i][j].rate < result[i][k].rate * result[k][j].rate) {
            result[i][j] = {
              rate: result[i][k].rate * result[k][j].rate,
              lastExchangeFrom: result[k][j].lastExchangeFrom,
            }
          }
        }
      }
    }

    for (const i of tokens) {
      if (result[i][i].rate > 1) {
        console.warn('There is a possible Arbitrage')
      }
    }

    return result
  }
}

interface Graph {
  [from: string]: { [to: string]: number }
}

interface ExchangesResult {
  [from: string]: { [to: string]: { rate: number; lastExchangeFrom: string } }
}

interface Exchange {
  from: string
  to: string
  rate: number
}

class ExchangesGraph {
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
      console.warn(`The exchange ${from} - ${to} was already set, overriding older value`)
    }

    this.graph[from][to] = rate
  }

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

const graph = new ExchangesGraph()
graph.addExchange({ from: 'test1', to: 'test2', rate: 1.2 })
graph.addExchange({ from: 'test2', to: 'test1', rate: 0.75 })

graph.addExchange({ from: 'test2', to: 'test3', rate: 1.2 })
graph.addExchange({ from: 'test3', to: 'test2', rate: 0.75 })

graph.addExchange({ from: 'test1', to: 'test3', rate: 1.7 })
graph.addExchange({ from: 'test3', to: 'test1', rate: 0.55 })

graph.addExchange({ from: 'test2', to: 'test4', rate: 0.7 })
graph.addExchange({ from: 'test4', to: 'test2', rate: 1.4 })

console.log(`${JSON.stringify(graph.getAllExchanges())}`)

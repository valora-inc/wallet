import { TOKEN_ADDRESSES } from '../config'
import ExchangesGraph, { Exchange, PriceByAddress } from './ExchangesGraph'

export interface ExchangeProvider {
  getExchanges(): Promise<Exchange[]>
}

const cUSD = TOKEN_ADDRESSES.cUSD.toLowerCase()

export default class ExchangeRateManager {
  private sources: ExchangeProvider[] = []

  constructor(sources: ExchangeProvider[]) {
    this.sources = sources
  }

  private async getExchangesFromSources() {
    const exchanges: Exchange[] = []
    for (const source of this.sources) {
      try {
        exchanges.push(...(await source.getExchanges()))
      } catch (err) {
        console.warn(
          `Couldn't obtain exchanges from source: ${JSON.stringify(source)}`,
          (err as Error).message
        )
      }
    }
    return exchanges
  }

  private buildGraph(exchanges: Exchange[]): ExchangesGraph {
    const graph = new ExchangesGraph()
    exchanges.forEach((exchange) => graph.addExchange(exchange))
    return graph
  }

  async calculateUSDPrices(): Promise<PriceByAddress> {
    console.log(Date.now())
    const exchanges = await this.getExchangesFromSources()
    console.log(Date.now())
    const graph = this.buildGraph(exchanges)
    console.log(Date.now())
    const estimatedPrices = graph.estimatePrices(cUSD)
    console.log(Date.now())
    const exchangePrices = graph.getAllExchanges(estimatedPrices)
    console.log(Date.now())
    const result: PriceByAddress = {}
    for (const address of Object.keys(exchangePrices)) {
      if (exchangePrices[address][cUSD] && exchangePrices[cUSD][address]) {
        const price = exchangePrices[address][cUSD].rate
          .plus(exchangePrices[cUSD][address].rate.pow(-1))
          .dividedBy(2)

        result[address] = price
      }
    }

    return result
  }
}

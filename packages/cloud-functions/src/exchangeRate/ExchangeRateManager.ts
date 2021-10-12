import ExchangesGraph, { Exchange, PriceByAddress } from './ExchangesGraph'

export interface ExchangeProvider {
  getExchanges(): Promise<Exchange[]>
}

// Mainnet address (TODO: make this configurable)
const cUSD = '0x765DE816845861e75A25fCA122bb6898B8B1282a'.toLocaleLowerCase()

export default class ExchangeRateManager {
  private sources: ExchangeProvider[] = []

  constructor(sources: ExchangeProvider[]) {
    this.sources = sources
  }

  private async getExchangesFromSources() {
    const exchanges: Exchange[] = []
    for (const source of this.sources) {
      const sourceExchanges = await source.getExchanges()
      exchanges.push(...sourceExchanges)
    }
    return exchanges
  }

  private buildGraph(exchanges: Exchange[]): ExchangesGraph {
    const graph = new ExchangesGraph()
    exchanges.forEach((exchange) => graph.addExchange(exchange))
    return graph
  }

  async calculateUSDPrices(): Promise<PriceByAddress> {
    const exchanges = await this.getExchangesFromSources()

    const graph = this.buildGraph(exchanges)

    const estimatedPrices = graph.estimatePrices(cUSD)

    const exchangePrices = graph.getAllExchanges(estimatedPrices)

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

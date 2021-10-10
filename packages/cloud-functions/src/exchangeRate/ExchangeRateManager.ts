import { fetchFromFirebase, updateFirebase } from '../firebase'
import ExchangesGraph, { Exchange } from './ExchangesGraph'

export interface Token {
  address: string
  name: string
  symbol: string
  usdPrice?: string
  decimals?: number
}

export interface ExchangeProvider {
  getExchangesFromTokens(tokens: Token[]): Promise<Exchange[]>
}

const firebaseNodeKey = '/tokensInfo'

export default class ExchangeRateManager {
  private sources: ExchangeProvider[] = []

  constructor(sources: ExchangeProvider[]) {
    this.sources = sources
    console.log(this.sources)
  }

  private async getExchangesFromSources(tokensInfo: Token[]) {
    const exchanges: Exchange[] = []
    for (const source of this.sources) {
      const sourceExchanges = await source.getExchangesFromTokens(tokensInfo)
      exchanges.push(...sourceExchanges)
    }
    console.log(`Exchanges: ${JSON.stringify(exchanges)}`)
    return exchanges
  }

  private buildGraph(exchanges: Exchange[]): ExchangesGraph {
    const graph = new ExchangesGraph()
    exchanges.forEach((exchange) => graph.addExchange(exchange))
    return graph
  }

  async refreshTokenPrices() {
    const tokensInfoRaw = await fetchFromFirebase(firebaseNodeKey)
    console.log(`TOKENS FROM FIREBASE: ${JSON.stringify(tokensInfoRaw)}`)

    const tokensInfo = Object.values(tokensInfoRaw).reduce((acc, token) => {
      // @ts-ignore
      return { ...acc, [token.address.toLowerCase()]: token }
    }, {})

    // @ts-ignore
    const tokensAddresses = Object.values(tokensInfo).map((value) => value.address)

    const exchanges = await this.getExchangesFromSources(Object.values(tokensInfoRaw))

    const graph = this.buildGraph(exchanges)

    const cUSD = '0x765DE816845861e75A25fCA122bb6898B8B1282a'.toLocaleLowerCase()

    const exchangePrices = graph.getAllExchanges()

    if (!exchangePrices) {
      console.log("Couldn't obtain accurate prices")
      return
    }

    console.log(exchangePrices)

    // @ts-ignore
    for (const [key, token] of Object.entries(tokensInfoRaw)) {
      console.log(`${key}: ${JSON.stringify(token)}`)
      // @ts-ignore
      const address = token.address.toLowerCase()

      if (
        exchangePrices[address] &&
        exchangePrices[address][cUSD] &&
        exchangePrices[cUSD][address]
      ) {
        const price = exchangePrices[address][cUSD].rate
          .plus(exchangePrices[cUSD][address].rate.pow(-1))
          .dividedBy(2)

        console.log(
          // @ts-ignore
          `USD Price for ${token.name}: ${price} fromUSD: ${exchangePrices[cUSD][address].rate.pow(
            -1
          )} toUSD: ${exchangePrices[address][cUSD].rate}`
        )
        updateFirebase(`${firebaseNodeKey}/${key}/usdPrice`, price.toString())
      }
    }
  }
}

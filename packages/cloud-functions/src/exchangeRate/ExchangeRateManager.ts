import { fetchFromFirebase, updateFirebase } from '../firebase'
import ExchangesGraph from './ExchangesGraph'

export interface LiquidityPoolInfo {
  token0: string
  token1: string
  liquidityToken0: number
  liquidityToken1: number
  rateFrom0To1: number
  rateFrom1To0: number
}

export interface LiquidityPoolProvider {
  getInfoFromToken(tokens: string[]): Promise<LiquidityPoolInfo[]>
}

const firebaseNodeKey = '/tokensInfo'
const MIN_LIQUIDITY = 100000

export default class ExchangeRateManager {
  private sources: LiquidityPoolProvider[] = []

  constructor(sources: LiquidityPoolProvider[]) {
    this.sources = sources
    console.log(this.sources)
  }

  private async getLiquidityPoolsFromSources(tokensAddress: string[]) {
    const exchanges: LiquidityPoolInfo[] = []
    for (const source of this.sources) {
      const liquidityPoolInfo = await source.getInfoFromToken(tokensAddress)
      exchanges.push(...liquidityPoolInfo)
    }
    return exchanges
  }

  private buildGraph(liquidityPools: LiquidityPoolInfo[]): ExchangesGraph {
    const graph = new ExchangesGraph()
    liquidityPools.forEach((lp) => {
      graph.addExchange({ from: lp.token0, to: lp.token1, rate: lp.rateFrom0To1 })
      graph.addExchange({ from: lp.token1, to: lp.token0, rate: lp.rateFrom1To0 })
    })

    this.addHardcodedExchanges(graph)
    return graph
  }

  private addHardcodedExchanges(graph: ExchangesGraph) {
    const cUSD = '0x765DE816845861e75A25fCA122bb6898B8B1282a'.toLocaleLowerCase()
    const cEUR = '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73'.toLocaleLowerCase()
    const mcUSD = '0x64dEFa3544c695db8c535D289d843a189aa26b98'.toLocaleLowerCase()
    const mcEUR = '0xa8d0E6799FF3Fd19c6459bf02689aE09c4d78Ba7'.toLocaleLowerCase()
    graph.addExchange({ from: cUSD, to: mcUSD, rate: 1 })
    graph.addExchange({ from: mcUSD, to: cUSD, rate: 1 })
    graph.addExchange({ from: cEUR, to: mcEUR, rate: 1 })
    graph.addExchange({ from: mcEUR, to: cEUR, rate: 1 })
  }

  private hasEnoughtLiquidity(lp: LiquidityPoolInfo, tokens: any): boolean {
    console.log(`LP: ${JSON.stringify(lp)}`)

    if (tokens[lp.token1] && tokens[lp.token1].usdPrice) {
      const decimal = tokens[lp.token1].decimals ?? 18
      const liq = (lp.liquidityToken1 / Math.pow(10, decimal)) * tokens[lp.token1].usdPrice
      return liq * 2 > MIN_LIQUIDITY
    }

    if (tokens[lp.token0] && tokens[lp.token0].usdPrice) {
      const decimal = tokens[lp.token0].decimals ?? 18
      const liq = (lp.liquidityToken0 / Math.pow(10, decimal)) * tokens[lp.token0].usdPrice
      return liq * 2 > MIN_LIQUIDITY
    }

    return false
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

    const liquidityPools = (await this.getLiquidityPoolsFromSources(tokensAddresses)).filter((lp) =>
      this.hasEnoughtLiquidity(lp, tokensInfo)
    )

    const graph = this.buildGraph(liquidityPools)
    const exchangePrices = graph.getAllExchanges()

    console.log(exchangePrices)

    const cUSD = '0x765DE816845861e75A25fCA122bb6898B8B1282a'.toLocaleLowerCase()

    // @ts-ignore
    for (const [key, token] of Object.entries(tokensInfoRaw)) {
      console.log(`${key}: ${JSON.stringify(token)}`)
      // @ts-ignore
      const address = token.address.toLowerCase()

      if (exchangePrices[address]) {
        const price =
          (exchangePrices[address][cUSD].rate + 1 / exchangePrices[cUSD][address].rate) / 2
        // @ts-ignore
        console.log(
          `USD Price for ${token.name}: ${price} fromUSD: ${
            1 / exchangePrices[cUSD][address].rate
          } toUSD: ${exchangePrices[address][cUSD].rate}`
        )
        updateFirebase(`${firebaseNodeKey}/${key}/usdPrice`, price)
      }
    }
  }
}

import { getContractKit } from '../../contractKit'
import { LiquidityPoolInfo, LiquidityPoolProvider } from '../ExchangeRateManager'
import { factoryAbi, pairAbi } from './UbeswapABI'

const FACTORY_ADDRESS = '0x62d5b84bE28a183aBB507E125B384122D2C25fAE'

interface ExchangePair {
  token0: string
  token1: string
  pairAddress: string
}

class UbeswapLiquidityPool implements LiquidityPoolProvider {
  async getInfoFromToken(tokens: string[]): Promise<LiquidityPoolInfo[]> {
    const results: LiquidityPoolInfo[] = []
    const kit = await getContractKit()

    const supportedPairs = await getSupportedPairs(
      kit,
      tokens.map((token) => token.toLowerCase())
    )

    for (const pair of supportedPairs) {
      results.push(await getInfoFromPair(kit, pair))
    }

    return results
  }
}

async function getSupportedPairs(kit: any, tokens: string[]): Promise<ExchangePair[]> {
  const factory = new kit.web3.eth.Contract(factoryAbi, FACTORY_ADDRESS)

  // Get all the liquidity pools created
  const pairsEvents = await factory.getPastEvents('PairCreated', {
    fromBlock: '0',
    toBlock: 'latest',
  })

  const pairs: ExchangePair[] = pairsEvents.map((pairEvent: any) => ({
    token0: pairEvent.returnValues.token0.toLowerCase(),
    token1: pairEvent.returnValues.token1.toLowerCase(),
    pairAddress: pairEvent.returnValues.pair.toLowerCase(),
  }))

  return pairs.filter(
    (pair: ExchangePair) => tokens.includes(pair.token0) && tokens.includes(pair.token1)
  )
}

function getExchangeRateFromReserves(reserve0: number, reserve1: number) {
  const numerator = 997 * reserve1
  const denominator = reserve0 * 1000 + 997
  return numerator / denominator
}

async function getInfoFromPair(kit: any, pair: any): Promise<LiquidityPoolInfo> {
  // @ts-ignore
  const pairContract = new kit.web3.eth.Contract(pairAbi, pair.pairAddress)
  const { reserve0, reserve1 } = await pairContract.methods.getReserves().call()
  return {
    token0: pair.token0,
    token1: pair.token1,
    liquidityToken0: reserve0,
    liquidityToken1: reserve1,
    rateFrom0To1: getExchangeRateFromReserves(reserve0, reserve1),
    rateFrom1To0: getExchangeRateFromReserves(reserve1, reserve0),
  }
}

export const ubeswapLiquidityPool = new UbeswapLiquidityPool()

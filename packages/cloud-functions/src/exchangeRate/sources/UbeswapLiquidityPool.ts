import { ContractKit } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import asyncPool from 'tiny-async-pool'
import { UBESWAP_DATA } from '../../config'
import { getContractKit } from '../../contractKit'
import { ExchangeProvider } from '../ExchangeRateManager'
import { Exchange } from '../ExchangesGraph'
import erc20Abi from './abis/ERC20.json'
import factoryAbi from './abis/Factory.json'
import pairAbi from './abis/Pair.json'

const FACTORY_ADDRESS = UBESWAP_DATA.factory_address?.toLowerCase()
const MIN_LIQUIDITY = UBESWAP_DATA?.min_liquidity ?? 100000
const MAX_CONCURRENCY = UBESWAP_DATA?.max_concurrency ?? 30

interface ExchangePair {
  token0: string
  token1: string
  pairAddress: string
}

interface DecimalsByToken {
  [token: string]: number
}

class UbeswapLiquidityPool implements ExchangeProvider {
  async getExchanges(): Promise<Exchange[]> {
    const results: Exchange[] = []
    const kit = await getContractKit()

    const pairs = await this.getAllPairs(kit)

    const decimals = await this.getDecimalsInfoFromPairs(kit, pairs)

    await asyncPool(MAX_CONCURRENCY, pairs, async (pair) => {
      try {
        results.push(...(await this.getExchangesFromPair(kit, pair, decimals)))
      } catch (err) {
        console.warn(
          `Couldn't obtain exchanges from pair: ${JSON.stringify(pair)}`,
          (err as Error).message
        )
      }
    })

    return results.filter((exchange) => exchange.rate.isGreaterThan(0))
  }

  private async getAllPairs(kit: ContractKit): Promise<ExchangePair[]> {
    // @ts-ignore
    const factory = new kit.web3.eth.Contract(factoryAbi, FACTORY_ADDRESS)

    // Get all the liquidity pools created
    const pairsEvents = await factory.getPastEvents('PairCreated', {
      fromBlock: '0',
      toBlock: 'latest',
    })

    const pairs = pairsEvents.map((pairEvent: any) => ({
      token0: pairEvent.returnValues.token0.toLowerCase(),
      token1: pairEvent.returnValues.token1.toLowerCase(),
      pairAddress: pairEvent.returnValues.pair.toLowerCase(),
    }))

    return pairs
  }

  private async getDecimalsInfoFromPairs(
    kit: ContractKit,
    pairs: ExchangePair[]
  ): Promise<DecimalsByToken> {
    const decimals: DecimalsByToken = pairs
      .flatMap((pair) => [pair.token0, pair.token1])
      .reduce((ans, token) => ({ ...ans, [token]: undefined }), {})

    await asyncPool(MAX_CONCURRENCY, Object.keys(decimals), async (token: string) => {
      try {
        decimals[token] = await this.getDecimalsInfo(kit, token)
      } catch (err) {
        console.warn(`Couldn't obtain decimals info for: ${token}`, (err as Error).message)
      }
    })

    return decimals
  }

  private async getDecimalsInfo(kit: ContractKit, address: string): Promise<number> {
    // @ts-ignore
    const tokenContract = new kit.web3.eth.Contract(erc20Abi, address)
    return tokenContract.methods.decimals().call()
  }

  private getExchangeRateFromReserves(reserve0: BigNumber, reserve1: BigNumber) {
    const numerator = reserve1.times(997)
    const denominator = reserve0.times(1000).plus(997)
    return numerator.dividedBy(denominator)
  }

  private async getExchangesFromPair(
    kit: ContractKit,
    pair: ExchangePair,
    decimalsByToken: DecimalsByToken
  ): Promise<Exchange[]> {
    if (!decimalsByToken[pair.token0] || !decimalsByToken[pair.token1]) {
      return []
    }

    // @ts-ignore
    const pairContract = new kit.web3.eth.Contract(pairAbi, pair.pairAddress)
    const { reserve0, reserve1 } = await pairContract.methods.getReserves().call()
    const reserve0BigNumber = new BigNumber(reserve0).dividedBy(
      Math.pow(10, decimalsByToken[pair.token0])
    )
    const reserve1BigNumber = new BigNumber(reserve1).dividedBy(
      Math.pow(10, decimalsByToken[pair.token1])
    )

    return [
      {
        from: pair.token0,
        to: pair.token1,
        rate: this.getExchangeRateFromReserves(reserve0BigNumber, reserve1BigNumber),
        hasEnoughLiquidity: this.hasEnoughLiquidityGenerator(reserve0BigNumber),
        metadata: {
          source: 'Ubeswap',
          fromReserve: reserve0BigNumber.toNumber(),
          toReserve: reserve1BigNumber.toNumber(),
          pairAddress: pair.pairAddress,
        },
      },
      {
        from: pair.token1,
        to: pair.token0,
        rate: this.getExchangeRateFromReserves(reserve1BigNumber, reserve0BigNumber),
        hasEnoughLiquidity: this.hasEnoughLiquidityGenerator(reserve1BigNumber),
        metadata: {
          source: 'Ubeswap',
          fromReserve: reserve1BigNumber.toNumber(),
          toReserve: reserve0BigNumber.toNumber(),
          pairAddress: pair.pairAddress,
        },
      },
    ]
  }

  private hasEnoughLiquidityGenerator(reserve: BigNumber) {
    return (usdPrice?: BigNumber) => {
      if (!usdPrice) {
        return false
      }

      const liquidity = reserve.times(usdPrice)

      return liquidity.times(2).isGreaterThan(MIN_LIQUIDITY)
    }
  }
}

export const ubeswapLiquidityPool = new UbeswapLiquidityPool()

import { ContractKit } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import { Exchange } from 'src/exchangeRate/ExchangesGraph'
import { getContractKit } from '../../contractKit'
import { ExchangeProvider, Token } from '../ExchangeRateManager'
import { factoryAbi, pairAbi } from './UbeswapABI'

const FACTORY_ADDRESS = '0x62d5b84bE28a183aBB507E125B384122D2C25fAE'

interface ExchangePair {
  token0: string
  token1: string
  pairAddress: string
}

const MIN_LIQUIDITY = 100000

/*
 * Only works in mainnet
 */
class UbeswapLiquidityPool implements ExchangeProvider {
  async getExchangesFromTokens(tokens: Token[]): Promise<Exchange[]> {
    const results: Exchange[] = []
    const kit = await getContractKit()

    const tokensInfoByAddress = tokens.reduce((acc, token) => {
      // @ts-ignore
      return { ...acc, [token.address.toLowerCase()]: token }
    }, {})

    const pairs = await this.getAllPairs(kit, Object.keys(tokensInfoByAddress))

    for (const pair of pairs) {
      results.push(...(await this.getExchangesFromPair(kit, pair, tokensInfoByAddress)))
    }

    return results
  }

  private async getAllPairs(kit: ContractKit, addresses: string[]): Promise<ExchangePair[]> {
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

    return pairs.filter(
      (pair: ExchangePair) => addresses.includes(pair.token0) || addresses.includes(pair.token1)
    )
  }

  private getExchangeRateFromReserves(reserve0: string, reserve1: string) {
    const numerator = new BigNumber(reserve1).times(997)
    const denominator = new BigNumber(reserve0).times(1000).plus(997)
    return numerator.dividedBy(denominator)
  }

  private async getExchangesFromPair(
    kit: ContractKit,
    pair: ExchangePair,
    tokensInfoByAddress: { [address: string]: Token }
  ): Promise<Exchange[]> {
    // @ts-ignore
    const pairContract = new kit.web3.eth.Contract(pairAbi, pair.pairAddress)
    const ans = await pairContract.methods.getReserves().call()
    const { reserve0, reserve1 } = ans

    if (
      this.hasEnoughLiquidity(reserve0, tokensInfoByAddress[pair.token0]) ||
      this.hasEnoughLiquidity(reserve1, tokensInfoByAddress[pair.token1])
    ) {
      return [
        {
          from: pair.token0,
          to: pair.token1,
          rate: this.getExchangeRateFromReserves(reserve0, reserve1),
        },
        {
          from: pair.token1,
          to: pair.token0,
          rate: this.getExchangeRateFromReserves(reserve1, reserve0),
        },
      ]
    }

    return []
  }

  private hasEnoughLiquidity(reserve: string, token: Token): boolean {
    if (token?.usdPrice) {
      const decimals = token.decimals ?? 18
      const liquidity = new BigNumber(reserve)
        .dividedBy(Math.pow(10, decimals))
        .times(new BigNumber(token.usdPrice))

      return liquidity.times(2).isGreaterThan(MIN_LIQUIDITY)
    }

    return false
  }
}

export const ubeswapLiquidityPool = new UbeswapLiquidityPool()

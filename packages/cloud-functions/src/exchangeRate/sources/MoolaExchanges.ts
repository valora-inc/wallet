import BigNumber from 'bignumber.js'
import { TOKEN_ADDRESSES } from '../../config'
import { ExchangeProvider } from '../ExchangeRateManager'
import { Exchange } from '../ExchangesGraph'

const cUSD = TOKEN_ADDRESSES.cUSD.toLowerCase()
const cEUR = TOKEN_ADDRESSES.cEUR.toLowerCase()
const mcUSD = TOKEN_ADDRESSES.mcUSD.toLowerCase()
const mcEUR = TOKEN_ADDRESSES.mcEUR.toLowerCase()

class MoolaExchanges implements ExchangeProvider {
  async getExchanges(): Promise<Exchange[]> {
    return [
      { from: cUSD, to: mcUSD, rate: new BigNumber(1), hasEnoughLiquidity: (p) => true },
      { from: mcUSD, to: cUSD, rate: new BigNumber(1), hasEnoughLiquidity: (p) => true },
      { from: cEUR, to: mcEUR, rate: new BigNumber(1), hasEnoughLiquidity: (p) => true },
      { from: mcEUR, to: cEUR, rate: new BigNumber(1), hasEnoughLiquidity: (p) => true },
    ]
  }
}

export const moolaExchanges = new MoolaExchanges()

import BigNumber from 'bignumber.js'
import { ExchangeProvider, Token } from '../ExchangeRateManager'
import { Exchange } from '../ExchangesGraph'

class MoolaExchanges implements ExchangeProvider {
  async getExchangesFromTokens(tokens: Token[]): Promise<Exchange[]> {
    // TODO: We are using Mainnet addresses here, but should get this info from some config or from given tokens info (Using some convention).
    const cUSD = '0x765DE816845861e75A25fCA122bb6898B8B1282a'.toLocaleLowerCase()
    const cEUR = '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73'.toLocaleLowerCase()
    const mcUSD = '0x64dEFa3544c695db8c535D289d843a189aa26b98'.toLocaleLowerCase()
    const mcEUR = '0xa8d0E6799FF3Fd19c6459bf02689aE09c4d78Ba7'.toLocaleLowerCase()
    return [
      { from: cUSD, to: mcUSD, rate: new BigNumber(1) },
      { from: mcUSD, to: cUSD, rate: new BigNumber(1) },
      { from: cEUR, to: mcEUR, rate: new BigNumber(1) },
      { from: mcEUR, to: cEUR, rate: new BigNumber(1) },
    ]
  }
}

export const moolaExchanges = new MoolaExchanges()

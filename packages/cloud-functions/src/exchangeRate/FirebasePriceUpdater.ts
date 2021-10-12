import * as functions from 'firebase-functions'
import { fetchFromFirebase, updateFirebase } from '../firebase'
import ExchangeRateManager from './ExchangeRateManager'
import { EstimatedPrices } from './ExchangesGraph'
import { moolaExchanges } from './sources/MoolaExchanges'
import { ubeswapLiquidityPool } from './sources/UbeswapLiquidityPool'

const FIREBASE_NODE_KEY = '/tokensInfo'

export default class FirebasePriceUpdater {
  manager: ExchangeRateManager

  constructor(manager: ExchangeRateManager) {
    this.manager = manager
  }

  async refreshAllPrices() {
    try {
      const prices = await this.manager.calculateUSDPrices()
      await this.updatePrices(prices)
    } catch (e) {
      console.log('There was an error calculating prices', e)
      return
    }
  }

  private async updatePrices(prices: EstimatedPrices) {
    const tokensInfoRaw = await fetchFromFirebase(FIREBASE_NODE_KEY)

    // @ts-ignore
    for (const [key, token] of Object.entries(tokensInfoRaw)) {
      // @ts-ignore
      const address = token.address.toLowerCase()
      if (prices[address]) {
        await updateFirebase(`${FIREBASE_NODE_KEY}/${key}/usdPrice`, prices[address].toString())
      }
    }
  }
}

function updatePrices() {
  const updater = new FirebasePriceUpdater(
    new ExchangeRateManager([ubeswapLiquidityPool, moolaExchanges])
  )
  updater.refreshAllPrices().then((res) => console.log('Refreshed tokens'))
}

export const updateFirebasePrices = functions.pubsub
  .schedule('*/10 * * * *') // every 10 mins
  .onRun(updatePrices)

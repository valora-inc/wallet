import * as functions from 'firebase-functions'
import asyncPool from 'tiny-async-pool'
import { fetchFromFirebase, updateFirebase } from '../firebase'
import ExchangeRateManager from './ExchangeRateManager'
import { PriceByAddress } from './ExchangesGraph'
import { moolaExchanges } from './sources/MoolaExchanges'
import { ubeswapLiquidityPool } from './sources/UbeswapLiquidityPool'

const FIREBASE_NODE_KEY = '/tokensInfo'

const MAX_CONCURRENCY = 30

export default class FirebasePriceUpdater {
  manager: ExchangeRateManager

  constructor(manager: ExchangeRateManager) {
    this.manager = manager
  }

  async refreshAllPrices() {
    const prices = await this.manager.calculateUSDPrices()
    await this.updatePrices(prices)
  }

  private async updatePrices(prices: PriceByAddress) {
    const tokensInfoRaw = await fetchFromFirebase(FIREBASE_NODE_KEY)

    const fetchTime = Date.now()

    asyncPool(
      MAX_CONCURRENCY,
      Object.entries(tokensInfoRaw),
      async ([key, token]: [string, any]) => {
        const address = token?.address?.toLowerCase()
        if (address && prices[address]) {
          await updateFirebase(`${FIREBASE_NODE_KEY}/${key}/usdPrice`, prices[address].toString())
          await updateFirebase(`${FIREBASE_NODE_KEY}/${key}/priceFetchedAt`, fetchTime)
        }
      }
    )
  }
}

export async function updatePrices() {
  const updater = new FirebasePriceUpdater(
    new ExchangeRateManager([ubeswapLiquidityPool, moolaExchanges])
  )
  try {
    await updater.refreshAllPrices()
  } catch (err) {
    console.error('There was an error while refreshing token prices:', (err as Error).message)
  }
}

export const updateFirebasePrices = functions.pubsub
  .schedule('*/10 * * * *') // every 10 mins
  .onRun(updatePrices)

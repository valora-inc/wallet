import * as functions from 'firebase-functions'
import asyncPool from 'tiny-async-pool'
import { fetchFromFirebase, updateFirebase } from '../firebase'
import { callCloudFunction } from '../utils'
import ExchangeRateManager from './ExchangeRateManager'
import { PriceByAddress } from './ExchangesGraph'
import { moolaExchanges } from './sources/MoolaExchanges'
import { ubeswapLiquidityPool } from './sources/UbeswapLiquidityPool'

const FIREBASE_NODE_KEY = '/tokensInfo'

const MAX_CONCURRENCY = 30

const RETRIES_LIMIT = 5

export default class FirebasePriceUpdater {
  manager: ExchangeRateManager

  constructor(manager: ExchangeRateManager) {
    this.manager = manager
  }

  async refreshAllPrices(): Promise<PriceByAddress> {
    const prices = await this.manager.calculateUSDPrices()
    await this.updatePrices(prices)
    return prices
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

async function updatePrices() {
  const updater = new FirebasePriceUpdater(
    new ExchangeRateManager([ubeswapLiquidityPool, moolaExchanges])
  )
  const prices = await updater.refreshAllPrices()

  return prices
}

async function updatePricesCatched() {
  try {
    await updatePrices()
  } catch (err) {
    console.error('There was an error while refreshing token prices:', (err as Error).message)
    callCloudFunction('updateFirebasePricesByRequest', 0).catch((e) => console.log(e?.message))
  }
}

export const updateFirebasePricesScheduled = functions.pubsub
  .schedule('*/10 * * * *') // every 10 mins
  .onRun(updatePricesCatched)

export const updateFirebasePricesByRequest = functions.https.onRequest(async (req, res) => {
  const retries = req.body.retry ?? 0
  try {
    const prices = await updatePrices()
    res.status(200).send(prices)
  } catch (e) {
    const msg = (e as Error)?.message
    if (retries < RETRIES_LIMIT) {
      callCloudFunction('updateFirebasePricesByRequest', { retry: retries + 1 }).catch((e) =>
        console.log(e?.message)
      )
    }

    console.error('There was an error while refreshing token prices:', msg)
    res.status(400).send(msg)
  }
})

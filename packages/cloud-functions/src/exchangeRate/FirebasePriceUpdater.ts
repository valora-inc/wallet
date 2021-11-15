import {
  createNewManager,
  ExchangeRateManager,
  getConfigForEnv,
  PriceByAddress,
} from '@valora/exchanges'
import * as functions from 'firebase-functions'
import asyncPool from 'tiny-async-pool'
import { EXCHANGES } from '../config'
import { fetchFromFirebase, updateFirebase } from '../firebase'
import { callCloudFunction } from '../utils'

const FIREBASE_NODE_KEY = '/tokensInfo'

const MAX_CONCURRENCY = 30

const RETRIES_LIMIT = 5

export default class FirebasePriceUpdater {
  manager: ExchangeRateManager

  constructor(manager: ExchangeRateManager) {
    this.manager = manager
  }

  async refreshAllPrices(): Promise<PriceByAddress> {
    const prices = await this.manager.calculatecUSDPrices()
    await this.updatePrices(prices)
    return prices
  }

  private async updatePrices(prices: PriceByAddress) {
    const tokensInfoRaw = await fetchFromFirebase(FIREBASE_NODE_KEY)

    const fetchTime = Date.now()

    await asyncPool(
      MAX_CONCURRENCY,
      Object.entries(tokensInfoRaw),
      async ([key, token]: [string, any]) => {
        const address = token?.address?.toLowerCase()
        if (address && prices[address]) {
          await updateFirebase(`${FIREBASE_NODE_KEY}/${key}`, {
            usdPrice: prices[address].toString(),
            priceFetchedAt: fetchTime,
          })
        }
      }
    )
  }
}

export async function updatePrices() {
  const updater = new FirebasePriceUpdater(createNewManager(getConfigForEnv(EXCHANGES.env)))
  return await updater.refreshAllPrices()
}

async function updatePricesWithRetry() {
  try {
    await updatePrices()
  } catch (err) {
    console.error('There was an error while refreshing token prices:', (err as Error).message)
    callCloudFunction('updateFirebasePricesByRequest', 0).catch((e) => console.error(e?.message))
  }
}

export const updateFirebasePricesScheduled = functions.pubsub
  .schedule('*/1 * * * *') // every minute
  .onRun(updatePricesWithRetry)

export const updateFirebasePricesByRequest = functions.https.onRequest(async (req, res) => {
  const retries = req.body.retry ?? 0
  try {
    res.status(200).send(await updatePrices())
  } catch (e) {
    const msg = (e as Error)?.message
    if (retries < RETRIES_LIMIT) {
      callCloudFunction('updateFirebasePricesByRequest', { retry: retries + 1 }).catch((e) =>
        console.error(e?.message)
      )
    }

    console.error('There was an error while refreshing token prices:', msg)
    res.status(400).send(msg)
  }
})

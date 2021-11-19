import { configs, createNewManager, ExchangeRateManager, PriceByAddress } from '@valora/exchanges'
import axios from 'axios'
import * as functions from 'firebase-functions'
import asyncPool from 'tiny-async-pool'
import { EXCHANGES, UBESWAP } from '../config'
import { getContractKit } from '../contractKit'
import { fetchFromFirebase, updateFirebase } from '../firebase'
import { callCloudFunction } from '../utils'
import erc20Abi from './ERC20.json'

const FIREBASE_NODE_KEY = '/tokensInfo'

const MAX_CONCURRENCY = 30

const RETRIES_LIMIT = 5

export default class FirebasePriceUpdater {
  manager: ExchangeRateManager

  constructor(manager: ExchangeRateManager) {
    this.manager = manager
  }

  async updateAllPrices(): Promise<PriceByAddress> {
    const prices = await this.manager.calculatecUSDPrices()
    await this.updatePrices(prices)
    return prices
  }

  private async updatePrices(prices: PriceByAddress) {
    const fetchTime = Date.now()

    const tokensInfoRaw = await fetchFromFirebase(FIREBASE_NODE_KEY)

    await this.updatePresentTokens(prices, tokensInfoRaw, fetchTime)

    const tokenAddresses = Object.values(tokensInfoRaw).map((tokenInfo: any) =>
      tokenInfo.address?.toLowerCase()
    )
    const notAddedTokens = Object.keys(prices).filter(
      (tokenAddress: string) => !tokenAddresses.includes(tokenAddress)
    )

    await this.updateNotPresentTokens(prices, notAddedTokens, fetchTime)
  }

  private async updatePresentTokens(prices: PriceByAddress, tokensInfoRaw: any, fetchTime: number) {
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

  private async updateNotPresentTokens(
    prices: PriceByAddress,
    tokenAddresses: string[],
    fetchTime: number
  ) {
    const imagesUrls = await this.getImagesUrlInfo()
    const kit = await getContractKit()

    await asyncPool(MAX_CONCURRENCY, tokenAddresses, async (token: string) => {
      try {
        // @ts-ignore
        const tokenContract = new kit.web3.eth.Contract(erc20Abi, token)
        const symbol = await tokenContract.methods.symbol().call()
        const name = await tokenContract.methods.name().call()
        const decimals = await tokenContract.methods.decimals().call()

        await updateFirebase(`${FIREBASE_NODE_KEY}/${token}`, {
          decimals,
          symbol,
          name,
          usdPrice: prices[token].toString(),
          priceFetchedAt: fetchTime,
          address: token,
          imageUrl: imagesUrls[token],
        })
        console.log(`New token added: ${token}`)
      } catch (e) {
        console.warn(`Couldn't add new token: ${token}`, (e as Error)?.message)
      }
    })
  }

  // This will change on #1500
  private async getImagesUrlInfo() {
    const rawTokens = await axios.get(UBESWAP.token_list)
    return rawTokens.data.tokens.reduce(
      (acc: any, token: any) => ({ ...acc, [token.address.toLowerCase()]: token.logoURI }),
      {}
    )
  }
}

async function updatePrices() {
  const config = configs[EXCHANGES.env]
  if (!config) {
    throw Error("Couldn't obtain exchanges library config")
  }
  const updater = new FirebasePriceUpdater(createNewManager(config))
  return await updater.updateAllPrices()
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

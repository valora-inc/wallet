import { configs, createNewManager, ExchangeRateManager, PriceByAddress } from '@valora/exchanges'
import axios from 'axios'
import * as functions from 'firebase-functions'
import asyncPool from 'tiny-async-pool'
import erc20Abi from '../abis/ERC20.json'
import { EXCHANGES, UBESWAP } from '../config'
import { getContractKit } from '../contractKit'
import { fetchFromFirebase, updateFirebase } from '../firebase'
import { callCloudFunction } from '../utils'

const FIREBASE_NODE_KEY = '/tokensInfo'

const MAX_CONCURRENCY = 30

const RETRIES_LIMIT = 5

interface ImageUrls {
  [address: string]: string
}

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

    const imagesUrls = await this.getImagesUrlInfo()

    await this.updatePresentTokens(prices, fetchTime, imagesUrls, tokensInfoRaw)

    const tokenAddresses = Object.values(tokensInfoRaw).map((tokenInfo: any) =>
      tokenInfo.address?.toLowerCase()
    )
    const notAddedTokens = Object.keys(prices).filter(
      (tokenAddress: string) => !tokenAddresses.includes(tokenAddress)
    )

    await this.updateNotPresentTokens(prices, fetchTime, imagesUrls, notAddedTokens)
  }

  private async updatePresentTokens(
    prices: PriceByAddress,
    fetchTime: number,
    imageUrls: ImageUrls,
    tokensInfoRaw: any
  ) {
    await asyncPool(
      MAX_CONCURRENCY,
      Object.entries(tokensInfoRaw),
      async ([key, token]: [string, any]) => {
        const address = token?.address?.toLowerCase()
        try {
          if (address && prices[address]) {
            const updateInfo: any = {
              usdPrice: prices[address].toString(),
              priceFetchedAt: fetchTime,
            }

            if (imageUrls[address]) {
              updateInfo.imageUrl = imageUrls[address]
            }

            await updateFirebase(`${FIREBASE_NODE_KEY}/${key}`, updateInfo)
          }
        } catch (e) {
          console.warn(`Couldn't update token: ${address}`, (e as Error)?.message)
        }
      }
    )
  }

  private async updateNotPresentTokens(
    prices: PriceByAddress,
    fetchTime: number,
    imagesUrls: ImageUrls,
    tokenAddresses: string[]
  ) {
    const kit = await getContractKit()

    await asyncPool(MAX_CONCURRENCY, tokenAddresses, async (tokenAddress: string) => {
      try {
        // @ts-ignore
        const tokenContract = new kit.web3.eth.Contract(erc20Abi, tokenAddress)
        const symbol = await tokenContract.methods.symbol().call()
        const name = await tokenContract.methods.name().call()
        const decimals = await tokenContract.methods.decimals().call()

        await updateFirebase(`${FIREBASE_NODE_KEY}/${tokenAddress}`, {
          decimals,
          symbol,
          name,
          usdPrice: prices[tokenAddress].toString(),
          priceFetchedAt: fetchTime,
          address: tokenAddress,
          // Question: Do we want to upload the token info even if we don't have an image?
          imageUrl: imagesUrls[tokenAddress],
        })
        console.info(`New token added: ${tokenAddress}`)
      } catch (e) {
        console.warn(`Couldn't add new token: ${tokenAddress}`, (e as Error)?.message)
      }
    })
  }

  // This will change on #1500
  private async getImagesUrlInfo(): Promise<ImageUrls> {
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

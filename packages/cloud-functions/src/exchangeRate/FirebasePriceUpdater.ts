import { ContractKit } from '@celo/contractkit'
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

  async updateTokensInfo() {
    const fetchTime = Date.now()
    const prices = await this.manager.calculatecUSDPrices()

    const tokensInfoRaw = await fetchFromFirebase(FIREBASE_NODE_KEY)

    const imagesUrls = await this.getImagesUrlInfo()

    // This is needed in case the key is not exactly as the token address in lower case
    const presentTokenKeysByAddress = Object.entries(tokensInfoRaw).reduce(
      (acc: any, [key, token]: [string, any]) => ({
        ...acc,
        [token.address?.toLowerCase()]: key,
      }),
      {}
    )

    const kit = await getContractKit()

    await asyncPool(MAX_CONCURRENCY, Object.keys(prices), async (tokenAddress) => {
      try {
        await this.updateToken(
          tokenAddress,
          prices,
          fetchTime,
          imagesUrls,
          presentTokenKeysByAddress,
          kit
        )
      } catch (e) {
        console.warn(`Couldn't update token: ${tokenAddress}`, (e as Error)?.message)
      }
    })
  }

  private async updateToken(
    tokenAddress: string,
    prices: PriceByAddress,
    fetchTime: number,
    imageUrls: ImageUrls,
    presentTokenKeysByAddress: { [address: string]: string },
    kit: ContractKit
  ) {
    const updateInfo: any = {
      usdPrice: prices[tokenAddress].toString(),
      priceFetchedAt: fetchTime,
      address: tokenAddress,
    }

    let key = presentTokenKeysByAddress[tokenAddress]
    if (!key) {
      key = tokenAddress

      // @ts-ignore
      const tokenContract = new kit.web3.eth.Contract(erc20Abi, tokenAddress)
      updateInfo.symbol = await tokenContract.methods.symbol().call()
      updateInfo.name = await tokenContract.methods.name().call()
      updateInfo.decimals = await tokenContract.methods.decimals().call()
    }

    if (imageUrls[tokenAddress]) {
      updateInfo.imageUrl = imageUrls[tokenAddress]
    }

    await updateFirebase(`${FIREBASE_NODE_KEY}/${key}`, updateInfo)
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

async function updateTokensInfoEntryPoint() {
  const config = configs[EXCHANGES.env]
  if (!config) {
    throw Error("Couldn't obtain exchanges library config")
  }
  const updater = new FirebasePriceUpdater(createNewManager(config))
  return await updater.updateTokensInfo()
}

async function updatePricesWithRetry() {
  try {
    await updateTokensInfoEntryPoint()
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
    await updateTokensInfoEntryPoint()
    res.status(200).send()
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

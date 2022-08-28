import BigNumber from 'bignumber.js'
import { TransactionConfig } from 'web3-core'

/**
 * NOTE: It looks like the 0x integration is wrapped by Valora's cloud functions, so this code should serve more as
 * a tutorial on integrating with Minima rather than the actual integration.  I imagine if Minima is integrated then
 * a similar process will be desired as is currently being used for 0x
 *
 * See a production use of minima at https://mobius.money
 *
 * Since this is moreso psuedo code for showing how to integrate, do note these changes have not been tested.
 * I am on an M1 and its much quicker to just do a quick showcase like this, especially since 0x integration
 * goes through Valora's cloud functions.
 *
 */

/** Constants and Types For Minima Integration **/

const MINIMA_ROUTE_URL = 'https://router.nodefinance.org/routes'

type BigNumberString = string
type Address = string

type NodeRoute = {
  path: string[]
  pairs: string[]
  extras: (string | number[])[]
  inputAmount: string | number
  expectedOutputAmount: string | number
  deadline: string | number
  partner: string | number
  sig: string | number[]
}

export type MinimaResponse = {
  expectedOut: BigNumberString
  routerAddress: Address
  details: NodeRoute
  minimumExpectedOut: BigNumberString
  priceImpact: {
    numerator: number
    denominator: number
  }
  txn: TransactionConfig
}

/** End constants and types for Minima Integration */

// Singleton to cache routes between components
// Smiple fifo cache, should probably be LRU for something like price quotes
export class SwapCache {
  private static _instance: SwapCache

  private cache: {
    [url: string]: {
      expiry: number
      payload?: MinimaResponse & { price: string }
    }
  } = {}

  private cacheQueue: Array<string> // Circular array instead of a queue
  private loc: number = 0
  private ttl: number = 60 * 1000

  constructor(cacheLimit: number) {
    this.cacheQueue = new Array(cacheLimit)
  }

  static get get(): SwapCache {
    if (SwapCache._instance) return SwapCache._instance
    SwapCache._instance = new SwapCache(10)
    return SwapCache._instance
  }

  public updateCache(url: string, payload: MinimaResponse & { price: string }) {
    if (this.cacheQueue[this.loc]) delete this.cache[this.cacheQueue[this.loc]]
    this.cache[url] = { expiry: Date.now() + this.ttl, payload }

    this.loc = (this.loc + 1) % this.cacheQueue.length
  }

  public async fetch(
    {
      tokenIn,
      tokenOut,
      amountInWei,
      from,
      maxHops = 4,
      slippageBips = 50,
      includePriceImpact = true,
    }: {
      tokenIn: string
      tokenOut: string
      amountInWei: BigNumberString
      from?: Address
      maxHops?: number
      slippageBips?: number
      includePriceImpact?: boolean
    },
    ignoreCache?: boolean
  ) {
    const params = {
      tokenIn: tokenIn,
      tokenOut: tokenOut,
      amountIn: amountInWei,
      from: from ?? '',
      maxHops: maxHops.toString(),
      slippage: slippageBips.toString(),
      priceImpact: includePriceImpact ? '1' : '0',
    }
    const queryParams = new URLSearchParams({ ...params }).toString()
    const requestUrl = `${MINIMA_ROUTE_URL}?${queryParams}`
    if (!ignoreCache && this.cache[requestUrl] && this.cache[requestUrl].expiry > Date.now())
      return { ok: true, json: this.cache[requestUrl].payload }

    const quoteResponse = await fetch(requestUrl, {
      headers: {
        'x-api-key': process.env.MINMA_API_KEY ?? '',
      },
    })

    if (!quoteResponse.ok) {
      const message = await quoteResponse.text()
      return {
        ok: false,
        message,
        status: quoteResponse.status,
        statusText: quoteResponse.statusText,
      }
    }
    const json = (await quoteResponse.json()) as MinimaResponse
    const price = new BigNumber(amountInWei).div(new BigNumber(json.expectedOut)).toString()

    this.updateCache(requestUrl, { ...json, price })

    return {
      ok: true,
      json: { ...json, price },
    }
  }
}

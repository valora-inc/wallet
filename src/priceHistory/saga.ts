import {
  Price,
  fetchPriceHistoryFailure,
  fetchPriceHistoryStart,
  fetchPriceHistorySuccess,
} from 'src/priceHistory/slice'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import { safely } from 'src/utils/safely'
import networkConfig from 'src/web3/networkConfig'
import { call, put, spawn, takeLatest } from 'typed-redux-saga'

const TAG = 'priceHistory/saga'

/**
 * Fetches the price history for a token from blockchain-api
 * @param {string} tokenId - The tokenId to fetch the price history for
 * @param {number} startTimestamp - The timestamp to start fetching prices from defaults to 30 days ago
 * @param {number} endTimestamp - The timestamp to stop fetching prices at defaults to now
 */
export async function fetchTokenPriceHistory(
  tokenId: string,
  startTimestamp: number,
  endTimestamp: number
): Promise<Price[]> {
  const queryParams = new URLSearchParams({
    startTimestamp: `${startTimestamp}`,
    endTimestamp: `${endTimestamp}`,
  }).toString()

  const url = `${networkConfig.blockchainApiUrl}/tokensInfo/${tokenId}/priceHistory?${queryParams}`
  const response = await fetchWithTimeout(url)
  if (!response.ok) {
    throw new Error(
      `Failed to fetch price history for ${tokenId}: ${response.status} ${response.statusText}`
    )
  }
  return await response.json()
}

export function* fetchTokenPriceHistorySaga({
  payload: { tokenId, startTimestamp, endTimestamp },
}: ReturnType<typeof fetchPriceHistoryStart>) {
  try {
    const prices = yield* call(fetchTokenPriceHistory, tokenId, startTimestamp, endTimestamp)
    yield* put(fetchPriceHistorySuccess({ tokenId, prices }))
  } catch (err) {
    const error = ensureError(err)
    Logger.error(TAG, 'error fetching token price history', error.message)
    yield* put(fetchPriceHistoryFailure({ tokenId }))
  }
}

function* watchFetchTokenPriceHistory() {
  yield* takeLatest(fetchPriceHistoryStart.type, safely(fetchTokenPriceHistorySaga))
}

export function* priceHistorySaga() {
  yield* spawn(watchFetchTokenPriceHistory)
}

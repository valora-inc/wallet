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

/** @beta - Exclude from Knip dep check */
export async function fetchTokenPriceHistory(
  tokenId: string,
  startTimestamp?: number,
  endTimestamp?: number
): Promise<Price[]> {
  const queryParams = new URLSearchParams()
  if (startTimestamp) {
    queryParams.append('startTimestamp', `${startTimestamp}`)
  }
  if (endTimestamp) {
    queryParams.append('endTimestamp', `${endTimestamp}`)
  }

  const url = `${
    networkConfig.blockchainApiUrl
  }/tokensInfo/${tokenId}/priceHistory?${queryParams.toString()}`
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
    if (!tokenId) {
      throw new Error('TokenId is required')
    }
    const prices = yield* call(fetchTokenPriceHistory, tokenId, startTimestamp, endTimestamp)
    yield* put(fetchPriceHistorySuccess({ tokenId, prices }))
  } catch (err) {
    const error = ensureError(err)
    Logger.error(TAG, 'error fetching token price history', error.message)
    yield* put(fetchPriceHistoryFailure({ tokenId }))
  }
}

/** @beta - Exclude from Knip dep check */
export function* watchFetchTokenPriceHistory() {
  yield* takeLatest(fetchPriceHistoryStart.type, safely(fetchTokenPriceHistorySaga))
}

export function* priceHistorySaga() {
  yield* spawn(watchFetchTokenPriceHistory)
}

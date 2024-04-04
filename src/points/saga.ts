import { call, put, select, spawn, takeLeading } from 'typed-redux-saga'
import {
  getInitialHistoryStarted,
  getMoreHistoryStarted,
  getHistorySucceeded,
  getHistoryError,
} from 'src/points/slice'
import { safely } from 'src/utils/safely'
import { retrieveSignedMessage } from 'src/pincode/authentication'
import networkConfig from 'src/web3/networkConfig'
import { GetHistoryResponse } from 'src/points/types'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import { walletAddressSelector } from 'src/web3/selectors'
import { getPointsHistoryNextPageUrlSelector } from 'src/points/selectors'
import Logger from 'src/utils/Logger'

const TAG = 'Points/saga'

export async function fetchHistory(address: string, url?: string): Promise<GetHistoryResponse> {
  const signedMessage = await retrieveSignedMessage()
  const response = await fetchWithTimeout(url ?? networkConfig.getPointsHistoryUrl, {
    method: 'GET',
    headers: {
      authorization: `Valora ${address}:${signedMessage}`,
    },
  })
  if (response.ok) {
    return response.json() as Promise<GetHistoryResponse>
  } else {
    throw new Error(await response.text())
  }
}

export function* getHistory(url?: string) {
  const walletAddress = yield* select(walletAddressSelector)
  if (!walletAddress) {
    Logger.error(TAG, 'No wallet address found when fetching points history')
    yield* put(getHistoryError())
    return
  }

  try {
    const history = yield* call(fetchHistory, walletAddress, url)
    yield* put(
      getHistorySucceeded({
        newPointsHistory: history.data,
        nextPageUrl: history.hasNextPage ? history.nextPageUrl : null,
      })
    )
  } catch (e) {
    Logger.error(TAG, 'Error fetching points history', e)
    yield* put(getHistoryError())
  }
}

function* getInitialHistory() {
  yield* call(getHistory)
}

export function* getMoreHistory() {
  const nextPageUrl = yield* select(getPointsHistoryNextPageUrlSelector)
  if (!nextPageUrl) {
    Logger.info(TAG, 'Requested to fetch more points history but no nextPageUrl found')
    yield* put(
      getHistorySucceeded({
        newPointsHistory: [],
        nextPageUrl: null,
      })
    )
    return
  }
  yield* call(getHistory, nextPageUrl)
}

function* watchGetHistory() {
  yield* takeLeading(getInitialHistoryStarted.type, safely(getInitialHistory))
  yield* takeLeading(getMoreHistoryStarted.type, safely(getMoreHistory))
}

export function* pointsSaga() {
  yield* spawn(watchGetHistory)
}

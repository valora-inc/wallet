import { call, put, select, spawn, takeLeading } from 'typed-redux-saga'
import { getHistoryStarted, getHistorySucceeded, getHistoryError } from 'src/points/slice'
import { safely } from 'src/utils/safely'
import networkConfig from 'src/web3/networkConfig'
import { GetHistoryResponse } from 'src/points/types'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import { walletAddressSelector } from 'src/web3/selectors'
import { nextPageUrlSelector } from 'src/points/selectors'
import Logger from 'src/utils/Logger'

const TAG = 'Points/saga'

export async function fetchHistory(
  address: string,
  url?: string | null
): Promise<GetHistoryResponse> {
  const response = await fetchWithTimeout(
    url ?? `${networkConfig.getPointsHistoryUrl}?` + new URLSearchParams({ address }),
    {
      method: 'GET',
    }
  )
  if (response.ok) {
    return response.json() as Promise<GetHistoryResponse>
  } else {
    throw new Error(await response.text())
  }
}

export function* getHistory({ payload: params }: ReturnType<typeof getHistoryStarted>) {
  const walletAddress = yield* select(walletAddressSelector)
  if (!walletAddress) {
    Logger.error(TAG, 'No wallet address found when fetching points history')
    yield* put(getHistoryError())
    return
  }

  const url = params.getNextPage ? yield* select(nextPageUrlSelector) : undefined

  // Silently succeed if a refresh is requested but no page information
  // is available; not considered an "error" state.
  if (!url && params.getNextPage) {
    Logger.info(TAG, 'Requested to fetch more points history but no next page available')
    yield* put(
      getHistorySucceeded({
        appendHistory: params.getNextPage,
        newPointsHistory: [],
        nextPageUrl: null,
      })
    )
    return
  }

  try {
    const history = yield* call(fetchHistory, walletAddress, url)
    yield* put(
      getHistorySucceeded({
        appendHistory: params.getNextPage,
        newPointsHistory: history.data,
        nextPageUrl: history.hasNextPage ? history.nextPageUrl : null,
      })
    )
  } catch (e) {
    Logger.error(TAG, 'Error fetching points history', e)
    yield* put(getHistoryError())
  }
}

function* watchGetHistory() {
  yield* takeLeading(getHistoryStarted.type, safely(getHistory))
}

export function* pointsSaga() {
  yield* spawn(watchGetHistory)
}

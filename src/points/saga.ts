import { Actions as HomeActions } from 'src/home/actions'
import { nextPageUrlSelector } from 'src/points/selectors'
import {
  PointsConfig,
  getHistoryError,
  getHistoryStarted,
  getHistorySucceeded,
  getPointsConfigError,
  getPointsConfigRetry,
  getPointsConfigStarted,
  getPointsConfigSucceeded,
} from 'src/points/slice'
import { GetHistoryResponse, isPointsActivity } from 'src/points/types'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import Logger from 'src/utils/Logger'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import { safely } from 'src/utils/safely'
import networkConfig from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'
import { call, put, select, spawn, takeLeading } from 'typed-redux-saga'

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

export function* getPointsConfig() {
  const showPoints = getFeatureGate(StatsigFeatureGates.SHOW_POINTS)
  if (!showPoints) {
    Logger.info(TAG, 'Points feature is disabled, not fetching points config')
    return
  }

  yield* put(getPointsConfigStarted())

  try {
    const response = yield* call(fetchWithTimeout, networkConfig.getPointsConfigUrl, {
      method: 'GET',
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch points config: ${response.status} ${response.statusText}`)
    }
    const { config }: { config: PointsConfig } = yield* call([response, 'json'])

    // remove any activities that are not supported by app and have no points value
    const supportedActivities: PointsConfig = {
      activitiesById: {},
    }
    Object.entries(config.activitiesById).forEach(([activityId, activityMetadata]) => {
      if (isPointsActivity(activityId) && activityMetadata.pointsAmount > 0) {
        supportedActivities.activitiesById[activityId] = activityMetadata
      }
    })
    yield* put(getPointsConfigSucceeded(supportedActivities))
  } catch (e) {
    Logger.error(TAG, 'Error fetching points config', e)
    yield* put(getPointsConfigError())
  }
}

function* watchGetHistory() {
  yield* takeLeading(getHistoryStarted.type, safely(getHistory))
}

function* watchGetConfig() {
  yield* takeLeading([getPointsConfigRetry.type, HomeActions.VISIT_HOME], safely(getPointsConfig))
}

export function* pointsSaga() {
  yield* spawn(watchGetHistory)
  yield* spawn(watchGetConfig)
}

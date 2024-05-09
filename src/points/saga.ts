import { differenceInDays } from 'date-fns'
import { Actions as AppActions } from 'src/app/actions'
import { Actions as HomeActions } from 'src/home/actions'
import { nextPageUrlSelector, pendingPointsEvents } from 'src/points/selectors'
import {
  PointsConfig,
  getHistoryError,
  getHistoryStarted,
  getHistorySucceeded,
  getPointsBalanceError,
  getPointsBalanceStarted,
  getPointsBalanceSucceeded,
  getPointsConfigError,
  getPointsConfigRetry,
  getPointsConfigStarted,
  getPointsConfigSucceeded,
  pointsEventProcessed,
  sendPointsEventStarted,
  trackPointsEvent,
} from 'src/points/slice'
import {
  GetHistoryResponse,
  GetPointsBalanceResponse,
  PointsEvent,
  isClaimActivityId,
  isPointsActivityId,
} from 'src/points/types'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import Logger from 'src/utils/Logger'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import { safely } from 'src/utils/safely'
import networkConfig from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'
import { call, put, select, spawn, take, takeEvery, takeLeading } from 'typed-redux-saga'
import { v4 as uuidv4 } from 'uuid'

const TAG = 'Points/saga'

const POINTS_EVENT_EXPIRY_DAYS = 30

export function* getPointsBalance({ type, payload }: ReturnType<typeof getHistoryStarted>) {
  if (type === getHistoryStarted.type && payload.getNextPage) {
    // prevent fetching points balance when fetching more history
    return
  }

  const address = yield* select(walletAddressSelector)
  if (!address) {
    Logger.error(TAG, 'No wallet address found when fetching points balance')
    return
  }

  try {
    yield* put(getPointsBalanceStarted())
    const response = yield* call(
      fetchWithTimeout,
      `${networkConfig.getPointsBalanceUrl}?address=${address}`,
      {
        method: 'GET',
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch points balance: ${response.status} ${response.statusText}`)
    }
    const { balance }: GetPointsBalanceResponse = yield* call([response, 'json'])
    yield* put(getPointsBalanceSucceeded(balance))
  } catch (error) {
    Logger.warn(TAG, 'Error fetching points balance', error)
    yield* put(getPointsBalanceError())
  }
}

export async function fetchHistory(
  address: string,
  nextPageUrl?: string | null
): Promise<GetHistoryResponse> {
  const firstPageQueryParams = new URLSearchParams({
    address,
    pageSize: '10', // enough to fill up the history bottom sheet
  }).toString()
  const firstPageUrl = `${networkConfig.getPointsHistoryUrl}?${firstPageQueryParams}`

  const response = await fetchWithTimeout(nextPageUrl ?? firstPageUrl, {
    method: 'GET',
  })
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
    yield* put(
      getHistoryError({
        getNextPage: params.getNextPage,
      })
    )
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
        newPointsHistory: history.data.filter((record) => isClaimActivityId(record.activityId)),
        nextPageUrl: history.hasNextPage ? history.nextPageUrl : null,
      })
    )
  } catch (e) {
    Logger.error(TAG, 'Error fetching points history', e)
    yield* put(
      getHistoryError({
        getNextPage: params.getNextPage,
      })
    )
  }
}

export function* getPointsConfig() {
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
      if (isPointsActivityId(activityId) && activityMetadata && activityMetadata.pointsAmount > 0) {
        supportedActivities.activitiesById[activityId] = activityMetadata
      }
    })
    yield* put(getPointsConfigSucceeded(supportedActivities))
  } catch (e) {
    Logger.error(TAG, 'Error fetching points config', e)
    yield* put(getPointsConfigError())
  }
}

export async function fetchTrackPointsEventsEndpoint(event: PointsEvent) {
  return fetchWithTimeout(networkConfig.trackPointsEventUrl, {
    method: 'POST',
    body: JSON.stringify(event),
  })
}

export function* sendPointsEvent({ payload: event }: ReturnType<typeof trackPointsEvent>) {
  const id = uuidv4()

  yield* put(
    sendPointsEventStarted({
      id,
      timestamp: new Date(Date.now()).toISOString(),
      event,
    })
  )

  const response = yield* call(fetchTrackPointsEventsEndpoint, event)

  if (response.ok) {
    yield* put(pointsEventProcessed({ id }))
  } else {
    const responseText = yield* call([response, response.text])
    Logger.warn(
      `${TAG}@sendPointsEvent`,
      event.activityId,
      response.status,
      response.statusText,
      responseText
    )
  }
}

export function* sendPendingPointsEvents() {
  const LOG_TAG = `${TAG}@sendPendingPointsEvents`

  const now = new Date()
  const pendingEvents = yield* select(pendingPointsEvents)

  for (const pendingEvent of pendingEvents) {
    const { id, timestamp, event } = pendingEvent

    if (differenceInDays(now, new Date(timestamp)) > POINTS_EVENT_EXPIRY_DAYS) {
      yield* put(pointsEventProcessed({ id }))
      Logger.debug(`${LOG_TAG}/expiredEvent`, pendingEvent)
      continue
    }

    try {
      const response = yield* call(fetchTrackPointsEventsEndpoint, event)

      if (response.ok) {
        yield* put(pointsEventProcessed({ id }))
      } else {
        const responseText = yield* call([response, response.text])
        Logger.warn(LOG_TAG, event.activityId, response.status, response.statusText, responseText)
      }
    } catch (err) {
      Logger.warn(LOG_TAG, err)
    }
  }
}

function* watchGetHistory() {
  yield* takeLeading(getHistoryStarted.type, safely(getHistory))
  yield* takeLeading(getHistoryStarted.type, safely(getPointsBalance))
}

function* watchGetConfig() {
  yield* takeLeading([getPointsConfigRetry.type, HomeActions.VISIT_HOME], safely(getPointsConfig))
}

function* watchTrackPointsEvent() {
  yield* takeEvery(trackPointsEvent.type, safely(sendPointsEvent))
}

export function* watchAppMounted() {
  yield* take(AppActions.APP_MOUNTED)
  yield* call(safely, sendPendingPointsEvents)
}

export function* pointsSaga() {
  const showPoints = getFeatureGate(StatsigFeatureGates.SHOW_POINTS)
  if (!showPoints) {
    Logger.info(TAG, 'Points feature is disabled, not spawning points sagas')
    return
  }

  yield* spawn(watchGetHistory)
  yield* spawn(watchGetConfig)
  yield* spawn(watchTrackPointsEvent)
  yield* spawn(watchAppMounted)
}

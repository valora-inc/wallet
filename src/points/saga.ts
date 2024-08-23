import { differenceInDays } from 'date-fns'
import { isEqual } from 'lodash'
import { depositSuccess } from 'src/earn/slice'
import { Actions as HomeActions } from 'src/home/actions'
import { depositTransactionSucceeded } from 'src/jumpstart/slice'
import { retrieveSignedMessage } from 'src/pincode/authentication'
import {
  nextPageUrlSelector,
  pendingPointsEventsSelector,
  trackOnceActivitiesSelector,
} from 'src/points/selectors'
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
  pointsDataRefreshStarted,
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
import { swapSuccess } from 'src/swap/slice'
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
  const showPoints = getFeatureGate(StatsigFeatureGates.SHOW_POINTS)
  if (!showPoints) {
    Logger.info(`${TAG}@getPointsBalance`, 'Points feature is disabled, skipping saga execution')
    return
  }

  if (type === getHistoryStarted.type && payload.getNextPage) {
    // prevent fetching points balance when fetching more history
    return
  }

  const address = yield* select(walletAddressSelector)
  if (!address) {
    Logger.error(`${TAG}@getPointsBalance`, 'No wallet address found when fetching points balance')
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
    Logger.warn(`${TAG}@getPointsBalance`, 'Error fetching points balance', error)
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
  const showPoints = getFeatureGate(StatsigFeatureGates.SHOW_POINTS)
  if (!showPoints) {
    Logger.info(`${TAG}@getHistory`, 'Points feature is disabled, skipping saga execution')
    return
  }

  const walletAddress = yield* select(walletAddressSelector)
  if (!walletAddress) {
    Logger.error(`${TAG}@getHistory`, 'No wallet address found when fetching points history')
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
    Logger.info(
      `${TAG}@getHistory`,
      'Requested to fetch more points history but no next page available'
    )
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
    Logger.error(`${TAG}@getHistory`, 'Error fetching points history', e)
    yield* put(
      getHistoryError({
        getNextPage: params.getNextPage,
      })
    )
  }
}

export function* getPointsConfig() {
  const showPoints = getFeatureGate(StatsigFeatureGates.SHOW_POINTS)
  if (!showPoints) {
    Logger.info(`${TAG}@getPointsConfig`, 'Points feature is disabled, skipping saga execution')
    return
  }

  yield* put(getPointsConfigStarted())
  yield* fetchPointsConfig()
}

function* fetchPointsConfig() {
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
    Logger.error(`${TAG}@getPointsConfig`, 'Error fetching points config', e)
    yield* put(getPointsConfigError())
  }
}

export function* fetchTrackPointsEventsEndpoint(event: PointsEvent) {
  const address = yield* select(walletAddressSelector)
  const signedMessage = yield* call(retrieveSignedMessage)
  if (!signedMessage) {
    throw new Error(`No signed message found when tracking points event ${event.activityId}`)
  }

  return yield* call(fetchWithTimeout, networkConfig.trackPointsEventUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `${networkConfig.authHeaderIssuer} ${address}:${signedMessage}`,
    },
    body: JSON.stringify(event),
  })
}

export function* sendPointsEvent({ payload: event }: ReturnType<typeof trackPointsEvent>) {
  const showPoints = getFeatureGate(StatsigFeatureGates.SHOW_POINTS)
  if (!showPoints) {
    Logger.info(`${TAG}@sendPointsEvent`, 'Points feature is disabled, skipping saga execution')
    return
  }

  const trackOnceActivities = yield* select(trackOnceActivitiesSelector)
  if (trackOnceActivities[event.activityId]) {
    Logger.debug(`${TAG}@sendPointsEvent`, `Skipping already tracked activity: ${event.activityId}`)
    return
  }

  const pendingPointsEvents = yield* select(pendingPointsEventsSelector)
  if (pendingPointsEvents.some((pendingEvent) => isEqual(pendingEvent.event, event))) {
    // this can happen for events that are tracked after a transaction is
    // confirmed within the same app session, if it is also picked up by the
    // internal transactions watcher. The trackPointsEvent action could be
    // dispatched by the specific feature saga as well as the internal
    // transactions watcher.
    Logger.debug(
      `${TAG}@sendPointsEvent`,
      `Skipping already pending tracked event: ${JSON.stringify(event)}`
    )
    return
  }

  const id = uuidv4()

  yield* put(
    sendPointsEventStarted({
      id,
      timestamp: new Date(Date.now()).toISOString(),
      event,
    })
  )
  try {
    const response = yield* call(fetchTrackPointsEventsEndpoint, event)
    if (!response.ok) {
      const responseText = yield* call([response, response.text])
      throw new Error(
        `Failed to track points event ${event.activityId}: ${response.status} ${responseText}`
      )
    }

    yield* put(pointsEventProcessed({ id }))
  } catch (error) {
    Logger.warn(`${TAG}@sendPointsEvent`, event.activityId, error)
  }
}

export function* sendPendingPointsEvents() {
  const LOG_TAG = `${TAG}@sendPendingPointsEvents`
  const showPoints = getFeatureGate(StatsigFeatureGates.SHOW_POINTS)
  if (!showPoints) {
    Logger.info(LOG_TAG, 'Points feature is disabled, skipping saga execution')
    return
  }

  const now = new Date()
  const pendingEvents = yield* select(pendingPointsEventsSelector)

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

export function* watchSwapSuccessTransformPayload({
  payload: params,
}: ReturnType<typeof swapSuccess>) {
  yield* call(
    sendPointsEvent,
    trackPointsEvent({
      ...params,
      activityId: 'swap',
    })
  )
}
export function* watchSwapSuccess() {
  yield* takeLeading(swapSuccess.type, safely(watchSwapSuccessTransformPayload))
}

export function* watchLiveLinkCreatedTransformPayload({
  payload: params,
}: ReturnType<typeof depositTransactionSucceeded>) {
  yield* call(
    sendPointsEvent,
    trackPointsEvent({
      ...params,
      activityId: 'create-live-link',
    })
  )
}
export function* watchLiveLinkCreated() {
  yield* takeLeading(depositTransactionSucceeded.type, safely(watchLiveLinkCreatedTransformPayload))
}

export function* watchDepositSuccessTransformPayload({
  payload: params,
}: ReturnType<typeof depositSuccess>) {
  yield* call(
    sendPointsEvent,
    trackPointsEvent({
      ...params,
      activityId: 'deposit-earn',
    })
  )
}
export function* watchDepositSuccess() {
  yield* takeLeading(depositSuccess.type, safely(watchDepositSuccessTransformPayload))
}

export function* watchGetHistory() {
  yield* takeLeading(getHistoryStarted.type, safely(getHistory))
  yield* takeLeading(getHistoryStarted.type, safely(getPointsBalance))
}

export function* watchGetConfig() {
  yield* takeLeading(getPointsConfigRetry.type, safely(getPointsConfig))
}

export function* watchTrackPointsEvent() {
  yield* takeEvery(trackPointsEvent.type, safely(sendPointsEvent))
}

export function* watchHomeScreenVisit() {
  yield* take(HomeActions.VISIT_HOME)
  yield* spawn(
    sendPointsEvent,
    trackPointsEvent({
      activityId: 'create-wallet',
    })
  )
  yield* spawn(getPointsConfig)
  yield* spawn(getPointsBalance, getHistoryStarted({ getNextPage: false }))
  yield* spawn(sendPendingPointsEvents)
}

function* updatePointsData() {
  yield* spawn(fetchPointsConfig)
  yield* spawn(getPointsBalance, getHistoryStarted({ getNextPage: false }))
  yield* spawn(getHistory, getHistoryStarted({ getNextPage: false }))
}

export function* watchPointsDataRefreshStarted() {
  yield* takeLeading(pointsDataRefreshStarted.type, safely(updatePointsData))
}

export function* pointsSaga() {
  yield* spawn(watchGetHistory)
  yield* spawn(watchGetConfig)
  yield* spawn(watchTrackPointsEvent)
  yield* spawn(watchHomeScreenVisit)
  yield* spawn(watchLiveLinkCreated)
  yield* spawn(watchSwapSuccess)
  yield* spawn(watchDepositSuccess)
  yield* spawn(watchPointsDataRefreshStarted)
}

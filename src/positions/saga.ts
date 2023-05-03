import { call, put, select, spawn, takeLeading } from 'redux-saga/effects'
import { fetchPositions, fetchPositionsFailure, fetchPositionsSuccess } from 'src/positions/slice'
import { Position } from 'src/positions/types'
import { SentryTransactionHub } from 'src/sentry/SentryTransactionHub'
import { SentryTransaction } from 'src/sentry/SentryTransactions'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { fetchTokenBalances } from 'src/tokens/slice'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import Logger from 'src/utils/Logger'
import { safely } from 'src/utils/safely'
import { walletAddressSelector } from 'src/web3/selectors'

const TAG = 'positions/saga'

const POSITIONS_FETCH_TIMEOUT = 45_000 // 45 seconds

async function doFetchPositions(walletAddress: string) {
  const response = await fetchWithTimeout(
    // TODO: Use the final API URL once it's ready
    'https://plugins-api-oaxbpxoaha-uc.a.run.app/balances?' +
      new URLSearchParams({ network: 'celo', address: walletAddress }),
    null,
    POSITIONS_FETCH_TIMEOUT
  )
  if (!response.ok) {
    throw new Error(`Unable to fetch positions: ${response.status} ${response.statusText}`)
  }
  const json = await response.json()
  return json.data as Position[]
}

export function* fetchPositionsSaga() {
  try {
    const address: string | null = yield select(walletAddressSelector)
    if (!address) {
      Logger.debug(TAG, 'Skipping fetching positions since no address was found')
      return
    }
    if (!getFeatureGate({ featureGateName: StatsigFeatureGates.SHOW_POSITIONS })) {
      return
    }

    SentryTransactionHub.startTransaction(SentryTransaction.fetch_positions)
    const positions = yield call(doFetchPositions, address)
    yield put(fetchPositionsSuccess(positions))
    SentryTransactionHub.finishTransaction(SentryTransaction.fetch_positions)
  } catch (error) {
    yield put(fetchPositionsFailure())
    Logger.error(TAG, 'Unable to fetch positions', error)
  }
}

export function* watchFetchBalanceOrPositions() {
  // Refresh positions when fetching token balances, or when explicitly requested
  yield takeLeading([fetchTokenBalances.type, fetchPositions.type], safely(fetchPositionsSaga))
}

export function* positionsSaga() {
  yield spawn(watchFetchBalanceOrPositions)
}

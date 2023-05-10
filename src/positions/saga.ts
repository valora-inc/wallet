import { call, put, select, spawn, takeLeading } from 'redux-saga/effects'
import { DEFAULT_TESTNET } from 'src/config'
import {
  fetchPositionsFailure,
  fetchPositionsStart,
  fetchPositionsSuccess,
} from 'src/positions/slice'
import { Position } from 'src/positions/types'
import { SentryTransactionHub } from 'src/sentry/SentryTransactionHub'
import { SentryTransaction } from 'src/sentry/SentryTransactions'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { fetchTokenBalances } from 'src/tokens/slice'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import Logger from 'src/utils/Logger'
import { safely } from 'src/utils/safely'
import networkConfig from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'

const TAG = 'positions/saga'

const POSITIONS_FETCH_TIMEOUT = 45_000 // 45 seconds

async function fetchPositions(walletAddress: string) {
  const response = await fetchWithTimeout(
    `${networkConfig.getPositionsUrl}?` +
      new URLSearchParams({
        network: DEFAULT_TESTNET === 'mainnet' ? 'celo' : 'celoAlfajores',
        address: walletAddress,
      }),
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
    if (!getFeatureGate(StatsigFeatureGates.SHOW_POSITIONS)) {
      return
    }

    yield put(fetchPositionsStart())
    SentryTransactionHub.startTransaction(SentryTransaction.fetch_positions)
    const positions = yield call(fetchPositions, address)
    SentryTransactionHub.finishTransaction(SentryTransaction.fetch_positions)
    yield put(fetchPositionsSuccess(positions))
  } catch (error) {
    yield put(fetchPositionsFailure(error))
    Logger.error(TAG, 'Unable to fetch positions', error)
  }
}

export function* watchFetchBalances() {
  // Refresh positions when fetching token balances
  yield takeLeading(fetchTokenBalances.type, safely(fetchPositionsSaga))
}

export function* positionsSaga() {
  yield spawn(watchFetchBalances)
}

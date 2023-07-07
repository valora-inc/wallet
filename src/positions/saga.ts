import path from 'path'
import { Alert } from 'react-native'
import { call, put, select, spawn, takeLeading } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { DEFAULT_TESTNET } from 'src/config'
import {
  hooksApiUrlSelector,
  hooksPreviewApiUrlSelector,
  shortcutsStatusSelector,
} from 'src/positions/selectors'
import {
  fetchPositionsFailure,
  fetchPositionsStart,
  fetchPositionsSuccess,
  fetchShortcutsFailure,
  fetchShortcutsSuccess,
  previewModeDisabled,
  previewModeEnabled,
} from 'src/positions/slice'
import { Position, Shortcut } from 'src/positions/types'
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

function getHooksApiFunctionUrl(
  hooksApiUrl: string,
  functionName: 'getPositions' | 'getShortcuts'
) {
  const url = new URL(hooksApiUrl)
  url.pathname = path.join(url.pathname, functionName)
  return url.toString()
}

async function fetchPositions(hooksApiUrl: string, walletAddress: string) {
  const response = await fetchWithTimeout(
    `${getHooksApiFunctionUrl(hooksApiUrl, 'getPositions')}?` +
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

export function* fetchShortcutsSaga() {
  try {
    if (!getFeatureGate(StatsigFeatureGates.SHOW_CLAIM_SHORTCUTS)) {
      return
    }

    const shortcutsStatus = yield select(shortcutsStatusSelector)
    const hooksPreviewApiUrl = yield select(hooksPreviewApiUrlSelector)
    if (shortcutsStatus === 'success' && !hooksPreviewApiUrl) {
      // no need to fetch shortcuts more than once per session
      // if we're not in preview mode
      return
    }

    const hooksApiUrl = yield select(hooksApiUrlSelector)
    const response = yield call(
      fetchWithTimeout,
      getHooksApiFunctionUrl(hooksApiUrl, 'getShortcuts')
    )
    if (!response.ok) {
      throw new Error(`Unable to fetch shortcuts: ${response.status} ${response.statusText}`)
    }

    const result: {
      data: Shortcut[]
    } = yield call([response, 'json'])
    yield put(fetchShortcutsSuccess(result.data))
  } catch (error) {
    Logger.warn(TAG, 'Unable to fetch shortcuts', error)
    yield put(fetchShortcutsFailure(error))
  }
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
    const hooksApiUrl = yield select(hooksApiUrlSelector)
    const positions = yield call(fetchPositions, hooksApiUrl, address)
    SentryTransactionHub.finishTransaction(SentryTransaction.fetch_positions)
    yield put(fetchPositionsSuccess(positions))
  } catch (error) {
    yield put(fetchPositionsFailure(error))
    Logger.error(TAG, 'Unable to fetch positions', error)
  }
}

function confirmEnableHooksPreview() {
  return new Promise((resolve) => {
    Alert.alert(
      'Hooks Preview Mode',
      "Please confirm that you'd like to enable preview mode for hooks.\n\nThis feature is only intended for developers building hooks. If you're not a developer or didn't trigger this action, DO NOT CONFIRM.",
      [
        {
          text: 'Cancel',
          onPress: () => resolve(false),
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: () => {
            resolve(true)
          },
        },
      ]
    )
  })
}

export function* handleEnableHooksPreviewDeepLink(deeplink: string) {
  let hooksPreviewApiUrl: string | null = null
  try {
    hooksPreviewApiUrl = new URL(deeplink).searchParams.get('hooksApiUrl')
  } catch (error) {
    Logger.warn(TAG, 'Unable to parse hooks preview deeplink', error)
  }

  if (!hooksPreviewApiUrl) {
    yield put(showError(ErrorMessages.HOOKS_INVALID_PREVIEW_API_URL))
    return
  }

  const confirm = yield call(confirmEnableHooksPreview)
  if (confirm) {
    yield put(previewModeEnabled(hooksPreviewApiUrl))
  }
}

export function* watchFetchBalances() {
  // Refresh positions/shortcuts when fetching token balances
  // or when preview mode is enabled/disabled
  yield takeLeading(
    [fetchTokenBalances.type, previewModeEnabled.type, previewModeDisabled.type],
    safely(fetchPositionsSaga)
  )
  yield takeLeading(
    [fetchTokenBalances.type, previewModeEnabled.type, previewModeDisabled.type],
    safely(fetchShortcutsSaga)
  )
}

export function* positionsSaga() {
  yield spawn(watchFetchBalances)
}

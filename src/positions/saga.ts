import isIP from 'is-ip'
import path from 'path'
import { Alert, Platform } from 'react-native'
import Toast from 'react-native-simple-toast'
import { showError } from 'src/alert/actions'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { BuilderHooksEvents, DappShortcutsEvents } from 'src/analytics/Events'
import { HooksEnablePreviewOrigin } from 'src/analytics/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import i18n from 'src/i18n'
import { currentLanguageSelector } from 'src/i18n/selectors'
import { isBottomSheetVisible, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import {
  hooksApiUrlSelector,
  hooksPreviewApiUrlSelector,
  shortcutsStatusSelector,
  triggeredShortcutsStatusSelector,
} from 'src/positions/selectors'
import {
  executeShortcut,
  executeShortcutFailure,
  executeShortcutSuccess,
  fetchPositionsFailure,
  fetchPositionsStart,
  fetchPositionsSuccess,
  fetchShortcutsFailure,
  fetchShortcutsStart,
  fetchShortcutsSuccess,
  previewModeDisabled,
  previewModeEnabled,
  triggerShortcut,
  triggerShortcutFailure,
  triggerShortcutSuccess,
} from 'src/positions/slice'
import { Position, Shortcut } from 'src/positions/types'
import { useSelector } from 'src/redux/hooks'
import { SentryTransactionHub } from 'src/sentry/SentryTransactionHub'
import { SentryTransaction } from 'src/sentry/SentryTransactions'
import { getFeatureGate, getMultichainFeatures } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { fetchTokenBalances } from 'src/tokens/slice'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import { safely } from 'src/utils/safely'
import { sendPreparedTransactions } from 'src/viem/saga'
import { walletAddressSelector } from 'src/web3/selectors'
import { call, put, select, spawn, takeEvery, takeLeading } from 'typed-redux-saga'

const TAG = 'positions/saga'

const HOOKS_FETCH_TIMEOUT = 45_000 // 45 seconds

function getHooksApiFunctionUrl(
  hooksApiUrl: string,
  functionName: 'getPositions' | 'getEarnPositions' | 'v2/getShortcuts' | 'triggerShortcut'
) {
  const url = new URL(hooksApiUrl)
  url.pathname = path.join(url.pathname, functionName)
  return url
}

async function fetchHooks<T>(
  url: string,
  options: RequestInit | null = null,
  duration: number = HOOKS_FETCH_TIMEOUT
) {
  const response = await fetchWithTimeout(url, options, duration)
  if (!response.ok) {
    throw new Error(`Unable to fetch ${url}: ${response.status} ${response.statusText}`)
  }
  const json = await response.json()
  return json.data as T
}

async function fetchPositions(hooksApiUrl: string, walletAddress: string) {
  const networkIds = getMultichainFeatures().showPositions

  const getPositionsUrl = getHooksApiFunctionUrl(hooksApiUrl, 'getPositions')
  getPositionsUrl.searchParams.set('address', walletAddress)
  networkIds.forEach((networkId) => getPositionsUrl.searchParams.append('networkIds', networkId))

  const getEarnPositionsUrl = getHooksApiFunctionUrl(hooksApiUrl, 'getEarnPositions')
  networkIds.forEach((networkId) =>
    getEarnPositionsUrl.searchParams.append('networkIds', networkId)
  )

  const language = useSelector(currentLanguageSelector)
  const options: RequestInit = { headers: { 'Accept-Language': language ?? 'en-US' } }

  const [walletPositions, earnPositions] = await Promise.all([
    fetchHooks<Position[]>(getPositionsUrl.toString(), options),
    fetchHooks<Position[]>(getEarnPositionsUrl.toString(), options),
  ])

  const positionIds = new Set()
  const positions: Position[] = []

  // Dedupe positions, so that earn positions already held by the user
  // aren't shown twice
  for (const position of [...walletPositions, ...earnPositions]) {
    if (positionIds.has(position.positionId)) {
      continue
    }
    positionIds.add(position.positionId)
    positions.push(position)
  }

  return {
    positions,
    earnPositionIds: earnPositions.map((position) => position.positionId),
  }
}

async function fetchShortcuts(hooksApiUrl: string, walletAddress: string) {
  const networkIds = getMultichainFeatures().showShortcuts

  const url = getHooksApiFunctionUrl(hooksApiUrl, 'v2/getShortcuts')
  url.searchParams.set('address', walletAddress)
  networkIds.forEach((networkId) => url.searchParams.append('networkIds', networkId))

  return await fetchHooks<Shortcut[]>(url.toString())
}

export function* fetchShortcutsSaga() {
  try {
    if (!getFeatureGate(StatsigFeatureGates.SHOW_CLAIM_SHORTCUTS)) {
      return
    }
    const address: string | null = yield* select(walletAddressSelector)
    if (!address) {
      Logger.debug(TAG, 'Skipping fetching shortcuts since no address was found')
      return
    }

    const shortcutsStatus = yield* select(shortcutsStatusSelector)
    const hooksPreviewApiUrl = yield* select(hooksPreviewApiUrlSelector)
    if (shortcutsStatus === 'success' && !hooksPreviewApiUrl) {
      // no need to fetch shortcuts more than once per session
      // if we're not in preview mode
      return
    }

    yield* put(fetchShortcutsStart())
    const hooksApiUrl = yield* select(hooksApiUrlSelector)
    const shortcuts = yield* call(fetchShortcuts, hooksApiUrl, address)
    yield* put(fetchShortcutsSuccess(shortcuts))
  } catch (err) {
    const error = ensureError(err)
    Logger.warn(TAG, 'Unable to fetch shortcuts', error)
    yield* put(fetchShortcutsFailure(error))
  }
}

export function* fetchPositionsSaga() {
  try {
    const address: string | null = yield* select(walletAddressSelector)
    if (!address) {
      Logger.debug(TAG, 'Skipping fetching positions since no address was found')
      return
    }
    if (!getFeatureGate(StatsigFeatureGates.SHOW_POSITIONS)) {
      return
    }

    yield* put(fetchPositionsStart())
    SentryTransactionHub.startTransaction(SentryTransaction.fetch_positions)
    const hooksApiUrl = yield* select(hooksApiUrlSelector)
    const { positions, earnPositionIds } = yield* call(fetchPositions, hooksApiUrl, address)
    SentryTransactionHub.finishTransaction(SentryTransaction.fetch_positions)
    yield* put(fetchPositionsSuccess({ positions, earnPositionIds, fetchedAt: Date.now() }))
  } catch (err) {
    const error = ensureError(err)
    yield* put(fetchPositionsFailure(error))
    Logger.error(TAG, 'Unable to fetch positions', error)
  }
}

function confirmEnableHooksPreview() {
  return new Promise((resolve) => {
    Alert.alert(
      i18n.t('hooksPreview.modal.title'),
      i18n.t('hooksPreview.modal.message') ?? undefined,
      [
        {
          text: i18n.t('hooksPreview.modal.cancel') ?? undefined,
          onPress: () => resolve(false),
          style: 'cancel',
        },
        {
          text: i18n.t('hooksPreview.modal.confirm') ?? undefined,
          onPress: () => {
            resolve(true)
          },
        },
      ]
    )
  })
}

// Export for testing
export const _confirmEnableHooksPreview = confirmEnableHooksPreview

export function* handleEnableHooksPreviewDeepLink(
  deeplink: string,
  origin: HooksEnablePreviewOrigin
) {
  AppAnalytics.track(BuilderHooksEvents.hooks_enable_preview_propose, { origin })
  let hooksPreviewApiUrl: string | null = null
  try {
    hooksPreviewApiUrl = new URL(deeplink).searchParams.get('hooksApiUrl')

    // On Android, if the hooks preview API server hostname is an IP address,
    // append the sslip.io domain so that it falls under the
    // Android's cleartext HTTP traffic exceptions we've added
    if (Platform.OS === 'android' && hooksPreviewApiUrl) {
      const url = new URL(hooksPreviewApiUrl)
      if (isIP(url.hostname)) {
        url.hostname = `${url.hostname}.sslip.io`
        hooksPreviewApiUrl = url.toString()
      }
    }
  } catch (err) {
    const error = ensureError(err)
    Logger.warn(TAG, 'Unable to parse hooks preview deeplink', error)
    AppAnalytics.track(BuilderHooksEvents.hooks_enable_preview_error, {
      error: error?.message || error?.toString(),
    })
  }

  if (!hooksPreviewApiUrl) {
    yield* put(showError(ErrorMessages.HOOKS_INVALID_PREVIEW_API_URL))
    return
  }

  const confirm = yield* call(confirmEnableHooksPreview)
  if (confirm) {
    AppAnalytics.track(BuilderHooksEvents.hooks_enable_preview_confirm)
    Logger.info(TAG, `Enabling hooks preview mode with API URL: ${hooksPreviewApiUrl}`)
    yield* put(previewModeEnabled(hooksPreviewApiUrl))
  } else {
    AppAnalytics.track(BuilderHooksEvents.hooks_enable_preview_cancel)
  }
}

export function* triggerShortcutSaga({ payload }: ReturnType<typeof triggerShortcut>) {
  Logger.debug(`${TAG}/triggerShortcutSaga`, 'Initiating request to trigger shortcut', payload)

  const hooksApiUrl = yield* select(hooksApiUrlSelector)

  try {
    const response = yield* call(
      fetchWithTimeout,
      getHooksApiFunctionUrl(hooksApiUrl, 'triggerShortcut').toString(),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload.data),
      }
    )
    if (!response.ok) {
      throw new Error(`Unable to trigger shortcut: ${response.status} ${response.statusText}`)
    }

    const { data } = yield* call([response, 'json'])
    yield* put(triggerShortcutSuccess({ id: payload.id, transactions: data.transactions }))
  } catch (error) {
    yield* put(triggerShortcutFailure(payload.id))
  }
}

export function* executeShortcutSaga({
  payload: { id, preparedTransactions },
}: ReturnType<typeof executeShortcut>) {
  Logger.debug(`${TAG}/executeShortcutSaga`, 'Initiating execute shortcut')

  const triggeredShortcuts = yield* select(triggeredShortcutsStatusSelector)
  const shortcut = triggeredShortcuts[id]
  if (!shortcut) {
    // This should never happen
    throw new Error(`Triggered shortcut with id ${id} not found`)
  }

  const trackedShortcutProperties = {
    appName: shortcut.appName,
    appId: shortcut.appId,
    network: shortcut.networkId,
    shortcutId: shortcut.shortcutId,
    rewardId: id,
  }

  try {
    yield* call(
      sendPreparedTransactions,
      preparedTransactions,
      shortcut.networkId,
      // We can't really create standby transactions for shortcuts
      // since we don't have the necessary information
      preparedTransactions.map(() => () => null)
    )

    yield* put(executeShortcutSuccess(id))
    Toast.showWithGravity(
      i18n.t('dappShortcuts.claimRewardsScreen.claimSuccess'),
      Toast.SHORT,
      Toast.BOTTOM
    )

    AppAnalytics.track(
      DappShortcutsEvents.dapp_shortcuts_reward_claim_success,
      trackedShortcutProperties
    )
  } catch (error) {
    yield* put(executeShortcutFailure(id))
    // TODO customise error message when there are more shortcut types
    yield* put(showError(ErrorMessages.SHORTCUT_CLAIM_REWARD_FAILED))
    Logger.warn(`${TAG}/executeShortcutSaga`, 'Failed to claim reward', error)
    AppAnalytics.track(
      DappShortcutsEvents.dapp_shortcuts_reward_claim_error,
      trackedShortcutProperties
    )
  }

  if (yield* call(isBottomSheetVisible, Screens.DappShortcutTransactionRequest)) {
    navigateBack()
  }
}

export function* watchFetchBalances() {
  // Refresh positions/shortcuts when fetching token balances
  // or when preview mode is enabled/disabled
  yield* takeLeading(
    [fetchTokenBalances.type, previewModeEnabled.type, previewModeDisabled.type],
    safely(fetchPositionsSaga)
  )
  yield* takeLeading(
    [fetchTokenBalances.type, previewModeEnabled.type, previewModeDisabled.type],
    safely(fetchShortcutsSaga)
  )
}

export function* watchShortcuts() {
  yield* takeEvery(triggerShortcut, safely(triggerShortcutSaga))
  yield* takeEvery(executeShortcut, safely(executeShortcutSaga))
}

export function* positionsSaga() {
  yield* spawn(watchFetchBalances)
  yield* spawn(watchShortcuts)
}

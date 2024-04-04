import { CeloTxReceipt } from '@celo/connect'
import { TxParamsNormalizer } from '@celo/connect/lib/utils/tx-params-normalizer'
import { ContractKit } from '@celo/contractkit'
import isIP from 'is-ip'
import path from 'path'
import { Alert, Platform } from 'react-native'
import Toast from 'react-native-simple-toast'
import { showError } from 'src/alert/actions'
import { BuilderHooksEvents, DappShortcutsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { HooksEnablePreviewOrigin } from 'src/analytics/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import i18n from 'src/i18n'
import { isBottomSheetVisible, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import {
  hooksApiUrlSelector,
  hooksPreviewApiUrlSelector,
  shortcutsStatusSelector,
  triggeredShortcutsStatusSelector,
} from 'src/positions/selectors'
import {
  TriggeredShortcuts,
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
import { SentryTransactionHub } from 'src/sentry/SentryTransactionHub'
import { SentryTransaction } from 'src/sentry/SentryTransactions'
import { getDynamicConfigParams, getFeatureGate } from 'src/statsig'
import { StatsigDynamicConfigs, StatsigFeatureGates } from 'src/statsig/types'
import { fetchTokenBalances } from 'src/tokens/slice'
import { sendTransaction } from 'src/transactions/send'
import { NetworkId, newTransactionContext } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import { safely } from 'src/utils/safely'
import { getContractKit } from 'src/web3/contracts'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { walletAddressSelector } from 'src/web3/selectors'
import { applyChainIdWorkaround, buildTxo } from 'src/web3/utils'
import { call, put, select, spawn, takeEvery, takeLeading } from 'typed-redux-saga'
import { DynamicConfigs } from 'src/statsig/constants'

const TAG = 'positions/saga'

const POSITIONS_FETCH_TIMEOUT = 45_000 // 45 seconds

function getHooksApiFunctionUrl(
  hooksApiUrl: string,
  functionName: 'getPositions' | 'v2/getShortcuts' | 'triggerShortcut'
) {
  const url = new URL(hooksApiUrl)
  url.pathname = path.join(url.pathname, functionName)
  return url.toString()
}

async function fetchHooks(
  hooksApiUrl: string,
  functionName: 'getPositions' | 'v2/getShortcuts',
  walletAddress: string,
  networkIds: NetworkId[]
) {
  const urlSearchParams = new URLSearchParams({
    address: walletAddress,
  })
  networkIds.forEach((networkId) => urlSearchParams.append('networkIds', networkId))
  const response = await fetchWithTimeout(
    `${getHooksApiFunctionUrl(hooksApiUrl, functionName)}?` + urlSearchParams,
    null,
    POSITIONS_FETCH_TIMEOUT
  )
  if (!response.ok) {
    throw new Error(`Unable to fetch ${functionName}: ${response.status} ${response.statusText}`)
  }
  const json = await response.json()
  return json.data
}

async function fetchPositions(hooksApiUrl: string, walletAddress: string) {
  const networkIds = getDynamicConfigParams(
    DynamicConfigs[StatsigDynamicConfigs.MULTI_CHAIN_FEATURES]
  ).showPositions
  return (await fetchHooks(hooksApiUrl, 'getPositions', walletAddress, networkIds)) as Position[]
}

async function fetchShortcuts(hooksApiUrl: string, walletAddress: string) {
  const networkIds = getDynamicConfigParams(
    DynamicConfigs[StatsigDynamicConfigs.MULTI_CHAIN_FEATURES]
  ).showShortcuts
  return (await fetchHooks(hooksApiUrl, 'v2/getShortcuts', walletAddress, networkIds)) as Shortcut[]
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
    const positions = yield* call(fetchPositions, hooksApiUrl, address)
    SentryTransactionHub.finishTransaction(SentryTransaction.fetch_positions)
    yield* put(fetchPositionsSuccess(positions))
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
  ValoraAnalytics.track(BuilderHooksEvents.hooks_enable_preview_propose, { origin })
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
    ValoraAnalytics.track(BuilderHooksEvents.hooks_enable_preview_error, {
      error: error?.message || error?.toString(),
    })
  }

  if (!hooksPreviewApiUrl) {
    yield* put(showError(ErrorMessages.HOOKS_INVALID_PREVIEW_API_URL))
    return
  }

  const confirm = yield* call(confirmEnableHooksPreview)
  if (confirm) {
    ValoraAnalytics.track(BuilderHooksEvents.hooks_enable_preview_confirm)
    Logger.info(TAG, `Enabling hooks preview mode with API URL: ${hooksPreviewApiUrl}`)
    yield* put(previewModeEnabled(hooksPreviewApiUrl))
  } else {
    ValoraAnalytics.track(BuilderHooksEvents.hooks_enable_preview_cancel)
  }
}

export function* triggerShortcutSaga({ payload }: ReturnType<typeof triggerShortcut>) {
  Logger.debug(`${TAG}/triggerShortcutSaga`, 'Initiating request to trigger shortcut', payload)

  const hooksApiUrl = yield* select(hooksApiUrlSelector)

  try {
    const response = yield* call(
      fetchWithTimeout,
      getHooksApiFunctionUrl(hooksApiUrl, 'triggerShortcut'),
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

export function* executeShortcutSaga({ payload }: ReturnType<typeof executeShortcut>) {
  Logger.debug(`${TAG}/executeShortcutSaga`, 'Initiating execute shortcut')

  const triggeredShortcuts: TriggeredShortcuts = yield* select(triggeredShortcutsStatusSelector)
  const shortcut = triggeredShortcuts[payload]
  const trackedShortcutProperties = {
    appName: shortcut.appName,
    appId: shortcut.appId,
    network: shortcut.networkId,
    shortcutId: shortcut.shortcutId,
    rewardId: payload,
  }

  try {
    const kit: ContractKit = yield* call(getContractKit)
    const walletAddress: string = yield* call(getConnectedUnlockedAccount)
    const normalizer = new TxParamsNormalizer(kit.connection)

    // use JSON stringify / parse, otherwise the transaction fails with this
    // error: 'Gas estimation failed: Could not decode transaction failure
    // reason or Error: invalid argument 0: json: cannot unmarshal non-string
    // into Go struct field TransactionArgs.chainId of type *hexutil.Big'
    const shortcutTransactions = JSON.parse(JSON.stringify(shortcut?.transactions) ?? '[]')

    Logger.debug(`${TAG}/executeShortcutSaga`, 'Starting to claim reward(s)', shortcutTransactions)

    // TODO parallelize the send transactions
    for (const transaction of shortcutTransactions) {
      applyChainIdWorkaround(transaction, yield* call([kit.connection, 'chainId']))
      const tx = yield* call([normalizer, 'populate'], transaction)
      const txo = buildTxo(kit, tx)

      const receipt: CeloTxReceipt = yield* call(
        sendTransaction,
        txo,
        walletAddress,
        newTransactionContext(TAG, 'Execute shortcut')
      )

      Logger.debug(
        `${TAG}/executeShortcutSaga`,
        'Claimed reward successful',
        receipt.transactionHash
      )
    }

    yield* put(executeShortcutSuccess(payload))
    Toast.showWithGravity(
      i18n.t('dappShortcuts.claimRewardsScreen.claimSuccess'),
      Toast.SHORT,
      Toast.BOTTOM
    )

    ValoraAnalytics.track(
      DappShortcutsEvents.dapp_shortcuts_reward_claim_success,
      trackedShortcutProperties
    )
  } catch (error) {
    yield* put(executeShortcutFailure(payload))
    // TODO customise error message when there are more shortcut types
    yield* put(showError(ErrorMessages.SHORTCUT_CLAIM_REWARD_FAILED))
    Logger.warn(`${TAG}/executeShortcutSaga`, 'Failed to claim reward', error)
    ValoraAnalytics.track(
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

import { appendPath } from '@celo/utils/lib/string'
import { formatJsonRpcError, formatJsonRpcResult, JsonRpcResult } from '@json-rpc-tools/utils'
import { Core } from '@walletconnect/core'
import '@walletconnect/react-native-compat'
import { SessionTypes } from '@walletconnect/types'
import { buildApprovedNamespaces, getSdkError, parseUri } from '@walletconnect/utils'
import { IWeb3Wallet, Web3Wallet, Web3WalletTypes } from '@walletconnect/web3wallet'
import { EventChannel, eventChannel } from 'redux-saga'
import { showMessage } from 'src/alert/actions'
import { WalletConnectEvents } from 'src/analytics/Events'
import { WalletConnect2Properties } from 'src/analytics/Properties'
import { DappRequestOrigin, WalletConnectPairingOrigin } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { walletConnectEnabledSelector } from 'src/app/selectors'
import { getDappRequestOrigin } from 'src/app/utils'
import { APP_NAME, WEB_LINK } from 'src/brandingConfig'
import { WALLET_CONNECT_PROJECT_ID } from 'src/config'
import { activeDappSelector } from 'src/dapps/selectors'
import { ActiveDapp } from 'src/dapps/types'
import i18n from 'src/i18n'
import { isBottomSheetVisible, navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { feeCurrenciesSelector } from 'src/tokens/selectors'
import { getSupportedNetworkIdsForWalletConnect } from 'src/tokens/utils'
import { Network } from 'src/transactions/types'
import { ensureError } from 'src/utils/ensureError'
import Logger from 'src/utils/Logger'
import { safely } from 'src/utils/safely'
import { publicClient } from 'src/viem'
import { getSerializablePreparedTransaction } from 'src/viem/preparedTransactionSerialization'
import {
  PreparedTransactionsResult,
  prepareTransactions,
  TransactionRequest,
} from 'src/viem/prepareTransactions'
import {
  AcceptRequest,
  AcceptSession,
  Actions,
  clientInitialised,
  CloseSession,
  DenyRequest,
  denyRequest,
  DenySession,
  initialiseClient,
  InitialisePairing,
  initialisePairing,
  removeExpiredSessions,
  sessionCreated,
  sessionDeleted,
  SessionPayload,
  sessionPayload,
  sessionProposal,
  SessionProposal,
  WalletConnectActions,
} from 'src/walletConnect/actions'
import {
  getDefaultRequestTrackedProperties,
  getDefaultSessionTrackedProperties as getDefaultSessionTrackedPropertiesAnalytics,
} from 'src/walletConnect/analytics'
import { isSupportedAction, SupportedActions, SupportedEvents } from 'src/walletConnect/constants'
import { handleRequest } from 'src/walletConnect/request'
import {
  selectHasPendingState,
  selectPendingActions,
  selectSessions,
} from 'src/walletConnect/selectors'
import { WalletConnectRequestType } from 'src/walletConnect/types'
import networkConfig, {
  networkIdToWalletConnectChainId,
  walletConnectChainIdToNetwork,
  walletConnectChainIdToNetworkId,
} from 'src/web3/networkConfig'
import { getWalletAddress } from 'src/web3/saga'
import { walletAddressSelector } from 'src/web3/selectors'
import {
  call,
  delay,
  put,
  race,
  select,
  spawn,
  take,
  takeEvery,
  takeLeading,
} from 'typed-redux-saga'
import { Address, GetTransactionCountParameters, hexToBigInt, isHex } from 'viem'
import { getTransactionCount } from 'viem/actions'

let client: IWeb3Wallet | null = null

export function _setClientForTesting(newClient: IWeb3Wallet | null) {
  client = newClient
}

const TAG = 'WalletConnect/saga'

const GET_SESSION_TIMEOUT = 10_000

export function* getDefaultSessionTrackedProperties(
  session: Web3WalletTypes.EventArguments['session_proposal'] | SessionTypes.Struct
) {
  const activeDapp: ActiveDapp | null = yield* select(activeDappSelector)
  return getDefaultSessionTrackedPropertiesAnalytics(session, activeDapp)
}

function* handleInitialiseWalletConnect() {
  const walletConnectChannel = yield* call(createWalletConnectChannel)
  while (true) {
    const message: WalletConnectActions = yield* take(walletConnectChannel)
    yield* put(message)
  }
}

// Though the WC types say `icons` is string[], we've seen buggy clients with no `icons` property
// so to avoid crashing the code depending on this, we fix it here
// Note: this method mutates the session
function applyIconFixIfNeeded(
  session: Web3WalletTypes.EventArguments['session_proposal'] | SessionTypes.Struct
) {
  const peer = 'params' in session ? session.params.proposer : session.peer
  const { icons } = peer?.metadata || {}
  if (peer?.metadata && (!Array.isArray(icons) || typeof icons[0] !== 'string' || !icons[0])) {
    peer.metadata.icons = []
  }
}

// Export for testing
export const _applyIconFixIfNeeded = applyIconFixIfNeeded

function* createWalletConnectChannel() {
  if (!client) {
    Logger.debug(TAG + '@createWalletConnectChannel', `init start`)
    client = yield* call([Web3Wallet, 'init'], {
      core: new Core({
        projectId: WALLET_CONNECT_PROJECT_ID,
        relayUrl: networkConfig.walletConnectEndpoint,
      }),
      metadata: {
        name: APP_NAME,
        description: i18n.t('appDescription'),
        url: WEB_LINK,
        icons: [appendPath(WEB_LINK, 'favicon.ico')],
        redirect: {
          native: 'celo://wallet/wc',
          universal: 'https://valoraapp.com/wc',
        },
      },
    })

    Logger.debug(TAG + '@createWalletConnectChannel', `init end`)
    yield* put(clientInitialised())
  }

  return eventChannel((emit) => {
    const onSessionProposal = (session: Web3WalletTypes.EventArguments['session_proposal']) => {
      applyIconFixIfNeeded(session)
      emit(sessionProposal(session))
    }

    const onSessionDeleted = (session: Web3WalletTypes.EventArguments['session_delete']) => {
      emit(sessionDeleted(session))
    }
    const onSessionRequest = (request: Web3WalletTypes.EventArguments['session_request']) => {
      emit(sessionPayload(request))
    }

    if (!client) {
      return () => {
        Logger.debug(TAG + '@createWalletConnectChannel', 'missing client clean up')
      }
    }

    client.on('session_proposal', onSessionProposal)
    client.on('session_delete', onSessionDeleted)
    client.on('session_request', onSessionRequest)

    return async () => {
      if (!client) {
        Logger.debug(TAG + '@createWalletConnectChannel', 'clean up but missing client')
        return
      }

      Logger.debug(TAG + '@createWalletConnectChannel', 'clean up')

      client.off('session_proposal', onSessionProposal)
      client.off('session_delete', onSessionDeleted)
      client.off('session_request', onSessionRequest)

      const connections = client.getActiveSessions()
      await Promise.all(
        Object.keys(connections).map((topic) =>
          client!.disconnectSession({ topic, reason: getSdkError('USER_DISCONNECTED') })
        )
      )

      client = null
    }
  }) as EventChannel<WalletConnectActions>
}

function* handleInitialisePairing({ uri, origin }: InitialisePairing) {
  const activeDapp: ActiveDapp | null = yield* select(activeDappSelector)
  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_pairing_start, {
      dappRequestOrigin: getDappRequestOrigin(activeDapp),
      origin,
    })

    if (!client) {
      throw new Error('missing client')
    }

    Logger.debug(TAG + '@handleInitialisePairing', 'pair start')
    yield* call([client, 'pair'], { uri })
    Logger.debug(TAG + '@handleInitialisePairing', 'pair end')
  } catch (err) {
    const error = ensureError(err)
    Logger.debug(TAG + '@handleInitialisePairing', error.message)
    ValoraAnalytics.track(WalletConnectEvents.wc_pairing_error, {
      dappRequestOrigin: getDappRequestOrigin(activeDapp),
      error: error.message,
    })
  }
}

/**
 * When handling incoming requests (actions or sessions) we need to handle
 * them in order. That means if a request comes in, and we already have a
 * pending one, ignore it. Once a request is dealt with we handle the new
 * requests accordingly.
 */

function* handleIncomingSessionRequest({ session }: SessionProposal) {
  const { pending }: { pending: Web3WalletTypes.EventArguments['session_proposal'][] } =
    yield* select(selectSessions)
  if (pending.length > 1) {
    return
  }

  yield* call(showSessionRequest, session)
}

function* handleIncomingActionRequest({ request }: SessionPayload) {
  const pendingActions: Web3WalletTypes.EventArguments['session_request'][] =
    yield* select(selectPendingActions)
  if (pendingActions.length > 1) {
    return
  }

  yield* call(showActionRequest, request)
}

function* showSessionRequest(session: Web3WalletTypes.EventArguments['session_proposal']) {
  const activeDapp = yield* select(activeDappSelector)
  ValoraAnalytics.track(WalletConnectEvents.wc_pairing_success, {
    dappRequestOrigin: activeDapp ? DappRequestOrigin.InAppWebView : DappRequestOrigin.External,
  })

  const defaultSessionTrackedProperties: WalletConnect2Properties = yield* call(
    getDefaultSessionTrackedProperties,
    session
  )
  ValoraAnalytics.track(WalletConnectEvents.wc_session_propose, {
    ...defaultSessionTrackedProperties,
  })

  const address = yield* call(getWalletAddress)
  const { requiredNamespaces } = session.params

  // Here we approve all required namespaces, but only for EVM chains.
  // This is so we don't break existing dapps which don't specify the Celo chain as required.
  // As of writing this, Curve, Toucan and Cred Protocol do that.
  // We also add the chains that we support to the list if it's not already there.
  // The goal is to be more flexible and allow the initial connection to succeed, no matter what (EVM) chain is specified.
  // If later the dapp actually requests an action on an unsupported chain, we will show an error.
  // See SessionRequest and ActionRequest for more details.
  const requiredEip155Chains = requiredNamespaces.eip155?.chains ?? []
  const supportedEip155Chains = yield* call(getSupportedChains)
  const approvedEip155Chains = [
    ...supportedEip155Chains,
    ...requiredEip155Chains.filter((chainId) => !supportedEip155Chains.includes(chainId)),
  ]

  // Here we approve all required methods, but only for EVM chains.
  // Again, this is to be more flexible and allow the initial connection to succeed.
  // If later an unsupported method is requested, we will show an error.
  const requiredEip155Methods = requiredNamespaces.eip155?.methods ?? []
  const supportedEip155Methods = Object.values(SupportedActions) as string[]
  const approvedEip155Methods = [
    ...supportedEip155Methods,
    ...requiredEip155Methods.filter((method) => !supportedEip155Methods.includes(method)),
  ]

  // And similar for events
  const requiredEip155Events = requiredNamespaces.eip155?.events ?? []
  const supportedEip155Events = Object.values(SupportedEvents) as string[]
  const approvedEip155Events = [
    ...supportedEip155Events,
    ...requiredEip155Events.filter((event) => !supportedEip155Events.includes(event)),
  ]

  let namespacesToApprove: SessionTypes.Namespaces | null = null
  try {
    // Important: this still throws if the required namespaces don't overlap with the supported ones
    namespacesToApprove = buildApprovedNamespaces({
      proposal: session.params,
      supportedNamespaces: {
        eip155: {
          chains: approvedEip155Chains,
          methods: approvedEip155Methods,
          events: approvedEip155Events,
          accounts: approvedEip155Chains.map((chain) => `${chain}:${address}`),
        },
      },
    })
  } catch (e) {
    // Right now the only way this can happen is if the required chain isn't an EVM chain
    // since we've approved all EVM chains/methods/events above.
    Logger.warn(TAG + '@showSessionRequest', 'Failed to build approved namespaces', e)
  }

  navigate(Screens.WalletConnectRequest, {
    type: WalletConnectRequestType.Session,
    pendingSession: session,
    namespacesToApprove,
    supportedChains: supportedEip155Chains,
    version: 2,
  })
}

// Export for testing
export const _showSessionRequest = showSessionRequest

function getSupportedChains() {
  const useViem = getFeatureGate(StatsigFeatureGates.USE_VIEM_FOR_WALLETCONNECT_TRANSACTIONS)
  if (!useViem) {
    return [networkIdToWalletConnectChainId[networkConfig.defaultNetworkId]]
  }

  const supportedNetworkIdsForWalletConnect = getSupportedNetworkIdsForWalletConnect()
  return supportedNetworkIdsForWalletConnect.map((networkId) => {
    return networkIdToWalletConnectChainId[networkId]
  })
}

function convertToBigInt(value: any) {
  return isHex(value)
    ? hexToBigInt(value)
    : // make sure that we can safely parse the value as a BigInt
      typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint'
      ? BigInt(value)
      : undefined
}

function convertToNumber(value: any) {
  const bigValue = convertToBigInt(value)
  return bigValue !== undefined ? Number(bigValue) : undefined
}

// Normalize the raw request into a usable format (bigint, etc) for viem
// Note: the raw request should be in RPC format (fields in hex string)
// but sometimes we've seen fields with numbers instead of hex strings
// i.e. don't trust the raw request to be in the correct format, since it comes from the dapp
export function* normalizeTransaction(rawTx: any, network: Network) {
  const tx: TransactionRequest = {
    ...rawTx,
    gas: convertToBigInt(rawTx.gas),
    gasPrice: convertToBigInt(rawTx.gasPrice),
    maxFeePerGas: convertToBigInt(rawTx.maxFeePerGas),
    maxPriorityFeePerGas: convertToBigInt(rawTx.maxPriorityFeePerGas),
    nonce: convertToNumber(rawTx.nonce),
    value: convertToBigInt(rawTx.value),
  }

  // Handle `gasLimit` as a misnomer for `gas`, it usually comes through in hex format
  if ('gasLimit' in tx && tx.gas === undefined) {
    tx.gas = convertToBigInt(tx.gasLimit)
    delete tx.gasLimit
  }

  // On Celo, re-calculate the feeCurrency and gas since it is not possible to tell from
  // the request payload if the feeCurrency is set to undefined (native
  // currency) explicitly or due to lack of feeCurrency support
  if (network === Network.Celo) {
    delete tx.gas
    if ('feeCurrency' in tx) {
      delete tx.feeCurrency
    }
  }

  // Force upgrade legacy tx to EIP-1559/CIP-42/CIP-64
  if (tx.gasPrice !== undefined) {
    delete tx.gasPrice
  }

  if (!tx.nonce) {
    const walletAddress = yield* select(walletAddressSelector)
    if (!walletAddress) {
      // this should never happen
      throw new Error('no wallet address found')
    }

    const txCountParams: GetTransactionCountParameters = {
      address: walletAddress as Address,
      blockTag: 'pending',
    }
    tx.nonce = yield* call(getTransactionCount, publicClient[network], txCountParams)
  }

  // Strip undefined keys, just to avoid noise in the logs or tests
  for (const key of Object.keys(tx) as Array<keyof TransactionRequest>) {
    if (tx[key] === undefined) {
      delete tx[key]
    }
  }

  return tx
}

function* showActionRequest(request: Web3WalletTypes.EventArguments['session_request']) {
  if (!client) {
    throw new Error('missing client')
  }

  const method = request.params.request.method
  if (!isSupportedAction(method)) {
    // Directly deny unsupported requests
    yield* put(denyRequest(request, getSdkError('WC_METHOD_UNSUPPORTED')))
    return
  }

  const session: SessionTypes.Struct = yield* call(getSessionFromRequest, request)
  const defaultSessionTrackedProperties: WalletConnect2Properties = yield* call(
    getDefaultSessionTrackedProperties,
    session
  )
  ValoraAnalytics.track(WalletConnectEvents.wc_request_propose, {
    ...defaultSessionTrackedProperties,
    ...getDefaultRequestTrackedProperties(request),
  })

  const activeSessions = yield* call([client, 'getActiveSessions'])
  const activeSession = activeSessions[session.topic]
  if (!activeSession) {
    yield* put(denyRequest(request, getSdkError('UNAUTHORIZED_EVENT')))
    return
  }

  // since there are some network requests needed to prepare the transaction,
  // add a loading state
  navigate(Screens.WalletConnectRequest, {
    type: WalletConnectRequestType.Loading,
    origin: WalletConnectPairingOrigin.Deeplink,
  })

  const supportedChains = yield* call(getSupportedChains)

  const networkId = walletConnectChainIdToNetworkId[request.params.chainId]
  const feeCurrencies = yield* select((state) => feeCurrenciesSelector(state, networkId))
  let preparedTransactionsResult: PreparedTransactionsResult | undefined = undefined
  if (
    method === SupportedActions.eth_signTransaction ||
    method === SupportedActions.eth_sendTransaction
  ) {
    const rawTx = request.params.request.params[0]
    Logger.debug(TAG + '@showActionRequest', 'Received transaction', rawTx)
    const network = walletConnectChainIdToNetwork[request.params.chainId]
    const normalizedTx = yield* call(normalizeTransaction, rawTx, network)
    preparedTransactionsResult = yield* call(prepareTransactions, {
      feeCurrencies,
      decreasedAmountGasFeeMultiplier: 1,
      baseTransactions: [normalizedTx],
    })
  }

  const preparedTransaction =
    preparedTransactionsResult?.type === 'possible'
      ? getSerializablePreparedTransaction(preparedTransactionsResult.transactions[0])
      : undefined
  Logger.debug(
    TAG + '@showActionRequest',
    'Prepared transaction',
    preparedTransactionsResult?.type,
    preparedTransaction
  )

  navigate(Screens.WalletConnectRequest, {
    type: WalletConnectRequestType.Action,
    pendingAction: request,
    supportedChains,
    version: 2,
    hasInsufficientGasFunds: preparedTransactionsResult?.type === 'not-enough-balance-for-gas',
    feeCurrenciesSymbols: feeCurrencies.map((token) => token.symbol),
    preparedTransaction,
  })
}

function* acceptSession({ session, approvedNamespaces }: AcceptSession) {
  const defaultTrackedProperties: WalletConnect2Properties = yield* call(
    getDefaultSessionTrackedProperties,
    session
  )
  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_session_approve_start, defaultTrackedProperties)

    if (!client) {
      throw new Error('missing client')
    }

    const { relays, proposer } = session.params

    yield* call([client, 'approveSession'], {
      id: session.id,
      relayProtocol: relays[0].protocol,
      namespaces: approvedNamespaces,
    })

    ValoraAnalytics.track(WalletConnectEvents.wc_session_approve_success, defaultTrackedProperties)

    // the Client does not emit any events when a new session value is
    // available, so if no matching session could be found we can wait and try again.
    const { timedOut, newSession } = yield* race({
      timedOut: delay(GET_SESSION_TIMEOUT),
      newSession: call(getSessionFromClient, session),
    })

    if (!newSession || timedOut) {
      throw new Error('No corresponding session could not be found on the client')
    }

    yield* put(sessionCreated(newSession))
    yield* call(showWalletConnectionSuccessMessage, proposer.metadata.name)
  } catch (err) {
    const e = ensureError(err)
    Logger.debug(TAG + '@acceptSession', e.message)
    ValoraAnalytics.track(WalletConnectEvents.wc_session_approve_error, {
      ...defaultTrackedProperties,
      error: e.message,
    })
  }

  yield* call(handlePendingStateOrNavigateBack)
}

// Export for testing
export const _acceptSession = acceptSession

function* getSessionFromClient(session: Web3WalletTypes.EventArguments['session_proposal']) {
  if (!client) {
    // should not happen
    throw new Error('missing client')
  }

  let sessionValue: null | SessionTypes.Struct = null
  while (!sessionValue) {
    const sessions: Record<string, SessionTypes.Struct> = yield* call([client, 'getActiveSessions'])
    Object.values(sessions).forEach((entry) => {
      if (entry.pairingTopic === session.params.pairingTopic) {
        sessionValue = entry
      }
    })

    if (!sessionValue) {
      yield* delay(500)
    }
  }

  applyIconFixIfNeeded(sessionValue)
  return sessionValue as SessionTypes.Struct
}

function* denySession({ session, reason }: DenySession) {
  const defaultSessionTrackedProperties: WalletConnect2Properties = yield* call(
    getDefaultSessionTrackedProperties,
    session
  )
  const defaultTrackedProperties = {
    ...defaultSessionTrackedProperties,
    rejectReason: reason.message,
  }

  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_session_reject_start, defaultTrackedProperties)

    if (!client) {
      throw new Error('missing client')
    }

    yield* call([client, 'rejectSession'], {
      id: session.id,
      reason,
    })

    ValoraAnalytics.track(WalletConnectEvents.wc_session_reject_success, defaultTrackedProperties)
  } catch (err) {
    const e = ensureError(err)
    Logger.debug(TAG + '@denySession', e.message)
    ValoraAnalytics.track(WalletConnectEvents.wc_session_reject_error, {
      ...defaultTrackedProperties,
      error: e.message,
    })
  }

  yield* call(handlePendingStateOrNavigateBack)
}

function* getSessionFromRequest(request: Web3WalletTypes.EventArguments['session_request']) {
  if (!client) {
    // should not happen
    throw new Error('missing client')
  }
  // Active Sessions is an object with keys that are uuids
  const activeSessions = yield* call([client, 'getActiveSessions'])
  const session = activeSessions[request.topic]

  if (!session) {
    // This should never happen
    throw new Error(`Unable to find WalletConnect session matching topic ${request.topic}`)
  }

  return session
}

function* handleAcceptRequest({ request, preparedTransaction }: AcceptRequest) {
  const session: SessionTypes.Struct = yield* call(getSessionFromRequest, request)
  const defaultSessionTrackedProperties: WalletConnect2Properties = yield* call(
    getDefaultSessionTrackedProperties,
    session
  )
  const defaultTrackedProperties = {
    ...defaultSessionTrackedProperties,
    ...getDefaultRequestTrackedProperties(request),
  }

  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_request_accept_start, defaultTrackedProperties)

    if (!client) {
      throw new Error('Missing client')
    }

    const { topic, id, params } = request
    const activeSessions = yield* call([client, 'getActiveSessions'])
    const activeSession = activeSessions[topic]

    if (!activeSession) {
      throw new Error(`Missing active session for topic ${topic}`)
    }

    const result = yield* call(handleRequest, params, preparedTransaction)
    const response: JsonRpcResult<string> = formatJsonRpcResult(
      id,
      (params.request.method = typeof result === 'string' ? result : result.raw)
    )
    yield* call([client, 'respondSessionRequest'], { topic, response })

    ValoraAnalytics.track(WalletConnectEvents.wc_request_accept_success, defaultTrackedProperties)
    yield* call(showWalletConnectionSuccessMessage, activeSession.peer.metadata.name)
  } catch (err) {
    const e = ensureError(err)
    Logger.debug(TAG + '@acceptRequest', e.message)
    ValoraAnalytics.track(WalletConnectEvents.wc_request_accept_error, {
      ...defaultTrackedProperties,
      error: e.message,
    })

    // Notify the client about the error if possible
    try {
      const { topic, id } = request
      if (client && topic && id) {
        const response = formatJsonRpcResult(id, { error: e })
        yield* call([client, 'respondSessionRequest'], { topic, response })
      }
    } catch (error) {
      const e = ensureError(err)
      Logger.debug(TAG + '@acceptRequest', e.message)
      ValoraAnalytics.track(WalletConnectEvents.wc_request_accept_error, {
        ...defaultTrackedProperties,
        error: e.message,
      })
    }
  }

  yield* call(handlePendingStateOrNavigateBack)
}

function* handleDenyRequest({ request, reason }: DenyRequest) {
  const session: SessionTypes.Struct = yield* call(getSessionFromRequest, request)
  const defaultSessionTrackedProperties: WalletConnect2Properties = yield* call(
    getDefaultSessionTrackedProperties,
    session
  )
  const defaultTrackedProperties = {
    ...defaultSessionTrackedProperties,
    ...getDefaultRequestTrackedProperties(request),
    denyReason: reason.message,
  }

  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_request_deny_start, defaultTrackedProperties)

    if (!client) {
      throw new Error('Missing client')
    }

    const { topic, id } = request
    const response = formatJsonRpcError(id, reason.message)
    yield* call([client, 'respondSessionRequest'], { topic, response })
    ValoraAnalytics.track(WalletConnectEvents.wc_request_deny_success, defaultTrackedProperties)
  } catch (err) {
    const e = ensureError(err)
    Logger.debug(TAG + '@denyRequest', e.message)
    ValoraAnalytics.track(WalletConnectEvents.wc_request_deny_error, {
      ...defaultTrackedProperties,
      error: e.message,
    })
  }

  yield* call(handlePendingStateOrNavigateBack)
}

function* closeSession({ session }: CloseSession) {
  const defaultTrackedProperties: WalletConnect2Properties = yield* call(
    getDefaultSessionTrackedProperties,
    session
  )

  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_session_remove_start, defaultTrackedProperties)

    if (!client) {
      throw new Error('missing client')
    }

    yield* call([client, 'disconnectSession'], {
      topic: session.topic,
      reason: getSdkError('USER_DISCONNECTED'),
    })

    ValoraAnalytics.track(WalletConnectEvents.wc_session_remove_success, defaultTrackedProperties)
  } catch (err) {
    const e = ensureError(err)
    Logger.debug(TAG + '@closeSession', e.message)
    ValoraAnalytics.track(WalletConnectEvents.wc_session_remove_error, {
      ...defaultTrackedProperties,
      error: e.message,
    })
  }
}

function* handlePendingStateOrNavigateBack() {
  const hasPendingState: boolean = yield* select(selectHasPendingState)

  if (hasPendingState) {
    yield* call(handlePendingState)
  } else if (yield* call(isBottomSheetVisible, Screens.WalletConnectRequest)) {
    navigateBack()
  }
}

function* handlePendingState() {
  const {
    pending: [pendingSession],
  }: { pending: Web3WalletTypes.EventArguments['session_proposal'][] } =
    yield* select(selectSessions)
  if (pendingSession) {
    yield* call(showSessionRequest, pendingSession)
    return
  }

  const [pendingRequest]: Web3WalletTypes.EventArguments['session_request'][] =
    yield* select(selectPendingActions)
  if (pendingRequest) {
    yield* call(showActionRequest, pendingRequest)
  }
}

function* checkPersistedState() {
  yield* put(removeExpiredSessions(Date.now() / 1000))

  const hasPendingState = yield* select(selectHasPendingState)
  if (hasPendingState) {
    yield* put(initialiseClient())
    yield* take(Actions.CLIENT_INITIALISED)
    yield* call(handlePendingState)
    return
  }

  const { sessions }: { sessions: SessionTypes.Struct[] } = yield* select(selectSessions)
  if (sessions.length) {
    yield* put(initialiseClient())
  }
}

export function* walletConnectSaga() {
  yield* takeLeading(Actions.INITIALISE_CLIENT, safely(handleInitialiseWalletConnect))
  yield* takeEvery(Actions.INITIALISE_PAIRING, safely(handleInitialisePairing))
  yield* takeEvery(Actions.CLOSE_SESSION, safely(closeSession))

  yield* takeEvery(Actions.SESSION_PROPOSAL, safely(handleIncomingSessionRequest))
  yield* takeEvery(Actions.ACCEPT_SESSION, safely(acceptSession))
  yield* takeEvery(Actions.DENY_SESSION, safely(denySession))

  yield* takeEvery(Actions.SESSION_PAYLOAD, safely(handleIncomingActionRequest))
  yield* takeEvery(Actions.ACCEPT_REQUEST, safely(handleAcceptRequest))
  yield* takeEvery(Actions.DENY_REQUEST, safely(handleDenyRequest))

  yield* spawn(checkPersistedState)
}

export function* initialiseWalletConnectV2(uri: string, origin: WalletConnectPairingOrigin) {
  if (!client) {
    yield* put(initialiseClient())
    yield* take(Actions.CLIENT_INITIALISED)
  }
  yield* put(initialisePairing(uri, origin))
}

export function* isWalletConnectEnabled(uri: string) {
  const { version } = parseUri(uri)
  const { v1, v2 }: { v1: boolean; v2: boolean } = yield* select(walletConnectEnabledSelector)
  const versionEnabled: { [version: string]: boolean | undefined } = {
    '1': v1,
    '2': v2,
  }
  return versionEnabled[version] ?? false
}

export function* initialiseWalletConnect(uri: string, origin: WalletConnectPairingOrigin) {
  const walletConnectEnabled = yield* call(isWalletConnectEnabled, uri)

  const { version } = parseUri(uri)
  if (!walletConnectEnabled) {
    Logger.debug('initialiseWalletConnect', `v${version} is disabled, ignoring`)
    return
  }

  switch (version) {
    case 2:
      yield* call(initialiseWalletConnectV2, uri, origin)
      break
    case 1:
    default:
      throw new Error(`Unsupported WalletConnect version '${version}'`)
  }
}

export function* showWalletConnectionSuccessMessage(dappName: string) {
  const activeDapp = yield* select(activeDappSelector)
  const successMessage = activeDapp
    ? i18n.t('inAppConnectionSuccess', { dappName })
    : i18n.t('connectionSuccess', { dappName })
  yield* put(showMessage(successMessage))
}

import { appendPath } from '@celo/base'
import { CeloTx, EncodedTransaction, TransactionResult } from '@celo/connect'
import { TxParamsNormalizer } from '@celo/connect/lib/utils/tx-params-normalizer'
import { ContractKit } from '@celo/contractkit'
import { UnlockableWallet } from '@celo/wallet-base'
import AsyncStorage from '@react-native-community/async-storage'
import '@react-native-firebase/database'
import '@react-native-firebase/messaging'
import WalletConnectClient, { CLIENT_EVENTS } from '@walletconnect/client'
import { PairingTypes, SessionTypes } from '@walletconnect/types'
import { ERROR as WalletConnectErrors, ErrorType, getError } from '@walletconnect/utils'
import { EventChannel, eventChannel } from 'redux-saga'
import { call, put, select, take, takeEvery, takeLeading } from 'redux-saga/effects'
import { WalletConnectEvents } from 'src/analytics/Events'
import { WalletConnectPairingOrigin } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { walletConnectEnabledSelector } from 'src/app/selectors'
import { APP_NAME, WEB_LINK } from 'src/brandingConfig'
import networkConfig from 'src/geth/networkConfig'
import i18n from 'src/i18n'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { wrapSendTransactionWithRetry } from 'src/transactions/send'
import { newTransactionContext } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import {
  AcceptRequest,
  AcceptSession,
  Actions,
  clientInitialised,
  CloseSession,
  DenyRequest,
  DenySession,
  initialiseClient,
  InitialisePairing,
  initialisePairing,
  pairingCreated,
  pairingDeleted,
  pairingProposal,
  pairingUpdated,
  sessionCreated,
  sessionDeleted,
  SessionPayload,
  sessionPayload,
  SessionProposal,
  sessionProposal,
  sessionUpdated,
  WalletConnectActions,
} from 'src/walletConnect/actions'
import { SupportedActions } from 'src/walletConnect/constants'
import {
  selectHasPendingState,
  selectPendingActions,
  selectSessions,
} from 'src/walletConnect/selectors'
import { getContractKit, getWallet } from 'src/web3/contracts'
import { getWalletAddress, unlockAccount } from 'src/web3/saga'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'WalletConnect/saga'

let client: WalletConnectClient | null = null

function getDefaultSessionTrackedProperties(
  session: SessionTypes.Proposal | SessionTypes.Created | SessionTypes.Settled
) {
  const peer = 'proposer' in session ? session.proposer : session.peer
  const { name: dappName, url: dappUrl, description: dappDescription, icons } = peer.metadata
  const {
    blockchain: { chains: permissionsBlockchains },
    jsonrpc: { methods: permissionsJsonrpcMethods },
    notifications: { types: permissionsNotificationsTypes },
  } = session.permissions
  const { protocol: relayProtocol } = session.relay
  return {
    dappName,
    dappUrl,
    dappDescription,
    dappIcon: icons[0],
    permissionsBlockchains,
    permissionsJsonrpcMethods,
    permissionsNotificationsTypes,
    relayProtocol,
  }
}

function getDefaultRequestTrackedProperties(request: SessionTypes.RequestEvent) {
  const {
    id: requestId,
    jsonrpc: requestJsonrpc,
    method: requestMethod,
    params: requestParams,
  } = request.request
  return {
    requestChainId: request.chainId,
    requestId,
    requestJsonrpc,
    requestMethod,
    requestParams,
  }
}

function* getSessionFromRequest(request: SessionTypes.RequestEvent) {
  const { sessions }: { sessions: SessionTypes.Created[] } = yield select(selectSessions)
  const session = sessions.find((s) => s.topic === request.topic)
  if (!session) {
    // This should never happen
    throw new Error(`Unable to find WalletConnect session matching topic ${request.topic}`)
  }

  return session
}

export function* acceptSession({ session }: AcceptSession) {
  const defautTrackedProperties = getDefaultSessionTrackedProperties(session)
  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_session_approve_start, {
      ...defautTrackedProperties,
    })
    if (!client) {
      throw new Error('missing client')
    }

    const address: string = yield call(getWalletAddress)
    const response: SessionTypes.Response = {
      metadata: {
        name: APP_NAME,
        description: i18n.t('global:appDescription'),
        url: WEB_LINK,
        icons: [appendPath(WEB_LINK, '/favicon.ico')],
      },
      state: {
        accounts: [`${address}@celo:${networkConfig.networkId}`],
      },
    }

    yield call(client.approve.bind(client), { proposal: session, response })
    ValoraAnalytics.track(WalletConnectEvents.wc_session_approve_success, {
      ...defautTrackedProperties,
    })
  } catch (e) {
    Logger.debug(TAG + '@acceptSession', e.message)
    ValoraAnalytics.track(WalletConnectEvents.wc_session_approve_error, {
      ...defautTrackedProperties,
      error: e.message,
    })
  }

  yield call(handlePendingState)
}

export function* denySession({ session }: DenySession) {
  const defautTrackedProperties = getDefaultSessionTrackedProperties(session)
  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_session_reject_start, {
      ...defautTrackedProperties,
    })
    if (!client) {
      throw new Error('missing client')
    }
    yield call(client.reject.bind(client), {
      reason: getError(WalletConnectErrors.NOT_APPROVED),
      proposal: session,
    })
    ValoraAnalytics.track(WalletConnectEvents.wc_session_reject_success, {
      ...defautTrackedProperties,
    })
  } catch (e) {
    Logger.debug(TAG + '@denySession', e.message)
    ValoraAnalytics.track(WalletConnectEvents.wc_session_reject_error, {
      ...defautTrackedProperties,
      error: e.message,
    })
  }

  yield call(handlePendingState)
}

export function* closeSession({ session }: CloseSession) {
  const defautTrackedProperties = getDefaultSessionTrackedProperties(session)
  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_session_remove_start, {
      ...defautTrackedProperties,
    })
    if (!client) {
      throw new Error('missing client')
    }
    yield call(client.disconnect.bind(client), {
      topic: session.topic,
      reason: getError(WalletConnectErrors.USER_DISCONNECTED),
    })
    ValoraAnalytics.track(WalletConnectEvents.wc_session_remove_success, {
      ...defautTrackedProperties,
    })
  } catch (e) {
    Logger.debug(TAG + '@closeSession', e.message)
    ValoraAnalytics.track(WalletConnectEvents.wc_session_remove_error, {
      ...defautTrackedProperties,
      error: e.message,
    })
  }
}

function* handlePendingStateOrNavigateBack() {
  const hasPendingState: boolean = yield select(selectHasPendingState)
  if (hasPendingState) {
    yield call(handlePendingState)
  } else {
    navigateBack()
  }
}

export function* acceptRequest({ request }: AcceptRequest): any {
  const {
    request: { id, jsonrpc, method, params },
    topic,
  } = request

  const session: SessionTypes.Created = yield call(getSessionFromRequest, request)
  const defautTrackedProperties = {
    ...getDefaultSessionTrackedProperties(session),
    ...getDefaultRequestTrackedProperties(request),
  }

  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_request_accept_start, {
      ...defautTrackedProperties,
    })

    if (!client) {
      throw new Error('Missing client')
    }

    const account: string = yield select(currentAccountSelector)
    const wallet: UnlockableWallet = yield call(getWallet)

    let result: any
    let error: ErrorType | undefined
    try {
      yield call(unlockAccount, account)
      // Set `result` or `error` accordingly
      switch (method) {
        case SupportedActions.eth_signTransaction:
          result = (yield call(wallet.signTransaction.bind(wallet), params)) as EncodedTransaction
          break
        case SupportedActions.eth_signTypedData:
          result = yield call(wallet.signTypedData.bind(wallet), account, JSON.parse(params[1]))
          break
        case SupportedActions.personal_decrypt:
          result = yield call(wallet.decrypt.bind(wallet), account, Buffer.from(params[1]))
          break
        case SupportedActions.eth_sendTransaction:
          const kit: ContractKit = yield call(getContractKit)
          const normalizer = new TxParamsNormalizer(kit.connection)
          const tx: CeloTx = yield call(normalizer.populate.bind(normalizer), params)

          const sendTxMethod = function* (nonce?: number) {
            const txResult: TransactionResult = yield call(kit.connection.sendTransaction, {
              ...tx,
              nonce: nonce ?? tx.nonce,
            })
            return yield call(txResult.getHash.bind(txResult))
          }
          result = yield call(
            wrapSendTransactionWithRetry,
            sendTxMethod,
            newTransactionContext(TAG, 'WalletConnect/eth_sendTransaction')
          )
          break
        default:
          error = WalletConnectErrors.JSONRPC_REQUEST_METHOD_UNSUPPORTED
      }
    } catch (e) {
      Logger.debug(TAG + '@acceptRequest error obtaining result: ', e.message)
      error = WalletConnectErrors.GENERIC
    }
    const partialResponse = { id, jsonrpc }
    const response =
      result !== undefined
        ? { ...partialResponse, result }
        : { ...partialResponse, error: getError(error!) }

    yield call(client.respond.bind(client), {
      topic,
      response,
    })
    if (error) {
      ValoraAnalytics.track(WalletConnectEvents.wc_request_accept_error, {
        ...defautTrackedProperties,
        error,
      })
    } else {
      ValoraAnalytics.track(WalletConnectEvents.wc_request_accept_success, {
        ...defautTrackedProperties,
      })
    }
  } catch (e) {
    Logger.debug(TAG + '@acceptRequest', e.message)
    ValoraAnalytics.track(WalletConnectEvents.wc_request_accept_error, {
      ...defautTrackedProperties,
      error: e.message,
    })
  }

  yield call(handlePendingStateOrNavigateBack)
}

export function* denyRequest({ request }: DenyRequest) {
  const {
    request: { id, jsonrpc },
    topic,
  } = request

  const session: SessionTypes.Created = yield call(getSessionFromRequest, request)
  const defautTrackedProperties = {
    ...getDefaultSessionTrackedProperties(session),
    ...getDefaultRequestTrackedProperties(request),
  }

  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_request_deny_start, {
      ...defautTrackedProperties,
    })

    if (!client) {
      throw new Error('Missing client')
    }

    yield call(client.respond.bind(client), {
      topic,
      response: {
        id,
        jsonrpc,
        error: getError(WalletConnectErrors.DISAPPROVED_JSONRPC),
      },
    })
    ValoraAnalytics.track(WalletConnectEvents.wc_request_deny_success, {
      ...defautTrackedProperties,
    })
  } catch (e) {
    Logger.debug(TAG + '@denyRequest', e.message)
    ValoraAnalytics.track(WalletConnectEvents.wc_request_deny_error, {
      ...defautTrackedProperties,
      error: e.message,
    })
  }

  yield call(handlePendingStateOrNavigateBack)
}

export function* handleInitialiseWalletConnect() {
  const walletConnectChannel: EventChannel<WalletConnectActions> = yield call(
    createWalletConnectChannel
  )
  while (true) {
    const message: WalletConnectActions = yield take(walletConnectChannel)
    yield put(message)
  }
}

export function* createWalletConnectChannel() {
  if (!client) {
    Logger.debug(TAG + '@createWalletConnectChannel', `init start`)
    client = yield call(WalletConnectClient.init as any, {
      relayProvider: networkConfig.walletConnectEndpoint,
      storageOptions: {
        asyncStorage: AsyncStorage,
      },
      logger: 'error',
      controller: true,
    })
    Logger.debug(TAG + '@createWalletConnectChannel', `init end`)
    yield put(clientInitialised())
  }

  return eventChannel((emit: any) => {
    const onSessionProposal = (session: SessionTypes.Proposal) => emit(sessionProposal(session))
    const onSessionCreated = (session: SessionTypes.Created) => emit(sessionCreated(session))
    const onSessionUpdated = (session: SessionTypes.UpdateParams) => emit(sessionUpdated(session))
    const onSessionDeleted = (session: SessionTypes.DeleteParams) => emit(sessionDeleted(session))
    const onSessionRequest = (request: SessionTypes.RequestEvent) => emit(sessionPayload(request))

    const onPairingProposal = (pairing: PairingTypes.ProposeParams) =>
      emit(pairingProposal(pairing))
    const onPairingCreated = (pairing: PairingTypes.CreateParams) => emit(pairingCreated(pairing))
    const onPairingUpdated = (pairing: PairingTypes.UpdateParams) => emit(pairingUpdated(pairing))
    const onPairingDeleted = (pairing: PairingTypes.DeleteParams) => emit(pairingDeleted(pairing))

    if (!client) {
      return () => {
        Logger.debug(TAG + '@createWalletConnectChannel', 'missing client clean up')
      }
    }

    client.on(CLIENT_EVENTS.session.proposal, onSessionProposal)
    client.on(CLIENT_EVENTS.session.created, onSessionCreated)
    client.on(CLIENT_EVENTS.session.updated, onSessionUpdated)
    client.on(CLIENT_EVENTS.session.deleted, onSessionDeleted)
    client.on(CLIENT_EVENTS.session.request, onSessionRequest)

    client.on(CLIENT_EVENTS.pairing.proposal, onPairingProposal)
    client.on(CLIENT_EVENTS.pairing.created, onPairingCreated)
    client.on(CLIENT_EVENTS.pairing.updated, onPairingUpdated)
    client.on(CLIENT_EVENTS.pairing.deleted, onPairingDeleted)

    return () => {
      if (!client) {
        Logger.debug(TAG + '@createWalletConnectChannel', 'clean up but missing client')
        return
      }

      Logger.debug(TAG + '@createWalletConnectChannel', 'clean up')

      client.off(CLIENT_EVENTS.session.proposal, onSessionProposal)
      client.off(CLIENT_EVENTS.session.created, onSessionCreated)
      client.off(CLIENT_EVENTS.session.updated, onSessionUpdated)
      client.off(CLIENT_EVENTS.session.deleted, onSessionDeleted)
      client.off(CLIENT_EVENTS.session.request, onSessionRequest)

      client.off(CLIENT_EVENTS.pairing.proposal, onPairingProposal)
      client.off(CLIENT_EVENTS.pairing.created, onPairingCreated)
      client.off(CLIENT_EVENTS.pairing.updated, onPairingUpdated)
      client.off(CLIENT_EVENTS.pairing.deleted, onPairingDeleted)

      const reason = getError(WalletConnectErrors.EXPIRED)
      client.session.topics.map((topic) => client!.disconnect({ reason, topic }))
      client.pairing.topics.map((topic) => client!.pairing.delete({ topic, reason }))
      client = null
    }
  })
}

export function* showSessionRequest(session: SessionTypes.Proposal) {
  ValoraAnalytics.track(WalletConnectEvents.wc_session_propose, {
    ...getDefaultSessionTrackedProperties(session),
  })

  yield call(navigate, Screens.WalletConnectSessionRequest, { session })
}

export function* showActionRequest(request: SessionTypes.RequestEvent) {
  const session: SessionTypes.Created = yield call(getSessionFromRequest, request)
  ValoraAnalytics.track(WalletConnectEvents.wc_request_propose, {
    ...getDefaultSessionTrackedProperties(session),
    ...getDefaultRequestTrackedProperties(request),
  })

  yield call(navigate, Screens.WalletConnectActionRequest, { request })
}

/**
 * When handling incoming requests (actions or sessions) we need to handle
 * them in order. That means if a request comes in, and we already have a
 * pending one, ignore it. Once a request is dealt with we handle the new
 * requests accordingly.
 */

export function* handleIncomingSessionRequest({ session }: SessionProposal) {
  const { pending }: { pending: SessionTypes.Proposal[] } = yield select(selectSessions)
  if (pending.length > 1) {
    return
  }

  yield call(showSessionRequest, session)
}
export function* handleIncomingActionRequest({ request }: SessionPayload) {
  const pendingActions: SessionTypes.RequestEvent[] = yield select(selectPendingActions)
  if (pendingActions.length > 1) {
    return
  }

  navigate(Screens.WalletConnectActionRequest, { request })
}

export function* handleInitialisePairing({ uri, origin }: InitialisePairing) {
  try {
    ValoraAnalytics.track(WalletConnectEvents.wc_pairing_start, {
      origin,
    })
    if (!client) {
      throw new Error(`missing client`)
    }

    Logger.debug(TAG + '@handleInitialisePairing', 'pair start')
    yield call(client.pair.bind(client), { uri })
    Logger.debug(TAG + '@handleInitialisePairing', 'pair end')
    ValoraAnalytics.track(WalletConnectEvents.wc_pairing_success)
  } catch (e) {
    Logger.debug(TAG + '@handleInitialisePairing', e.message)
    ValoraAnalytics.track(WalletConnectEvents.wc_pairing_error, { error: e.message })
  }
}

function* handlePendingState(): any {
  const {
    pending: [session],
  }: { pending: SessionTypes.Proposal[] } = yield select(selectSessions)
  if (session) {
    yield call(showSessionRequest, session)
    return
  }

  const [request] = yield select(selectPendingActions)
  if (request) {
    yield call(showActionRequest, request)
  }
}

function* checkPersistedState(): any {
  const hasPendingState = yield select(selectHasPendingState)
  if (hasPendingState) {
    yield put(initialiseClient())
    yield call(handlePendingState)
    return
  }

  const { sessions }: { sessions: SessionTypes.Created[] } = yield select(selectSessions)
  if (sessions.length) {
    yield put(initialiseClient())
  }
}

export function* walletConnectSaga() {
  yield takeLeading(Actions.INITIALISE_CLIENT, handleInitialiseWalletConnect)
  yield takeEvery(Actions.INITIALISE_PAIRING, handleInitialisePairing)

  yield takeEvery(Actions.ACCEPT_SESSION, acceptSession)
  yield takeEvery(Actions.DENY_SESSION, denySession)
  yield takeEvery(Actions.CLOSE_SESSION, closeSession)
  yield takeEvery(Actions.ACCEPT_REQUEST, acceptRequest)
  yield takeEvery(Actions.DENY_REQUEST, denyRequest)

  yield takeEvery(Actions.SESSION_PROPOSAL, handleIncomingSessionRequest)
  yield takeEvery(Actions.SESSION_PAYLOAD, handleIncomingActionRequest)

  yield call(checkPersistedState)
}

export function* initialiseWalletConnect(uri: string, origin: WalletConnectPairingOrigin) {
  const walletConnectEnabled: boolean = yield select(walletConnectEnabledSelector)
  if (!walletConnectEnabled) {
    return
  }

  if (!client) {
    yield put(initialiseClient())
    yield take(Actions.CLIENT_INITIALISED)
  }
  yield put(initialisePairing(uri, origin))
}

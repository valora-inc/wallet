import { appendPath } from '@celo/utils/lib/string'
import '@react-native-firebase/database'
import '@react-native-firebase/messaging'
import SignClient from '@walletconnect/sign-client'
import { SignClientTypes } from '@walletconnect/types'
import { getSdkError } from '@walletconnect/utils'
import { EventChannel, eventChannel } from 'redux-saga'
import { call, put, take, takeLeading } from 'redux-saga/effects'
import { WalletConnectPairingOrigin } from 'src/analytics/types'
import { APP_NAME, WEB_LINK } from 'src/brandingConfig'
import i18n from 'src/i18n'
import Logger from 'src/utils/Logger'
import {
  Actions,
  clientInitialised,
  initialiseClient,
  initialisePairing,
  sessionCreated,
  sessionDeleted,
  sessionPayload,
  sessionProposal,
  sessionUpdated,
  WalletConnectActions,
} from 'src/walletConnect/v2/actions'
import networkConfig from 'src/web3/networkConfig'

let client: SignClient | null = null

const TAG = 'WalletConnect/saga'

function* handleInitialiseWalletConnect() {
  const walletConnectChannel: EventChannel<WalletConnectActions> = yield call(
    createWalletConnectChannel
  )
  while (true) {
    const message: WalletConnectActions = yield take(walletConnectChannel)
    yield put(message)
  }
}

function* createWalletConnectChannel() {
  if (!client) {
    Logger.debug(TAG + '@createWalletConnectChannel', `init start`)

    client = yield call([SignClient, 'init'], {
      logger: 'debug',
      // TODO get proper project ID - having issues setting up a valora
      // walletconnect account
      // is this a secret or env variable?
      // https://docs.walletconnect.com/2.0/advanced/relay-server
      projectId: '906f08083218680fedb1502f372b0b35',
      relayUrl: networkConfig.walletConnectEndpoint,
      metadata: {
        name: APP_NAME,
        description: i18n.t('appDescription'),
        url: WEB_LINK,
        icons: [appendPath(WEB_LINK, '/favicon.ico')],
      },
    })

    Logger.debug(TAG + '@createWalletConnectChannel', `init end`)
    yield put(clientInitialised())
  }

  return eventChannel((emit: any) => {
    const onSessionProposal = (session: SignClientTypes.EventArguments['session_proposal']) => {
      emit(sessionProposal(session))
    }

    const onSessionCreated = (sessionEvent: SignClientTypes.EventArguments['session_event']) => {
      const { topic } = sessionEvent
      const session = client!.session.get(topic)
      emit(sessionCreated(session))
    }
    const onSessionUpdated = (session: SignClientTypes.EventArguments['session_update']) => {
      emit(sessionUpdated(session))
    }
    const onSessionDeleted = (session: SignClientTypes.EventArguments['session_delete']) => {
      emit(sessionDeleted(session))
    }
    const onSessionRequest = (request: SignClientTypes.EventArguments['session_request']) => {
      emit(sessionPayload(request))
    }

    if (!client) {
      return () => {
        Logger.debug(TAG + '@createWalletConnectChannel', 'missing client clean up')
      }
    }

    client.on('session_proposal', onSessionProposal)
    client.on('session_event', onSessionCreated)
    client.on('session_update', onSessionUpdated)
    client.on('session_delete', onSessionDeleted)
    client.on('session_request', onSessionRequest)

    return async () => {
      if (!client) {
        Logger.debug(TAG + '@createWalletConnectChannel', 'clean up but missing client')
        return
      }

      Logger.debug(TAG + '@createWalletConnectChannel', 'clean up')

      client.off('session_proposal', onSessionProposal)
      client.off('session_event', onSessionCreated)
      client.off('session_update', onSessionUpdated)
      client.off('session_delete', onSessionDeleted)
      client.off('session_request', onSessionRequest)

      const connections = client.pairing.values
      await Promise.all(
        connections.map((connection) =>
          client!.disconnect({ topic: connection.topic, reason: getSdkError('USER_DISCONNECTED') })
        )
      )

      client = null
    }
  })
}

export function* walletConnectV2Saga() {
  yield takeLeading(Actions.INITIALISE_CLIENT_V2, handleInitialiseWalletConnect)
}

export function* initialiseWalletConnectV2(uri: string, origin: WalletConnectPairingOrigin) {
  if (!client) {
    yield put(initialiseClient())
    yield take(Actions.CLIENT_INITIALISED_V2)
  }
  yield put(initialisePairing(uri, origin))
}

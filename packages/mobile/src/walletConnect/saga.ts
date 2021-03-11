import { GenesisBlockUtils } from '@celo/network-utils'
import AsyncStorage from '@react-native-community/async-storage'
import '@react-native-firebase/database'
import '@react-native-firebase/messaging'
import WalletConnectClient, { CLIENT_EVENTS } from '@walletconnect/client'
import { PairingTypes, SessionTypes } from '@walletconnect/types'
import { call, put, select } from 'redux-saga/effects'
import { readGenesisBlockFile } from 'src/geth/geth'
import networkConfig from 'src/geth/networkConfig'
import Logger from 'src/utils/Logger'
import {
  clientInitialised,
  pairingCreated,
  pairingDeleted,
  pairingProposal,
  pairingUpdated,
  sessionCreated,
  sessionDeleted,
  sessionPayload,
  sessionProposal,
  sessionUpdated,
} from 'src/walletConnect/actions'
import { getWalletConnectClient } from 'src/walletConnect/selectors'
import { getAccountAddress } from 'src/web3/saga'

const TAG = 'WalletConnect/saga'

export function* acceptSession(proposal: SessionTypes.Proposal) {
  const { nodeDir } = networkConfig
  const genesis: string = yield call(readGenesisBlockFile, nodeDir)
  const networkId: number = GenesisBlockUtils.getChainIdFromGenesis(genesis)

  const account = yield select(getAccountAddress)
  const client = yield select(getWalletConnectClient)

  const response: SessionTypes.Response = {
    metadata: {
      name: 'Valora',
      description: 'A mobile payments wallet that works worldwide',
      url: 'https://valoraapp.com',
      icons: ['https://valoraapp.com/favicon.ico'],
    },
    state: {
      accounts: [`${account}@celo:${networkId}`],
    },
  }

  client.approve({ proposal, response })
}

export function* initialiseClient(uri: string) {
  async function implementation() {
    Logger.debug(TAG + '@initialiseClient', `Establishing connection`)
    const client: WalletConnectClient = await WalletConnectClient.init({
      relayProvider: 'wss://bridge.walletconnect.org/',

      storageOptions: {
        asyncStorage: AsyncStorage,
      },
    })
    Logger.debug(TAG + '@initialiseClient', `Connection initialised`)

    client.on(CLIENT_EVENTS.session.proposal, (session: SessionTypes.Proposal) => {
      console.log('proposal', session)
      put(sessionProposal(session))
      // navigate(Screens.WalletConnectSessionRequest)
    })
    client.on(CLIENT_EVENTS.session.created, (session: SessionTypes.Created) => {
      console.log('created', session)
      put(sessionCreated(session))
    })
    client.on(CLIENT_EVENTS.session.updated, (session: SessionTypes.Update) => {
      console.log('updated', session)
      put(sessionUpdated(session))
    })
    client.on(CLIENT_EVENTS.session.deleted, (session: SessionTypes.DeleteParams) => {
      console.log('deleted', session)
      put(sessionDeleted(session))
    })
    client.on(CLIENT_EVENTS.session.payload, (payload: SessionTypes.PayloadEvent) => {
      console.log('payload', payload)
      put(sessionPayload(payload))
    })

    client.on('error', (data: any) => console.log('error', data))

    client.on(CLIENT_EVENTS.pairing.proposal, (pairing: PairingTypes.Proposal) => {
      console.log('proposal', pairing)
      put(pairingProposal(pairing))
    })
    client.on(CLIENT_EVENTS.pairing.created, (pairing: PairingTypes.Created) => {
      console.log('created', pairing)
      put(pairingCreated(pairing))
    })
    client.on(CLIENT_EVENTS.pairing.updated, (pairing: PairingTypes.Update) => {
      console.log('updated', pairing)
      put(pairingUpdated(pairing))
    })
    client.on(CLIENT_EVENTS.pairing.deleted, (pairing: PairingTypes.DeleteParams) => {
      console.log('deleted', pairing)
      put(pairingDeleted(pairing))
    })

    console.log('pairing start')
    await client.pair({ uri })
    console.log('pairing end')
    put(clientInitialised(client))
  }

  yield call(implementation)

  try {
    const onSessionPayload = async (event: SessionTypes.PayloadEvent) => {
      const {
        topic,
        // @ts-ignore todo: ask Pedro why this isn't typed
        payload: { id, method },
      } = event

      let result: any

      // if (method === SupportedMethods.personalSign) {
      //   const { payload, from } = parsePersonalSign(event)
      //   result = await wallet.signPersonalMessage(from, payload)
      // } else if (method === SupportedMethods.signTypedData) {
      //   const { from, payload } = parseSignTypedData(event)
      //   result = await wallet.signTypedData(from, payload)
      // } else if (method === SupportedMethods.signTransaction) {
      //   const tx = parseSignTransaction(event)
      //   result = await wallet.signTransaction(tx)
      // } else if (method === SupportedMethods.computeSharedSecret) {
      //   const { from, publicKey } = parseComputeSharedSecret(event)
      //   result = (await wallet.computeSharedSecret(from, publicKey)).toString('hex')
      // } else if (method === SupportedMethods.decrypt) {
      //   const { from, payload } = parseDecrypt(event)
      //   result = (await wallet.decrypt(from, payload)).toString('hex')
      // } else {
      //   // client.reject({})
      //   // in memory wallet should always approve actions
      //   debug('unknown method', method)
      //   return
      // }

      // return client.respond({
      //   topic,
      //   response: {
      //     id,
      //     jsonrpc: '2.0',
      //     result,
      //   },
      // })
    }
  } catch (e) {
    console.log('>>>', e)
  }

  // console.log(client.pair, { uri })
  // yield call(client.pair, { uri })
  // console.log('pairing end')
}

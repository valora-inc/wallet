import NodeDetailManager from '@toruslabs/fetch-node-details'
import Torus from '@toruslabs/torus.js'
import { jwtDecode } from 'jwt-decode'
import { TORUS_NETWORK, WEB3AUTH_CLIENT_ID } from 'src/config'
import Logger from 'src/utils/Logger'

const TAG = 'keylessBackup/torus'

export async function getTorusPrivateKey({ verifier, jwt }: { verifier: string; jwt: string }) {
  // largely copied from CustomAuth triggerLogin
  Logger.debug(TAG, `decoding jwt ${jwt}`)
  const sub = jwtDecode<{ sub: string }>(jwt).sub
  const nodeDetailManager = new NodeDetailManager({
    network: TORUS_NETWORK,
  })
  const torus = new Torus({
    legacyMetadataHost: 'https://metadata.tor.us',
    network: TORUS_NETWORK,
    clientId: WEB3AUTH_CLIENT_ID,
  })
  Logger.debug(TAG, `getting node details for verifier ${verifier} and sub ${sub}`)
  const { torusNodeEndpoints, torusNodePub, torusIndexes } = await nodeDetailManager.getNodeDetails(
    {
      verifier,
      verifierId: sub,
    }
  )
  Logger.debug(
    TAG,
    `getting public address with torusNodeEndpoints ${JSON.stringify(torusNodeEndpoints)}`
  )
  const torusPubKey = await torus.getPublicAddress(torusNodeEndpoints, torusNodePub, {
    verifier,
    verifierId: sub,
  })
  Logger.debug(TAG, `getting shares with torusPubKey ${JSON.stringify(torusPubKey)}`)
  const shares = await torus.retrieveShares(
    torusNodeEndpoints,
    torusIndexes,
    verifier,
    { verifier_id: sub },
    jwt
  )
  Logger.debug(TAG, `got shares of private key`)
  const sharesEthAddressLower = shares.finalKeyData.evmAddress?.toLowerCase()
  if (sharesEthAddressLower !== torusPubKey.finalKeyData.evmAddress.toLowerCase()) {
    throw new Error('sharesEthAddressLower does not match torusPubKey')
  }
  if (!shares.finalKeyData.privKey) {
    throw new Error('private key missing from share data')
  }
  return shares.finalKeyData.privKey
}

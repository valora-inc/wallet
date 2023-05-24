import NodeDetailManager from '@toruslabs/fetch-node-details'
import { TORUS_SAPPHIRE_NETWORK_TYPE } from '@toruslabs/constants'
import Torus from '@toruslabs/torus.js'
import jwtDecode from 'jwt-decode'
import Logger from 'src/utils/Logger'

const TAG = 'keylessBackup/web3auth'

// TODO consider getting network from statsig dynamic config (need to make sure the keys are the same for different networks first though)

/**
 * Get a Torus private key from a JWT.
 *
 * Largely copies web3auth's "customauth" library for the browser, cherry-picking stuff specific to our use case and
 *  working around browser-specific stuff. An alternative would be to use customauth-react-native-sdk, but this wraps
 *  native SDK's and did not appear to work.
 *
 * @param verifier - string name of web3auth custom verifier
 * @param jwt - idToken from Sign in with Google flow works. must have issuer expected by the verifier
 * @param network - web3auth network to use
 */
export async function getTorusPrivateKey({
  verifier,
  jwt,
  network,
}: {
  verifier: string
  jwt: string
  network: TORUS_SAPPHIRE_NETWORK_TYPE
}) {
  // largely copied from CustomAuth triggerLogin
  Logger.debug(TAG, `decoding jwt ${jwt}`)
  const sub = jwtDecode<{ sub: string }>(jwt).sub
  const nodeDetailManager = new NodeDetailManager({
    network,
  })
  const torus = new Torus({
    enableOneKey: false, // same as default from CustomAuth
    network,
    clientId: 'web3auth-project-client-id', // TODO get from web3auth dashboard (see plug and play section)
  })
  Logger.debug(TAG, `getting node details for verifier ${verifier} and sub ${sub}`)
  const { torusNodeEndpoints } = await nodeDetailManager.getNodeDetails({
    verifier,
    verifierId: sub,
  })
  Logger.debug(
    TAG,
    `getting public address with torusNodeEndpoints ${JSON.stringify(torusNodeEndpoints)}`
  )
  const torusPubKey = await torus.getPublicAddress(torusNodeEndpoints, {
    verifier,
    verifierId: sub,
  })
  Logger.debug(TAG, `getting shares with torusPubKey ${JSON.stringify(torusPubKey)}`)
  // if (typeof torusPubKey === 'string') throw new Error('must use extended pub key')  // todo check if this error is needed. CustomAuth has it, unclear why. While testing it got thrown. But ignoring it seems to work fine...
  const shares = await torus.retrieveShares(torusNodeEndpoints, verifier, { verifier_id: sub }, jwt)
  Logger.debug(TAG, `got shares ${JSON.stringify(shares)}`)
  const sharesEthAddressLower = shares.ethAddress.toLowerCase()
  if (
    typeof torusPubKey === 'string'
      ? sharesEthAddressLower !== torusPubKey.toLowerCase()
      : sharesEthAddressLower !== torusPubKey.address.toLowerCase()
  ) {
    throw new Error('sharesEthAddressLower does not match torusPubKey')
  }
  return shares.privKey.toString()
}

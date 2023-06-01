import NodeDetailManager from '@toruslabs/fetch-node-details'
import Torus from '@toruslabs/torus.js'
import jwtDecode from 'jwt-decode'
import Logger from 'src/utils/Logger'

const TAG = 'cloudbackup/index'

export async function getTorusPrivateKey({ verifier, jwt }: { verifier: string; jwt: string }) {
  // largely copied from CustomAuth triggerLogin
  Logger.debug(TAG, `decoding jwt ${jwt}`)
  const sub = jwtDecode<{ email: string }>(jwt).email
  const nodeDetailManager = new NodeDetailManager({
    network: 'sapphire_devnet', // todo get from config
  })
  const torus = new Torus({
    enableOneKey: false, // same as default from CustomAuth
    clientId:
      'BL4w3xidoJeJ5SIdGfFklpnJ4H36FcE6CQMCqwk6J_SdkA-WKtlJLMfqeSKGtsn8KbBsGY2h825eRH_a_hel2gI', // todo get from config
    network: 'sapphire_devnet', // todo get from config
  })
  Logger.debug(TAG, `getting node details for verifier ${verifier} and sub ${sub}`)
  const { torusNodeEndpoints } = await nodeDetailManager.getNodeDetails({
    verifier,
    verifierId: sub,
  }) // fixme times out here
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
  const shares = await torus.retrieveShares(
    torusNodeEndpoints,
    // torusIndexes,
    verifier,
    { verifier_id: sub },
    jwt
  )
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

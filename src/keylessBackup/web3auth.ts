import NodeDetailManager, { TORUS_NETWORK, TORUS_NETWORK_TYPE } from '@toruslabs/fetch-node-details'
import Torus from '@toruslabs/torus.js'
import jwtDecode from 'jwt-decode'
import Logger from 'src/utils/Logger'

const NetworkToContractAddress: Record<TORUS_NETWORK_TYPE, string> = {
  [TORUS_NETWORK.MAINNET]: NodeDetailManager.PROXY_ADDRESS_MAINNET,
  [TORUS_NETWORK.TESTNET]: NodeDetailManager.PROXY_ADDRESS_TESTNET,
  [TORUS_NETWORK.CYAN]: NodeDetailManager.PROXY_ADDRESS_CYAN,
  [TORUS_NETWORK.AQUA]: NodeDetailManager.PROXY_ADDRESS_AQUA,
  [TORUS_NETWORK.CELESTE]: NodeDetailManager.PROXY_ADDRESS_CELESTE,
}

const SIGNER_MAP: Record<TORUS_NETWORK_TYPE, string> = {
  [TORUS_NETWORK.MAINNET]: 'https://signer.tor.us',
  [TORUS_NETWORK.TESTNET]: 'https://signer.tor.us',
  [TORUS_NETWORK.CYAN]: 'https://signer-polygon.tor.us',
  [TORUS_NETWORK.AQUA]: 'https://signer-polygon.tor.us',
  [TORUS_NETWORK.CELESTE]: 'https://signer-polygon.tor.us',
}

const TAG = 'keylessBackup/torus'

export async function getTorusPrivateKey({ verifier, jwt }: { verifier: string; jwt: string }) {
  const network = 'testnet' // todo get from config
  // largely copied from CustomAuth triggerLogin
  Logger.debug(TAG, `decoding jwt ${jwt}`)
  const sub = jwtDecode<{ sub: string }>(jwt).sub
  const nodeDetailManager = new NodeDetailManager({
    network,
    proxyAddress: NetworkToContractAddress[network],
  })
  const torus = new Torus({
    enableOneKey: false, // same as default from CustomAuth
    metadataHost: 'https://metadata.tor.us',
    allowHost: `${SIGNER_MAP[network]}/api/allow`,
    signerHost: `${SIGNER_MAP[network]}/api/sign`,
    network,
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
  // if (typeof torusPubKey === 'string') throw new Error('must use extended pub key')  // todo check if this error is needed. CustomAuth has it, unclear why. While testing it got thrown. But ignoring it seems to work fine...
  const shares = await torus.retrieveShares(
    torusNodeEndpoints,
    torusIndexes,
    verifier,
    { verifier_id: sub },
    jwt
  )
  // Logger.debug(TAG, `got shares ${JSON.stringify(shares)}`)
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

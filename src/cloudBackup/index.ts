import NodeDetailManager, { TORUS_NETWORK } from '@toruslabs/fetch-node-details'
import Torus from '@toruslabs/torus.js'
import jwtDecode from 'jwt-decode'
import Logger from 'src/utils/Logger'

type TorusNetwork = 'mainnet' | 'testnet' | 'cyan' | 'aqua' | 'celeste'

const NetworkToContractAddress: Record<TorusNetwork, string> = {
  [TORUS_NETWORK.MAINNET]: NodeDetailManager.PROXY_ADDRESS_MAINNET,
  [TORUS_NETWORK.TESTNET]: NodeDetailManager.PROXY_ADDRESS_TESTNET,
  [TORUS_NETWORK.CYAN]: NodeDetailManager.PROXY_ADDRESS_CYAN,
  [TORUS_NETWORK.AQUA]: NodeDetailManager.PROXY_ADDRESS_AQUA,
  [TORUS_NETWORK.CELESTE]: NodeDetailManager.PROXY_ADDRESS_CELESTE,
}

// const SIGNER_MAP: Record<TorusNetwork, string> = {
//   [TORUS_NETWORK.MAINNET]: "https://signer.tor.us",
//   [TORUS_NETWORK.TESTNET]: "https://signer.tor.us",
//   [TORUS_NETWORK.CYAN]: "https://signer-polygon.tor.us",
//   [TORUS_NETWORK.AQUA]: "https://signer-polygon.tor.us",
//   [TORUS_NETWORK.CELESTE]: "https://signer-polygon.tor.us",
// }

const TAG = 'cloudbackup/index'

export async function getTorusPrivateKey({
  verifier,
  jwt,
  network,
}: {
  verifier: string
  jwt: string
  network: TorusNetwork
}) {
  Logger.debug(TAG, `decoding jwt ${jwt}`)
  const sub = jwtDecode<{ sub: string }>(jwt).sub
  const nodeDetailManager = new NodeDetailManager({
    network,
    proxyAddress: NetworkToContractAddress[network],
  })
  const torus = new Torus({
    enableOneKey: false, // same as default from CustomAuth
    metadataHost: 'https://metadata.tor.us',
    // allowHost: `${SIGNER_MAP[network]}/api/allow`,
    // signerHost: `${SIGNER_MAP[network]}/api/sign`,
    network,
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
  }) // fixme getting this error: node results do not match at first lookup {}, {"code":-32601,"message":"Method not found"} in getPublicAddress
  Logger.debug(TAG, `getting shares with torusPubKey ${JSON.stringify(torusPubKey)}`)
  if (typeof torusPubKey === 'string') throw new Error('must use extended pub key')
  const shares = await torus.retrieveShares(torusNodeEndpoints, verifier, { verifier_id: sub }, jwt)
  Logger.debug(TAG, `got shares ${JSON.stringify(shares)}`)
  if (shares.ethAddress.toLowerCase() !== torusPubKey.address.toLowerCase()) {
    throw new Error('data ethAddress does not match response address')
  }
  return shares.privKey.toString()
}

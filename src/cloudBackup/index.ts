import NodeDetailManager, { TORUS_NETWORK } from '@toruslabs/fetch-node-details'
import Torus from '@toruslabs/torus.js'

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

export async function getTorusPrivateKey({
  verifier,
  sub,
  jwtParams: { idToken },
  network,
}: {
  verifier: string
  sub: string // todo eventually get this from the jwt
  clientId: string
  jwtParams: {
    idToken: string
  }
  network: TorusNetwork
}) {
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
  const { torusNodeEndpoints } = await nodeDetailManager.getNodeDetails({
    verifier,
    verifierId: sub,
  })
  const torusPubKey = await torus.getPublicAddress(torusNodeEndpoints, {
    verifier,
    verifierId: sub,
  })
  if (typeof torusPubKey === 'string') throw new Error('must use extended pub key')
  const verifierParams = { verifier_id: sub, id_token: idToken } // todo test
  const shares = await torus.retrieveShares(torusNodeEndpoints, verifier, verifierParams, idToken)
  if (shares.ethAddress.toLowerCase() !== torusPubKey.address.toLowerCase()) {
    throw new Error('data ethAddress does not match response address')
  }
  return shares.privKey.toString()
}

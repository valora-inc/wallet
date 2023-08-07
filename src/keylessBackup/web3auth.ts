import jwtDecode from 'jwt-decode'
import Logger from 'src/utils/Logger'
import { TORUS_NETWORK, TORUS_SIGNER_BASE_URL } from 'src/config'

const TAG = 'keylessBackup/torus'

// TODO update to use the latest Torus/Web3Auth API https://linear.app/valora/issue/ACT-876/refactor-gettorusprivatekey-to-use-updated-torusweb3auth-dependencies
export async function getTorusPrivateKey({ verifier, jwt }: { verifier: string; jwt: string }) {
  // these imports have side effects for our tests (they break fetch mocking) so we cannot do it at the top level
  const Torus = require('@toruslabs/torus.js')
  const NodeDetailManager = require('@toruslabs/fetch-node-details')
  // largely copied from CustomAuth triggerLogin
  Logger.debug(TAG, `decoding jwt ${jwt}`)
  const sub = jwtDecode<{ sub: string }>(jwt).sub
  const nodeDetailManager = new NodeDetailManager({
    network: TORUS_NETWORK,
    proxyAddress:
      TORUS_NETWORK === 'cyan'
        ? NodeDetailManager.PROXY_ADDRESS_CYAN
        : NodeDetailManager.PROXY_ADDRESS_TESTNET,
  })
  const torus = new Torus({
    enableOneKey: false, // same as default from CustomAuth
    metadataHost: 'https://metadata.tor.us',
    allowHost: `${TORUS_SIGNER_BASE_URL}/api/allow`,
    signerHost: `${TORUS_SIGNER_BASE_URL}/api/sign`,
    network: TORUS_NETWORK,
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

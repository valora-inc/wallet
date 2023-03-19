import NodeDetailManager, { TORUS_NETWORK } from '@toruslabs/fetch-node-details'
import Torus from '@toruslabs/torus.js'
import jwtDecode from 'jwt-decode'
import Logger from 'src/utils/Logger'
import { TORUS_NETWORK_TYPE } from '@toruslabs/fetch-node-details'
import ThresholdKey from '@tkey/default'
import { BN } from 'ethereumjs-util'
import { ecCurve } from '@tkey/common-types'

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

const TAG = 'cloudbackup/index'

export async function getTorusPrivateKey({
  verifier,
  jwt,
  network,
}: {
  verifier: string
  jwt: string
  network: TORUS_NETWORK_TYPE
}) {
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

import { Share, ShareStore } from '@tkey/common-types'
import { StringifiedType } from '@tkey/common-types/src/baseTypes/commonTypes'

export async function generateNewShareWithPrivateKey(
  tKey: ThresholdKey,
  privateKey: BN,
  shareName: string
) {
  // largely copied from SecurityQuestionsModule, see generateNewShareWithSecurityQuestions
  const metadata = tKey.getMetadata()
  const existingStore = metadata.getGeneralStoreDomain(shareName)
  if (existingStore) {
    throw new Error(`Share with name ${shareName} already exists`)
  }
  const newShareDetails = await tKey.generateNewShare() // todo might be able to input privateKey with useTSS=true, but unsure what the other implications of useTSS are
  const newShareStore =
    newShareDetails.newShareStores[newShareDetails.newShareIndex.toString('hex')]

  const nonce = newShareStore.share.share.sub(privateKey).umod(ecCurve.curve.n) // todo check if this works
  const pkStore = new ShareStore(
    new Share(newShareStore.share.shareIndex, nonce),
    newShareStore.polynomialID
  )
  metadata.setGeneralStoreDomain(shareName, pkStore)
  await tKey._syncShareMetadata() // todo check if this is needed
  return newShareDetails
}

// fixme this seems like it would only work as an optional MFA factor, not as a substitute for the "postboxKey" share if the user loses access to that
//  one hacky workaround could be to enter a dummy postBoxKey and enter their other 2 "real" shares with this API.
//  seems like this is something they should have thought of when implementing the SecurityQuestions module (and possibly others), so we can probly
//  ask them for more info on how account recovery is supposed to work for cases where social recovery is not possible
export async function inputShareFromPrivateKey(
  tKey: ThresholdKey,
  privateKey: BN,
  shareName: string
) {
  // largely copied from SecurityQuestionsModule, see inputShareFromSecurityQuestions
  const metadata = tKey.getMetadata()
  const rawStore = metadata.getGeneralStoreDomain(shareName)
  if (!rawStore) {
    throw new Error(`Share with name ${shareName} does not exist`)
  }
  const existingStore = ShareStore.fromJSON(rawStore as StringifiedType)
  const share = existingStore.share.share.add(privateKey).umod(ecCurve.curve.n)
  const shareStore = new ShareStore(
    new Share(existingStore.share.shareIndex, share),
    existingStore.polynomialID
  )
  const derivedPublicShare = shareStore.share.getPublicShare()
  if (
    derivedPublicShare.shareCommitment.x.cmp(
      existingStore.share.getPublicShare().shareCommitment.x
    ) !== 0
  ) {
    throw new Error('Invalid private key')
  }
  const latestShareDetails = await tKey.catchupToLatestShare({
    shareStore,
    includeLocalMetadataTransitions: true,
  })
  tKey.inputShareStore(latestShareDetails.latestShare)
}

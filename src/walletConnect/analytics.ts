import '@react-native-firebase/database'
import '@react-native-firebase/messaging'
import { SessionTypes, SignClientTypes } from '@walletconnect/types'
import { getDappRequestOrigin } from 'src/app/utils'
import { ActiveDapp } from 'src/dapps/types'
import { WalletConnectSession, WalletConnectSessionRequest } from 'src/walletConnect/types'

const isSessionProposalType = (
  session: SignClientTypes.EventArguments['session_proposal'] | SessionTypes.Struct
): session is SignClientTypes.EventArguments['session_proposal'] => {
  return 'params' in session
}

export function getDefaultSessionTrackedPropertiesV2(
  session: SignClientTypes.EventArguments['session_proposal'] | SessionTypes.Struct,
  activeDapp: ActiveDapp | null
) {
  const peer = isSessionProposalType(session) ? session.params.proposer : session.peer
  const { name: dappName, url: dappUrl, description: dappDescription, icons } = peer.metadata

  const relayProtocol = isSessionProposalType(session)
    ? session.params.relays[0]?.protocol
    : session.relay.protocol

  const requiredNamespaces = isSessionProposalType(session)
    ? session.params.requiredNamespaces
    : session.requiredNamespaces

  return {
    version: 2 as const,
    dappRequestOrigin: getDappRequestOrigin(activeDapp),
    dappName,
    dappUrl,
    dappDescription,
    dappIcon: icons[0],
    relayProtocol,
    ...Object.keys(requiredNamespaces).reduce((acc, key) => {
      const { chains, events, methods } = requiredNamespaces[key]
      return {
        ...acc,
        [`${key}Events`]: events,
        [`${key}Chains`]: chains,
        [`${key}Methods`]: methods,
      }
    }, {}),
  }
}

export function getDefaultSessionTrackedPropertiesV1(
  session: WalletConnectSessionRequest | WalletConnectSession,
  activeDapp: ActiveDapp | null
) {
  const { peerId, peerMeta, chainId } = 'peerMeta' in session ? session : session.params[0]
  const { name: dappName, url: dappUrl, description: dappDescription, icons } = peerMeta!
  return {
    version: 1 as const,
    dappRequestOrigin: getDappRequestOrigin(activeDapp),
    dappName,
    dappUrl,
    dappDescription,
    dappIcon: icons[0],
    peerId,
    chainId: chainId?.toString() ?? '',
  }
}

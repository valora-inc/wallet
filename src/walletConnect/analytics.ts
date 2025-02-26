import { WalletKitTypes } from '@reown/walletkit'
import { SessionTypes } from '@walletconnect/types'
import { getDappRequestOrigin } from 'src/app/utils'
import { ActiveDapp } from 'src/dapps/types'

const isSessionProposalType = (
  session: WalletKitTypes.EventArguments['session_proposal'] | SessionTypes.Struct
): session is WalletKitTypes.EventArguments['session_proposal'] => {
  return 'params' in session
}

export function getDefaultSessionTrackedProperties(
  session: WalletKitTypes.EventArguments['session_proposal'] | SessionTypes.Struct,
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

export function getDefaultRequestTrackedProperties(
  request: WalletKitTypes.EventArguments['session_request']
) {
  const { id, params } = request

  return {
    requestChainId: params.chainId,
    requestId: id,
    requestJsonrpc: '2.0',
    requestMethod: params.request.method,
  }
}

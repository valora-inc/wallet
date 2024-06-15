import { SessionTypes } from '@walletconnect/types'
import { getSdkError } from '@walletconnect/utils'
import { Web3WalletTypes } from '@walletconnect/web3wallet'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import InLineNotification, { NotificationVariant } from 'src/components/InLineNotification'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { SentryTransactionHub } from 'src/sentry/SentryTransactionHub'
import { SentryTransaction } from 'src/sentry/SentryTransactions'
import { NETWORK_NAMES } from 'src/shared/conts'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { acceptSession, denySession } from 'src/walletConnect/actions'
import { isSupportedAction, isSupportedEvent } from 'src/walletConnect/constants'
import RequestContent, {
  RequestDetail,
  useDappMetadata,
} from 'src/walletConnect/screens/RequestContent'
import { walletConnectChainIdToNetworkId } from 'src/web3/networkConfig'
import { currentAccountSelector } from 'src/web3/selectors'

export type SessionRequestProps = {
  version: 2
  pendingSession: Web3WalletTypes.EventArguments['session_proposal']
  namespacesToApprove: SessionTypes.Namespaces | null
  supportedChains: string[]
}

// do not destructure props or else the type inference is lost
function SessionRequest({
  pendingSession,
  namespacesToApprove,
  supportedChains,
}: SessionRequestProps) {
  const { metadata } = pendingSession.params.proposer

  const { t } = useTranslation()
  const dispatch = useDispatch()

  const address = useSelector(currentAccountSelector)
  const { dappName, dappImageUrl } = useDappMetadata(metadata)

  const requestDetails: RequestDetail[] = [
    {
      label: t('address'),
      value: address,
    },
  ]

  const matchedSupportedChains = (namespacesToApprove?.['eip155']?.chains ?? []).filter((chainId) =>
    supportedChains.includes(chainId)
  )
  const networkNames = matchedSupportedChains
    .map((chain) => NETWORK_NAMES[walletConnectChainIdToNetworkId[chain]])
    .sort()
  if (networkNames.length > 0) {
    requestDetails.push({
      label: t('walletConnectRequest.networksList'),
      value: <NetworkChips networkNames={networkNames} />,
    })
  }

  const supportedNetworkNames = supportedChains
    .map((chain) => NETWORK_NAMES[walletConnectChainIdToNetworkId[chain]])
    .join(', ')
  if (!namespacesToApprove) {
    // We couldn't build an namespace to approve, so we reject the session, showing the reason
    // Note: for now it can only be because it's not an EVM chain
    return (
      <RequestContent
        type="dismiss"
        onDismiss={() => {
          dispatch(denySession(pendingSession, getSdkError('UNSUPPORTED_NAMESPACE_KEY')))
        }}
        dappName={dappName}
        dappImageUrl={dappImageUrl}
        title={t('connectToWallet', { dappName })}
        description={t('shareInfo')}
        testId="WalletConnectSessionRequest"
      >
        <InLineNotification
          variant={NotificationVariant.Warning}
          title={t('walletConnectRequest.session.failUnsupportedNamespace.title', { dappName })}
          description={t('walletConnectRequest.session.failUnsupportedNamespace.descriptionV1_74', {
            dappName,
            supportedNetworkNames,
            count: supportedChains.length,
          })}
          style={styles.warning}
        />
      </RequestContent>
    )
  }

  return (
    <RequestContent
      type="confirm"
      buttonText={t('walletConnectRequest.connectWalletAction')}
      onAccept={() => {
        SentryTransactionHub.startTransaction(SentryTransaction.wallet_connect_connection)
        dispatch(acceptSession(pendingSession, namespacesToApprove))
      }}
      onDeny={() => {
        dispatch(denySession(pendingSession, getSdkError('USER_REJECTED')))
      }}
      dappName={dappName}
      dappImageUrl={dappImageUrl}
      title={t('connectToWallet', { dappName })}
      description={t('shareInfo')}
      requestDetails={requestDetails}
      testId="WalletConnectSessionRequest"
    >
      <NamespacesWarning
        namespacesToApprove={namespacesToApprove}
        supportedChains={supportedChains}
        supportedNetworkNames={supportedNetworkNames}
        dappName={dappName}
      />
    </RequestContent>
  )
}

function NamespacesWarning({
  namespacesToApprove,
  supportedChains,
  supportedNetworkNames,
  dappName,
}: {
  namespacesToApprove: SessionTypes.Namespaces
  supportedChains: string[]
  supportedNetworkNames: string
  dappName: string
}) {
  const { t } = useTranslation()

  let title: string | null = null
  let description: string | null = null

  const eip155NamespaceToApprove = namespacesToApprove['eip155']
  const supportedChainsToApprove = (eip155NamespaceToApprove?.chains ?? []).filter((chainId) =>
    supportedChains.includes(chainId)
  )
  const unsupportedMethods = (eip155NamespaceToApprove?.methods ?? []).filter(
    (method) => !isSupportedAction(method)
  )
  const unsupportedEvents = (eip155NamespaceToApprove?.events ?? []).filter(
    (event) => !isSupportedEvent(event)
  )
  if (supportedChainsToApprove.length === 0) {
    title = t('walletConnectRequest.session.warnUnsupportedChains.title', { dappName })
    description = t('walletConnectRequest.session.warnUnsupportedChains.descriptionV1_74', {
      dappName,
      supportedNetworkNames,
      count: supportedChains.length,
    })
  } else if (unsupportedMethods.length > 0) {
    title = t('walletConnectRequest.session.warnSomeUnsupportedMethods.title', { dappName })
    description = t('walletConnectRequest.session.warnSomeUnsupportedMethods.description', {
      dappName,
    })
  } else if (unsupportedEvents.length > 0) {
    title = t('walletConnectRequest.session.warnSomeUnsupportedEvents.title', { dappName })
    description = t('walletConnectRequest.session.warnSomeUnsupportedEvents.description', {
      dappName,
    })
  }

  if (!title || !description) {
    return null
  }

  return (
    <InLineNotification
      variant={NotificationVariant.Warning}
      title={title}
      description={description}
      style={styles.warning}
    />
  )
}

function NetworkChips({ networkNames }: { networkNames: string[] }) {
  return (
    <View style={styles.networkChipsContainer} testID="SessionRequest/NetworkChips">
      {networkNames.map((networkName) => (
        <Text key={networkName} style={styles.networkChip}>
          {networkName}
        </Text>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  warning: {
    marginBottom: Spacing.Thick24,
  },
  networkChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.Tiny4,
  },
  networkChip: {
    ...typeScale.labelXSmall,
    color: Colors.black,
    backgroundColor: Colors.gray2,
    paddingVertical: Spacing.Tiny4,
    paddingHorizontal: Spacing.Smallest8,
    borderRadius: 8,
    overflow: 'hidden',
  },
})

export default SessionRequest

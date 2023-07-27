import { SessionTypes } from '@walletconnect/types'
import { getSdkError } from '@walletconnect/utils'
import { Web3WalletTypes } from '@walletconnect/web3wallet'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import Warning from 'src/components/Warning'
import { dappConnectInfoSelector } from 'src/dapps/selectors'
import { DappConnectInfo } from 'src/dapps/types'
import { SentryTransactionHub } from 'src/sentry/SentryTransactionHub'
import { SentryTransaction } from 'src/sentry/SentryTransactions'
import { Spacing } from 'src/styles/styles'
import { acceptSession, denySession } from 'src/walletConnect/actions'
import { isSupportedAction, isSupportedEvent } from 'src/walletConnect/constants'
import RequestContent, { useDappMetadata } from 'src/walletConnect/screens/RequestContent'
import { currentAccountSelector } from 'src/web3/selectors'

type Props = {
  version: 2
  pendingSession: Web3WalletTypes.EventArguments['session_proposal']
  approvedNamespaces: SessionTypes.Namespaces | null
  supportedChains: string[]
}

// do not destructure props or else the type inference is lost
function SessionRequest({ pendingSession, approvedNamespaces, supportedChains }: Props) {
  const { metadata } = pendingSession.params.proposer

  const { t } = useTranslation()
  const dispatch = useDispatch()

  const address = useSelector(currentAccountSelector)
  const dappConnectInfo = useSelector(dappConnectInfoSelector)
  const { dappName, dappImageUrl } = useDappMetadata(metadata)

  const requestDetails =
    dappConnectInfo === DappConnectInfo.Basic
      ? [
          {
            label: t('address'),
            value: address,
          },
        ]
      : []

  if (!approvedNamespaces) {
    // We couldn't build an approved namespace, so we reject the session, showing the reason
    // Note: for now it can only be because it's not an EVM chain
    return (
      <RequestContent
        type="dismiss"
        onDismiss={() => {
          dispatch(denySession(pendingSession, getSdkError('UNSUPPORTED_CHAINS')))
        }}
        dappName={dappName}
        dappImageUrl={dappImageUrl}
        title={
          dappConnectInfo === DappConnectInfo.Basic
            ? t('connectToWallet', { dappName })
            : t('confirmTransaction', { dappName })
        }
        description={dappConnectInfo === DappConnectInfo.Basic ? t('shareInfo') : null}
        testId="WalletConnectSessionRequest"
      >
        <Warning
          title={t('walletConnectRequest.unsupportedChain.title', { dappName })}
          description={t('walletConnectRequest.unsupportedChain.description', {
            dappName,
          })}
          style={styles.warning}
        />
      </RequestContent>
    )
  }

  let warning: React.ReactNode | null = null
  const approvedEip155Namespace = approvedNamespaces['eip155']
  const approvedSupportedChains = (approvedEip155Namespace?.chains ?? []).filter((chainId) =>
    supportedChains.includes(chainId)
  )
  const approvedUnsupportedMethods = (approvedEip155Namespace?.methods ?? []).filter(
    (method) => !isSupportedAction(method)
  )
  const approvedUnsupportedEvents = (approvedEip155Namespace?.events ?? []).filter(
    (event) => !isSupportedEvent(event)
  )
  if (approvedSupportedChains.length === 0) {
    warning = (
      <Warning
        title={t('walletConnectRequest.noSupportedChains.title', { dappName })}
        description={t('walletConnectRequest.noSupportedChains.description', {
          dappName,
        })}
        style={styles.warning}
      />
    )
  } else if (approvedUnsupportedMethods.length > 0) {
    warning = (
      <Warning
        title={t('walletConnectRequest.someUnsupportedMethods.title', { dappName })}
        description={t('walletConnectRequest.someUnsupportedMethods.description', {
          dappName,
        })}
        style={styles.warning}
      />
    )
  } else if (approvedUnsupportedEvents.length > 0) {
    warning = (
      <Warning
        title={t('walletConnectRequest.someUnsupportedEvents.title', { dappName })}
        description={t('walletConnectRequest.someUnsupportedEvents.description', {
          dappName,
        })}
        style={styles.warning}
      />
    )
  }

  return (
    <RequestContent
      type="confirm"
      onAccept={() => {
        SentryTransactionHub.startTransaction(SentryTransaction.wallet_connect_connection)
        dispatch(acceptSession(pendingSession, approvedNamespaces))
      }}
      onDeny={() => {
        dispatch(denySession(pendingSession, getSdkError('USER_REJECTED_METHODS')))
      }}
      dappName={dappName}
      dappImageUrl={dappImageUrl}
      title={
        dappConnectInfo === DappConnectInfo.Basic
          ? t('connectToWallet', { dappName })
          : t('confirmTransaction', { dappName })
      }
      description={dappConnectInfo === DappConnectInfo.Basic ? t('shareInfo') : null}
      requestDetails={requestDetails}
      testId="WalletConnectSessionRequest"
    >
      {warning}
    </RequestContent>
  )
}

const styles = StyleSheet.create({
  warning: {
    marginBottom: Spacing.Thick24,
  },
})

export default SessionRequest

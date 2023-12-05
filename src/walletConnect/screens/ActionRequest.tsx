import { getSdkError } from '@walletconnect/utils'
import { Web3WalletTypes } from '@walletconnect/web3wallet'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import InLineNotification, { Severity } from 'src/components/InLineNotification'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { Spacing } from 'src/styles/styles'
import Logger from 'src/utils/Logger'
import { PreparedTransactionsResult } from 'src/viem/prepareTransactions'
import { acceptRequest, denyRequest } from 'src/walletConnect/actions'
import { SupportedActions, getDescriptionAndTitleFromAction } from 'src/walletConnect/constants'
import ActionRequestPayload from 'src/walletConnect/screens/ActionRequestPayload'
import DappsDisclaimer from 'src/walletConnect/screens/DappsDisclaimer'
import RequestContent, { useDappMetadata } from 'src/walletConnect/screens/RequestContent'
import { useIsDappListed } from 'src/walletConnect/screens/useIsDappListed'
import { sessionsSelector } from 'src/walletConnect/selectors'

interface Props {
  version: 2
  pendingAction: Web3WalletTypes.EventArguments['session_request']
  supportedChains: string[]
  preparedTransactionsResult?: PreparedTransactionsResult
}

function ActionRequest({ pendingAction, supportedChains, preparedTransactionsResult }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const sessions = useSelector(sessionsSelector)
  const activeSession = useMemo(() => {
    return sessions.find((s) => s.topic === pendingAction.topic)
  }, [sessions])
  const { url, dappName, dappImageUrl } = useDappMetadata(activeSession?.peer.metadata)
  const isDappListed = useIsDappListed(url)
  const useViem = getFeatureGate(StatsigFeatureGates.USE_VIEM_FOR_WALLETCONNECT_TRANSACTIONS)

  if (!activeSession) {
    // should never happen
    Logger.error(
      'WalletConnectRequest/ActionRequestV2',
      'No active WallectConnect session could be found'
    )
    return null
  }

  const { description, title } = getDescriptionAndTitleFromAction(
    t,
    pendingAction.params.request.method as SupportedActions,
    dappName
  )

  const chainId = pendingAction.params.chainId

  // Reject and warn if the chain is not supported
  // Note: we still allow personal_sign on unsupported chains (Cred Protocol does this)
  // as this does not depend on the chainId
  if (
    !supportedChains.includes(chainId) &&
    pendingAction.params.request.method !== SupportedActions.personal_sign
  ) {
    return (
      <RequestContent
        type="dismiss"
        onDismiss={() => dispatch(denyRequest(pendingAction, getSdkError('UNSUPPORTED_CHAINS')))}
        dappName={dappName}
        dappImageUrl={dappImageUrl}
        title={title}
        description={description}
        testId="WalletConnectActionRequest"
      >
        <InLineNotification
          severity={Severity.Warning}
          title={t('walletConnectRequest.unsupportedChain.title', { dappName, chainId })}
          description={t('walletConnectRequest.unsupportedChain.description', {
            dappName,
            chainId,
          })}
          style={styles.warning}
        />
      </RequestContent>
    )
  }

  if (useViem && preparedTransactionsResult?.type === 'not-enough-balance-for-gas') {
    return (
      <RequestContent
        type="dismiss"
        onDismiss={() => dispatch(denyRequest(pendingAction, getSdkError('USER_REJECTED')))}
        dappName={dappName}
        dappImageUrl={dappImageUrl}
        title={title}
        description={description}
        testId="WalletConnectActionRequest"
      >
        <InLineNotification
          severity={Severity.Warning}
          title={t('walletConnectRequest.notEnoughBalanceForGas.title')}
          description={t('walletConnectRequest.notEnoughBalanceForGas.description', {
            feeCurrencies: preparedTransactionsResult.feeCurrencies
              .map((feeCurrency) => feeCurrency.symbol)
              .join(', '),
          })}
          style={styles.warning}
        />
      </RequestContent>
    )
  }

  return (
    <RequestContent
      type="confirm"
      onAccept={() =>
        dispatch(
          acceptRequest(
            pendingAction,
            preparedTransactionsResult?.type === 'possible'
              ? preparedTransactionsResult.transactions
              : undefined
          )
        )
      }
      onDeny={() => {
        dispatch(denyRequest(pendingAction, getSdkError('USER_REJECTED')))
      }}
      dappName={dappName}
      dappImageUrl={dappImageUrl}
      title={title}
      description={description}
      testId="WalletConnectActionRequest"
    >
      <ActionRequestPayload session={activeSession} request={pendingAction} />
      <DappsDisclaimer isDappListed={isDappListed} />
    </RequestContent>
  )
}

const styles = StyleSheet.create({
  warning: {
    marginBottom: Spacing.Thick24,
  },
})

export default ActionRequest

import { Web3WalletTypes } from '@walletconnect/web3wallet'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { dappConnectInfoSelector } from 'src/dapps/selectors'
import { DappConnectInfo } from 'src/dapps/types'
import { SentryTransactionHub } from 'src/sentry/SentryTransactionHub'
import { SentryTransaction } from 'src/sentry/SentryTransactions'
import {
  acceptSession as acceptSessionV2,
  denySession as denySessionV2,
} from 'src/walletConnect/actions'
import RequestContent, { useDappMetadata } from 'src/walletConnect/screens/RequestContent'
import { currentAccountSelector } from 'src/web3/selectors'

type Props = {
  version: 2
  pendingSession: Web3WalletTypes.EventArguments['session_proposal']
}

// do not destructure props or else the type inference is lost
function SessionRequest(props: Props) {
  const { metadata } = props.pendingSession.params.proposer

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

  const handleAcceptSession = () => {
    SentryTransactionHub.startTransaction(SentryTransaction.wallet_connect_connection)
    dispatch(acceptSessionV2(props.pendingSession))
  }

  const handleDenySession = () => {
    dispatch(denySessionV2(props.pendingSession))
  }

  return (
    <RequestContent
      onAccept={handleAcceptSession}
      onDeny={handleDenySession}
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
    />
  )
}

export default SessionRequest

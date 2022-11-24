import { SignClientTypes } from '@walletconnect/types'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { dappConnectInfoSelector } from 'src/dapps/selectors'
import { DappConnectInfo } from 'src/dapps/types'
import { SentryTransactionHub } from 'src/sentry/SentryTransactionHub'
import { SentryTransaction } from 'src/sentry/SentryTransactions'
import RequestContent from 'src/walletConnect/screens/RequestContent'
import { WalletConnectSessionRequest } from 'src/walletConnect/types'
import {
  acceptSession as acceptSessionV1,
  denySession as denySessionV1,
} from 'src/walletConnect/v1/actions'
import {
  acceptSession as acceptSessionV2,
  denySession as denySessionV2,
} from 'src/walletConnect/v2/actions'
import { currentAccountSelector } from 'src/web3/selectors'

type Props =
  | {
      version: 1
      pendingSession: WalletConnectSessionRequest
    }
  | {
      version: 2
      pendingSession: SignClientTypes.EventArguments['session_proposal']
    }

// do not destructure props or else the type inference is lost
function SessionRequest(props: Props) {
  const { url, name, icons } =
    props.version === 1
      ? props.pendingSession.params[0].peerMeta
      : props.pendingSession.params.proposer.metadata
  const dappImageUrl = icons[0] ?? `${url}/favicon.ico`

  const { t } = useTranslation()
  const dispatch = useDispatch()

  const address = useSelector(currentAccountSelector)
  const dappConnectInfo = useSelector(dappConnectInfoSelector)

  const requestDetails =
    dappConnectInfo === DappConnectInfo.Basic
      ? [
          {
            label: t('address'),
            value: address,
            tapToCopy: true,
          },
        ]
      : []

  const handleAcceptSession = () => {
    SentryTransactionHub.startTransaction(SentryTransaction.wallet_connect_connection)
    if (props.version === 1) {
      dispatch(acceptSessionV1(props.pendingSession))
    } else {
      dispatch(acceptSessionV2(props.pendingSession.id))
    }
  }

  const handleDenySession = () => {
    if (props.version === 1) {
      dispatch(denySessionV1(props.pendingSession))
    } else {
      dispatch(denySessionV2(props.pendingSession.id))
    }
  }

  return (
    <RequestContent
      onAccept={handleAcceptSession}
      onDeny={handleDenySession}
      dappName={name}
      dappImageUrl={dappImageUrl}
      title={
        dappConnectInfo === DappConnectInfo.Basic
          ? t('connectToWallet', { dappName: name })
          : t('confirmTransaction', { dappName: name })
      }
      description={dappConnectInfo === DappConnectInfo.Basic ? t('shareInfo') : undefined}
      dappUrl={url}
      requestDetails={requestDetails}
      testId="WalletConnectSessionRequest"
    />
  )
}

export default SessionRequest

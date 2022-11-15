import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { dappConnectInfoSelector } from 'src/dapps/selectors'
import { DappConnectInfo } from 'src/dapps/types'
import { SentryTransactionHub } from 'src/sentry/SentryTransactionHub'
import { SentryTransaction } from 'src/sentry/SentryTransactions'
import RequestContent from 'src/walletConnect/screens/RequestContent'
import { WalletConnectSessionRequest } from 'src/walletConnect/types'
import { acceptSession, denySession } from 'src/walletConnect/v1/actions'
import { currentAccountSelector } from 'src/web3/selectors'

type Props = {
  pendingSession: WalletConnectSessionRequest
}

function SessionRequest({ pendingSession }: Props) {
  const { url, name, icons } = pendingSession.params[0].peerMeta
  const fallbackIcon = icons[0] ?? `${url}/favicon.ico`

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

  return (
    <RequestContent
      onAccept={() => {
        SentryTransactionHub.startTransaction(SentryTransaction.wallet_connect_connection)
        dispatch(acceptSession(pendingSession))
      }}
      onDeny={() => {
        dispatch(denySession(pendingSession))
      }}
      dappName={name}
      dappImageUrl={fallbackIcon}
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

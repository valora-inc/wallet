import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import RequestContent from 'src/walletConnect/screens/RequestContent'
import { WalletConnectSessionRequest } from 'src/walletConnect/types'
import { acceptSession, denySession } from 'src/walletConnect/v1/actions'

type Props = {
  pendingSession: WalletConnectSessionRequest
}

function SessionRequest({ pendingSession }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const { url, name, icons } = pendingSession.params[0].peerMeta
  const fallbackIcon = icons[0] ?? `${url}/favicon.ico`

  return (
    <RequestContent
      onAccept={() => {
        dispatch(acceptSession(pendingSession))
      }}
      onDeny={() => {
        dispatch(denySession(pendingSession))
      }}
      dappImageUrl={fallbackIcon}
      title={t('connectToWallet', { dappName: name })}
      testId="WalletConnectSession"
    />
  )
}

export default SessionRequest

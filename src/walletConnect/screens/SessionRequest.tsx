import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import RequestContent from 'src/walletConnect/screens/RequestContent'
import { useIsDappListed } from 'src/walletConnect/screens/useIsDappListed'
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
  const isDappListed = useIsDappListed(url)

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
      description={t('shareInfo')}
      isDappListed={isDappListed}
      requestDetails={[
        {
          label: t('address'),
          value: address,
          tapToCopy: true,
        },
      ]}
      testId="WalletConnectSessionRequest"
    />
  )
}

export default SessionRequest

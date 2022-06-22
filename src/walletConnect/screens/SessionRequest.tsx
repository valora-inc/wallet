import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import RequestContent from 'src/walletConnect/screens/RequestContent'
import { useIsDappListed } from 'src/walletConnect/screens/useIsDappListed'
import { WalletConnectSessionRequest } from 'src/walletConnect/types'
import { acceptSession, denySession } from 'src/walletConnect/v1/actions'
import { WalletConnectDisplayedInfo } from 'src/walletConnect/v1/reducer'
import { walletConnectDisplayedInfoSelector } from 'src/walletConnect/v1/selectors'
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
  const walletConnectDisplayedInfo = useSelector(walletConnectDisplayedInfoSelector)
  const isDappListed = useIsDappListed(name)

  const requestDetails =
    walletConnectDisplayedInfo === WalletConnectDisplayedInfo.None
      ? []
      : [
          {
            label: t('address'),
            value: address,
            tapToCopy: true,
          },
        ]

  return (
    <RequestContent
      onAccept={() => {
        dispatch(acceptSession(pendingSession))
      }}
      onDeny={() => {
        dispatch(denySession(pendingSession))
      }}
      dappImageUrl={fallbackIcon}
      title={t(
        walletConnectDisplayedInfo === WalletConnectDisplayedInfo.None
          ? 'confirmTransaction'
          : 'connectToWallet',
        { dappName: name }
      )}
      description={t('shareInfo')}
      isDappListed={isDappListed}
      requestDetails={requestDetails}
      testId="WalletConnectSessionRequest"
    />
  )
}

export default SessionRequest

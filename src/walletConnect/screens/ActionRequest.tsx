import { getSdkError } from '@walletconnect/utils'
import { Web3WalletTypes } from '@walletconnect/web3wallet'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import Logger from 'src/utils/Logger'
import {
  acceptRequest as acceptRequestV2,
  denyRequest as denyRequestV2,
} from 'src/walletConnect/actions'
import { getDescriptionFromAction, SupportedActions } from 'src/walletConnect/constants'
import ActionRequestPayload from 'src/walletConnect/screens/ActionRequestPayload'
import DappsDisclaimer from 'src/walletConnect/screens/DappsDisclaimer'
import RequestContent, { useDappMetadata } from 'src/walletConnect/screens/RequestContent'
import { useIsDappListed } from 'src/walletConnect/screens/useIsDappListed'
import { selectSessionFromTopic } from 'src/walletConnect/selectors'

interface Props {
  version: 2
  pendingAction: Web3WalletTypes.EventArguments['session_request']
}

// do not destructure props or else the type inference is lost
function ActionRequest(props: Props) {
  return <ActionRequestV2 {...props} />
}

function ActionRequestV2({ pendingAction }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const activeSession = useSelector(selectSessionFromTopic(pendingAction.topic))
  const { url, dappName, dappImageUrl } = useDappMetadata(activeSession?.peer.metadata)
  const isDappListed = useIsDappListed(url)

  if (!activeSession) {
    // should never happen
    Logger.error(
      'WalletConnectRequest/ActionRequestV2',
      'No active WallectConnect session could be found'
    )
    return null
  }

  const description = getDescriptionFromAction(
    t,
    pendingAction.params.request.method as SupportedActions,
    dappName
  )

  return (
    <RequestContent
      onAccept={() => {
        dispatch(acceptRequestV2(pendingAction))
      }}
      onDeny={() => {
        dispatch(denyRequestV2(pendingAction, getSdkError('USER_REJECTED')))
      }}
      dappName={dappName}
      dappImageUrl={dappImageUrl}
      title={t('confirmTransaction')}
      description={description}
      testId="WalletConnectActionRequest"
    >
      <ActionRequestPayload session={activeSession} request={pendingAction} />
      <DappsDisclaimer isDappListed={isDappListed} />
    </RequestContent>
  )
}

export default ActionRequest

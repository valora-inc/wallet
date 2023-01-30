import { SignClientTypes } from '@walletconnect/types'
import { getSdkError } from '@walletconnect/utils'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import Logger from 'src/utils/Logger'
import { getDescriptionFromAction, SupportedActions } from 'src/walletConnect/constants'
import ActionRequestPayload from 'src/walletConnect/screens/ActionRequestPayload'
import RequestContent, { useDappMetadata } from 'src/walletConnect/screens/RequestContent'
import {
  acceptRequest as acceptRequestV1,
  denyRequest as denyRequestV1,
} from 'src/walletConnect/v1/actions'
import { PendingAction } from 'src/walletConnect/v1/reducer'
import { selectSessionFromPeerId } from 'src/walletConnect/v1/selectors'
import {
  acceptRequest as acceptRequestV2,
  denyRequest as denyRequestV2,
} from 'src/walletConnect/v2/actions'
import { selectSessionFromTopic } from 'src/walletConnect/v2/selectors'

interface PropsV1 {
  version: 1
  pendingAction: PendingAction
}

interface PropsV2 {
  version: 2
  pendingAction: SignClientTypes.EventArguments['session_request']
}

type Props = PropsV1 | PropsV2

// do not destructure props or else the type inference is lost
function ActionRequest(props: Props) {
  if (props.version === 1) {
    return <ActionRequestV1 {...props} />
  }

  return <ActionRequestV2 {...props} />
}

function ActionRequestV1({ pendingAction }: PropsV1) {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const { action, peerId } = pendingAction
  const activeSession = useSelector(selectSessionFromPeerId(peerId))
  const { url, dappName, dappImageUrl } = useDappMetadata(activeSession?.peerMeta)

  if (!activeSession) {
    // should never happen
    Logger.error(
      'WalletConnectRequest/ActionRequestV1',
      'No active WallectConnect session could be found'
    )
    return null
  }

  const { method, params } = action
  const description = getDescriptionFromAction(t, method as SupportedActions, dappName)

  return (
    <RequestContent
      onAccept={() => {
        dispatch(acceptRequestV1(peerId, action))
      }}
      onDeny={() => {
        dispatch(denyRequestV1(peerId, action, 'User denied'))
      }}
      dappName={dappName}
      dappImageUrl={dappImageUrl}
      title={t('confirmTransaction')}
      description={description}
      testId="WalletConnectActionRequest"
      dappUrl={url}
    >
      <ActionRequestPayload dappName={dappName} method={method} params={params} />
    </RequestContent>
  )
}

function ActionRequestV2({ pendingAction }: PropsV2) {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const activeSession = useSelector(selectSessionFromTopic(pendingAction.topic))
  const { url, dappName, dappImageUrl } = useDappMetadata(activeSession?.peer.metadata)

  if (!activeSession) {
    // should never happen
    Logger.error(
      'WalletConnectRequest/ActionRequestV2',
      'No active WallectConnect session could be found'
    )
    return null
  }

  const { method, params } = pendingAction.params.request
  const description = getDescriptionFromAction(t, method as SupportedActions, dappName)

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
      title={t('confirmTransaction', { dappName })}
      description={description}
      testId="WalletConnectActionRequest"
      dappUrl={url}
    >
      <ActionRequestPayload dappName={dappName} method={method} params={params} />
    </RequestContent>
  )
}

export default ActionRequest

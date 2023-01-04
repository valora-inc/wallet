import { trimLeading0x } from '@celo/utils/lib/address'
import { SignClientTypes } from '@walletconnect/types'
import { getSdkError } from '@walletconnect/utils'
import { TFunction } from 'i18next'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import Expandable from 'src/components/Expandable'
import Touchable from 'src/components/Touchable'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import Logger from 'src/utils/Logger'
import { getTranslationFromAction, SupportedActions } from 'src/walletConnect/constants'
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

const getMoreInfoString = (t: TFunction, method: string, params: any) => {
  const moreInfoString =
    method === SupportedActions.eth_signTransaction ||
    method === SupportedActions.eth_sendTransaction
      ? JSON.stringify(params)
      : method === SupportedActions.eth_signTypedData ||
        method === SupportedActions.eth_signTypedData_v4
      ? JSON.stringify(params[1])
      : method === SupportedActions.personal_decrypt
      ? Buffer.from(params[1]).toString('hex')
      : method === SupportedActions.personal_sign
      ? Buffer.from(trimLeading0x(params[0]), 'hex').toString() ||
        params[0] ||
        t('action.emptyMessage')
      : null

  return moreInfoString
}

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
  const [showTransactionDetails, setShowTransactionDetails] = useState(false)

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
  const moreInfoString = getMoreInfoString(t, method, params)
  const requestDetails = [
    {
      label: t('action.operation'),
      value: getTranslationFromAction(t, method as SupportedActions),
    },
  ]

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
      title={t('confirmTransaction', { dappName })}
      description={t('action.askingV1_35', { dappName })}
      testId="WalletConnectActionRequest"
      dappUrl={url}
      requestDetails={requestDetails}
    >
      {moreInfoString && (
        <View style={styles.transactionDetails}>
          <Touchable
            testID="ShowTransactionDetailsButton"
            onPress={() => {
              setShowTransactionDetails((prev) => !prev)
            }}
          >
            <Expandable isExpandable isExpanded={showTransactionDetails}>
              <Text style={[styles.bodyText, styles.underLine]}>{t('action.details')}</Text>
            </Expandable>
          </Touchable>

          {showTransactionDetails && (
            <Text testID="DappData" style={styles.bodyText}>
              {moreInfoString}
            </Text>
          )}
        </View>
      )}
    </RequestContent>
  )
}

function ActionRequestV2({ pendingAction }: PropsV2) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const [showTransactionDetails, setShowTransactionDetails] = useState(false)

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
  const moreInfoString = getMoreInfoString(t, method, params)
  const requestDetails = [
    {
      label: t('action.operation'),
      value: getTranslationFromAction(t, method as SupportedActions),
    },
  ]

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
      description={t('action.askingV1_35', { dappName })}
      testId="WalletConnectActionRequest"
      dappUrl={url}
      requestDetails={requestDetails}
    >
      {moreInfoString && (
        <View style={styles.transactionDetails}>
          <Touchable
            testID="ShowTransactionDetailsButton"
            onPress={() => {
              setShowTransactionDetails((prev) => !prev)
            }}
          >
            <Expandable isExpandable isExpanded={showTransactionDetails}>
              <Text style={[styles.bodyText, styles.underLine]}>{t('action.details')}</Text>
            </Expandable>
          </Touchable>

          {showTransactionDetails && (
            <Text testID="DappData" style={styles.bodyText}>
              {moreInfoString}
            </Text>
          )}
        </View>
      )}
    </RequestContent>
  )
}

const styles = StyleSheet.create({
  bodyText: {
    ...fontStyles.small,
    color: colors.gray4,
    marginBottom: Spacing.Smallest8,
  },
  underLine: {
    textDecorationLine: 'underline',
  },
  transactionDetails: {
    marginBottom: Spacing.Regular16,
  },
})

export default ActionRequest

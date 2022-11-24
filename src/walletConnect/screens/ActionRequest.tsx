import { trimLeading0x } from '@celo/utils/lib/address'
import { SignClientTypes } from '@walletconnect/types'
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
import RequestContent from 'src/walletConnect/screens/RequestContent'
import { WalletConnectPayloadRequest, WalletConnectSession } from 'src/walletConnect/types'
import { acceptRequest, denyRequest } from 'src/walletConnect/v1/actions'
import { PendingAction } from 'src/walletConnect/v1/reducer'
import { selectSessionFromPeerId } from 'src/walletConnect/v1/selectors'

type Props =
  | {
      version: 1
      pendingAction: PendingAction
    }
  | {
      version: 2
      pendingAction: SignClientTypes.EventArguments['session_request']
    }

function getRequestInfo(pendingAction: WalletConnectPayloadRequest, session: WalletConnectSession) {
  return {
    url: session.peerMeta!.url,
    name: session.peerMeta!.name,
    icon: session.peerMeta!.icons[0],
    method: pendingAction.method,
    params: pendingAction.params,
  }
}
function ActionRequest(props: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const [showTransactionDetails, setShowTransactionDetails] = useState(false)

  const { action, peerId } =
    props.version === 1 ? props.pendingAction : props.pendingAction.params.request.params
  const activeSession = useSelector(selectSessionFromPeerId(peerId))

  if (!activeSession) {
    // should never happen
    Logger.error(
      'WalletConnectRequest/ActionRequest',
      'No active WallectConnect session could be found'
    )
    return null
  }

  const { url, name, icon, method, params } = getRequestInfo(action, activeSession)
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

  const uri = icon ?? `${url}/favicon.ico`

  const requestDetails = [
    {
      label: t('action.operation'),
      value: getTranslationFromAction(t, method as SupportedActions),
    },
  ]

  return (
    <RequestContent
      onAccept={() => {
        dispatch(acceptRequest(peerId, action))
      }}
      onDeny={() => {
        dispatch(denyRequest(peerId, action, 'User denied'))
      }}
      dappName={name}
      dappImageUrl={uri}
      title={t('confirmTransaction', { dappName: name })}
      description={t('action.askingV1_35', { dappName: name })}
      testId="WalletConnectActionRequest"
      dappUrl={activeSession?.peerMeta?.url}
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

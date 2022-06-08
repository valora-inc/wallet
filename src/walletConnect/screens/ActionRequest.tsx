import { trimLeading0x } from '@celo/utils/lib/address'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useDispatch, useSelector } from 'react-redux'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import Logger from 'src/utils/Logger'
import { getTranslationFromAction, SupportedActions } from 'src/walletConnect/constants'
import RequestContent from 'src/walletConnect/screens/RequestContent'
import { WalletConnectPayloadRequest, WalletConnectSession } from 'src/walletConnect/types'
import { acceptRequest, denyRequest, showRequestDetails } from 'src/walletConnect/v1/actions'
import { PendingAction } from 'src/walletConnect/v1/reducer'
import { selectSessionFromPeerId } from 'src/walletConnect/v1/selectors'

type Props = {
  pendingAction: PendingAction
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
function ActionRequest({ pendingAction }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const { action, peerId } = pendingAction
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

  const onMoreInfo = () => {
    if (!moreInfoString) {
      return
    }
    // TODO: remove this as a separate screen
    dispatch(showRequestDetails(peerId, action, moreInfoString))
  }

  const uri = icon ?? `${url}/favicon.ico`

  return (
    <RequestContent
      onAccept={() => {
        dispatch(acceptRequest(peerId, action))
      }}
      onDeny={() => {
        dispatch(denyRequest(peerId, action, 'User denied'))
      }}
      dappImageUrl={uri}
      title={t('walletConnect.confirmTransaction.title', { dappName: name })}
      description={t('walletConnect.confirmTransaction.description', { dappName: name })}
      testId="WalletConnectAction"
    >
      <View style={styles.sectionDivider}>
        <Text style={styles.sectionHeaderText}>{t('action.operation')}</Text>
        <Text style={styles.bodyText}>
          {getTranslationFromAction(t, method as SupportedActions)}
        </Text>

        {moreInfoString && (
          <>
            <Text style={styles.sectionHeaderText}>{t('action.data')}</Text>
            <TouchableOpacity onPress={onMoreInfo}>
              <Text style={[styles.bodyText, styles.underLine]}>{t('action.details')}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </RequestContent>
  )
}

const styles = StyleSheet.create({
  sectionDivider: {
    alignItems: 'center',
  },
  sectionHeaderText: {
    ...fontStyles.label,
    marginTop: 16,
    marginBottom: 4,
  },
  bodyText: {
    ...fontStyles.regular,
    color: colors.gray4,
    textAlign: 'center',
  },
  underLine: {
    textDecorationLine: 'underline',
  },
})

export default ActionRequest

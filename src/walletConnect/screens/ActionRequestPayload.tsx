import { trimLeading0x } from '@celo/utils/lib/address'
import Clipboard from '@react-native-clipboard/clipboard'
import { SessionTypes } from '@walletconnect/types'
import { Web3WalletTypes } from '@walletconnect/web3wallet'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import Toast from 'react-native-simple-toast'
import { useSelector } from 'react-redux'
import { WalletConnectEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Touchable from 'src/components/Touchable'
import { activeDappSelector } from 'src/dapps/selectors'
import CopyIcon from 'src/icons/CopyIcon'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { vibrateInformative } from 'src/styles/hapticFeedback'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import {
  getDefaultRequestTrackedPropertiesV2,
  getDefaultSessionTrackedPropertiesV2,
} from 'src/walletConnect/analytics'
import { SupportedActions } from 'src/walletConnect/constants'

type Props = {
  session: SessionTypes.Struct
  request: Web3WalletTypes.EventArguments['session_request']
}

function ActionRequestPayload(props: Props) {
  const { method, params } = props.request.params.request

  const { t } = useTranslation()
  const activeDapp = useSelector(activeDappSelector)

  const moreInfoString = useMemo(
    () =>
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
        : null,
    [method, params]
  )

  const handleCopyRequestPayload = () => {
    Clipboard.setString(moreInfoString)
    vibrateInformative()

    const defaultTrackedProps = {
      ...getDefaultSessionTrackedPropertiesV2(props.session, activeDapp),
      ...getDefaultRequestTrackedPropertiesV2(props.request),
    }

    ValoraAnalytics.track(WalletConnectEvents.wc_copy_request_payload, defaultTrackedProps)

    Toast.showWithGravity(
      t('walletConnectRequest.transactionDataCopied'),
      Toast.SHORT,
      Toast.BOTTOM
    )
  }

  if (!moreInfoString) {
    return null
  }

  return (
    <View style={styles.container} testID="WalletConnectActionRequest/RequestPayload">
      <View style={styles.transactionDataContainer}>
        <Text style={styles.transactionDataLabel}>
          {t('walletConnectRequest.transactionDataLabel')}
        </Text>
        <Text testID="DappData" style={fontStyles.small} numberOfLines={1} ellipsizeMode="tail">
          {moreInfoString}
        </Text>
      </View>
      <Touchable
        hitSlop={variables.iconHitslop}
        onPress={handleCopyRequestPayload}
        testID="WalletConnectActionRequest/RequestPayload/Copy"
      >
        <CopyIcon />
      </Touchable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.Regular16,
    backgroundColor: colors.gray1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginTop: Spacing.Smallest8,
    marginBottom: Spacing.Large32,
  },
  transactionDataContainer: {
    flex: 1,
    marginRight: Spacing.Regular16,
  },
  transactionDataLabel: {
    ...fontStyles.small600,
    marginBottom: 4,
  },
})

export default ActionRequestPayload

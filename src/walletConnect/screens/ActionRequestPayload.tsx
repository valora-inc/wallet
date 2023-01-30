import { trimLeading0x } from '@celo/utils/lib/address'
import Clipboard from '@react-native-clipboard/clipboard'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import Toast from 'react-native-simple-toast'
import { WalletConnectEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Touchable from 'src/components/Touchable'
import CopyIcon from 'src/icons/CopyIcon'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { SupportedActions } from 'src/walletConnect/constants'

interface Props {
  dappName: string
  method: string
  params: any
}

function ActionRequestPayload({ method, params, dappName }: Props) {
  const { t } = useTranslation()
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
        ? Buffer.from(trimLeading0x(params[0]), 'hex').toString() || params[0]
        : null,
    [method, params]
  )

  const handleCopyRequestPayload = () => {
    Clipboard.setString(moreInfoString)
    ValoraAnalytics.track(WalletConnectEvents.wc_copy_request_payload, { method, dappName })
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
    <View style={styles.container}>
      <View style={styles.transactionDataContainer}>
        <Text style={styles.transactionDataLabel}>
          {t('walletConnectRequest.transactionDataLabel')}
        </Text>
        <Text testID="DappData" style={fontStyles.small} numberOfLines={1} ellipsizeMode="tail">
          {moreInfoString}
        </Text>
      </View>
      <Touchable hitSlop={variables.iconHitslop} onPress={handleCopyRequestPayload}>
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
    marginBottom: Spacing.Thick24,
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

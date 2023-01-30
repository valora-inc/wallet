import { trimLeading0x } from '@celo/utils/lib/address'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import SmsIcon from 'src/icons/SmsIcon'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { SupportedActions } from 'src/walletConnect/constants'

interface Props {
  method: string
  params: any
}

function ActionRequestMetadata({ method, params }: Props) {
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
      <SmsIcon />
    </View>
  )
}

// do not destructure props or else the type inference is lost

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

export default ActionRequestMetadata

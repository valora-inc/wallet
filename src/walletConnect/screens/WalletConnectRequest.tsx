import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { WalletConnectPairingOrigin } from 'src/analytics/types'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import ActionRequest from 'src/walletConnect/screens/ActionRequest'
import ConnectionTimedOut from 'src/walletConnect/screens/ConnectionTimedOut'
import SessionRequest from 'src/walletConnect/screens/SessionRequest'
import { WalletConnectRequestType } from 'src/walletConnect/types'

type Props = NativeStackScreenProps<StackParamList, Screens.WalletConnectRequest>

function WalletConnectRequest({ route: { params } }: Props) {
  const { t } = useTranslation()

  return (
    <View
      style={[
        styles.container,
        params.type === WalletConnectRequestType.Loading ||
        params.type === WalletConnectRequestType.TimeOut
          ? { justifyContent: 'center', alignItems: 'center' }
          : undefined,
      ]}
    >
      {params.type === WalletConnectRequestType.Loading && (
        <>
          <ActivityIndicator size="small" color={colors.greenBrand} />
          <Text style={styles.connecting}>
            {params.origin === WalletConnectPairingOrigin.Scan
              ? t('loadingFromScan')
              : t('loadingFromDeeplink')}
          </Text>
        </>
      )}

      {params.type === WalletConnectRequestType.Session && <SessionRequest {...params} />}

      {params.type === WalletConnectRequestType.Action && <ActionRequest {...params} />}

      {params.type === WalletConnectRequestType.TimeOut && <ConnectionTimedOut />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.Thick24,
    flex: 1,
  },
  connecting: {
    ...fontStyles.label,
    color: colors.gray4,
    marginTop: 20,
  },
})

export default WalletConnectRequest

import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { WalletConnectPairingOrigin } from 'src/analytics/types'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import ActionRequest from 'src/walletConnect/screens/ActionRequest'
import SessionRequest from 'src/walletConnect/screens/SessionRequest'
import { selectPendingSessions } from 'src/walletConnect/v1/selectors'

type Props = StackScreenProps<StackParamList, Screens.WalletConnectRequest>

function WalletConnectRequest({ navigation, route }: Props) {
  const { t } = useTranslation()
  const fromScan = route.params?.origin === WalletConnectPairingOrigin.Scan

  const pendingSessions = useSelector(selectPendingSessions)
  const { loading, pendingAction } = route.params

  return (
    <View style={styles.container}>
      {loading && (
        <>
          <ActivityIndicator size="small" color={colors.greenBrand} />
          <Text style={styles.connecting}>
            {fromScan ? t('loadingFromScan') : t('loadingFromDeeplink')}
          </Text>
        </>
      )}

      {pendingSessions.length > 0 && <SessionRequest navigation={navigation} />}

      {pendingAction && <ActionRequest navigation={navigation} pendingAction={pendingAction} />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.Thick24,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connecting: {
    ...fontStyles.label,
    color: colors.gray4,
    marginTop: 20,
  },
})

export default WalletConnectRequest

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
import variables from 'src/styles/variables'
import SessionRequest from 'src/walletConnect/screens/SessionRequest'
import { selectPendingActions, selectPendingSessions } from 'src/walletConnect/v1/selectors'

type Props = StackScreenProps<StackParamList, Screens.WalletConnectRequest>

function WalletConnectRequest({ navigation, route }: Props) {
  const { t } = useTranslation()
  const fromScan = route.params?.origin === WalletConnectPairingOrigin.Scan

  const pendingSessions = useSelector(selectPendingSessions)
  const pendingActions = useSelector(selectPendingActions)
  const loading = route.params.loading

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

      {pendingActions.length > 0 && <Text> Pending action </Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: variables.contentPadding,
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

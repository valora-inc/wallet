import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { WalletConnectEvents } from 'src/analytics/Events'
import { WalletConnectPairingOrigin } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { headerWithBackButton } from 'src/navigator/Headers'
import { isScreenOnForeground, navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'

const CONNECTION_TIMEOUT = 10_000

type Props = StackScreenProps<StackParamList, Screens.WalletConnectLoading>

function Loading({ route }: Props) {
  const { t } = useTranslation()

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (await isScreenOnForeground(Screens.WalletConnectLoading)) {
        ValoraAnalytics.track(WalletConnectEvents.wc_pairing_error, {
          error: 'timed out while waiting for a session',
        })
        navigate(Screens.WalletConnectResult, {
          title: t('timeoutTitle'),
          subtitle: t('timeoutSubtitle'),
        })
      }
    }, CONNECTION_TIMEOUT)

    return () => clearTimeout(timer)
  }, [])

  const fromScan = route.params.origin === WalletConnectPairingOrigin.Scan

  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color={colors.greenBrand} />
      <Text style={styles.connecting}>
        {fromScan ? t('loadingFromScan') : t('loadingFromDeeplink')}
      </Text>
    </View>
  )
}

Loading.navigationOptions = () => {
  return {
    ...headerWithBackButton,
  }
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

export default Loading

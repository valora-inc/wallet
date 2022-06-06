import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { WalletConnectPairingOrigin } from 'src/analytics/types'
import { headerWithBackButton, noHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import ActionRequest from 'src/walletConnect/screens/ActionRequest'
import ConnectionTimedOut from 'src/walletConnect/screens/ConnectionTimedOut'
import SessionRequest from 'src/walletConnect/screens/SessionRequest'

type Props = StackScreenProps<StackParamList, Screens.WalletConnectRequest>

enum ContentType {
  Loading,
  ConnectionRequest,
  ActionRequest,
  TimeOut,
}

function WalletConnectRequest({ navigation, route }: Props) {
  const { t } = useTranslation()
  const { pendingAction, timedOut, pendingSession, origin } = route.params
  const fromScan = origin === WalletConnectPairingOrigin.Scan

  let displayContent: ContentType = ContentType.Loading
  if (timedOut) {
    displayContent = ContentType.TimeOut
  } else if (pendingSession) {
    displayContent = ContentType.ConnectionRequest
  } else if (pendingAction) {
    displayContent = ContentType.ActionRequest
  }

  useEffect(() => {
    const isLoading = !timedOut && !pendingSession && !pendingAction
    navigation.setOptions(isLoading ? headerWithBackButton : noHeader)
  }, [navigation, route])

  return (
    <View style={styles.container}>
      {displayContent === ContentType.Loading && (
        <>
          <ActivityIndicator size="small" color={colors.greenBrand} />
          <Text style={styles.connecting}>
            {fromScan ? t('loadingFromScan') : t('loadingFromDeeplink')}
          </Text>
        </>
      )}

      {displayContent === ContentType.ConnectionRequest && pendingSession && (
        <SessionRequest navigation={navigation} pendingSession={pendingSession} />
      )}

      {displayContent === ContentType.ActionRequest && pendingAction && (
        <ActionRequest navigation={navigation} pendingAction={pendingAction} />
      )}

      {displayContent === ContentType.TimeOut && <ConnectionTimedOut />}
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

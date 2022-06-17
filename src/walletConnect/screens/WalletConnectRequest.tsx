import { useBottomSheetDynamicSnapPoints } from '@gorhom/bottom-sheet'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useMemo } from 'react'
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

type Props = StackScreenProps<StackParamList, Screens.WalletConnectRequest>
export const WALLET_CONNECT_BOTTOM_SHEET_HEIGHT = 600

function WalletConnectRequest({ navigation, route: { params } }: Props) {
  const { t } = useTranslation()

  const initialSnapPoints = useMemo(() => ['25%', 'CONTENT_HEIGHT'], [])

  const { animatedContentHeight, handleContentLayout } = useBottomSheetDynamicSnapPoints(
    initialSnapPoints
  )

  useEffect(() => {
    // @ts-ignore
    navigation.setOptions({ handleHeight: animatedContentHeight })
  }, [])

  console.log('=====animatedContentHeight', animatedContentHeight)

  setTimeout(() => {
    console.log('=====animatedContentHeight', animatedContentHeight)
  }, 1000)

  setTimeout(() => {
    console.log('=====animatedContentHeight', animatedContentHeight)
  }, 3000)

  return (
    <View
      style={[
        styles.container,
        params.type === WalletConnectRequestType.Loading ? { justifyContent: 'center' } : undefined,
      ]}
      onLayout={handleContentLayout}
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

      {params.type === WalletConnectRequestType.Session && (
        <SessionRequest pendingSession={params.pendingSession} />
      )}

      {params.type === WalletConnectRequestType.Action && (
        <ActionRequest pendingAction={params.pendingAction} />
      )}

      {params.type === WalletConnectRequestType.TimeOut && <ConnectionTimedOut />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.Thick24,
    // 24 is the width of the bottom sheet handle
    height: WALLET_CONNECT_BOTTOM_SHEET_HEIGHT - 24,
    alignItems: 'center',
  },
  connecting: {
    ...fontStyles.label,
    color: colors.gray4,
    marginTop: 20,
  },
})

export default WalletConnectRequest

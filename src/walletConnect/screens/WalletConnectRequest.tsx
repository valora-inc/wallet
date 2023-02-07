import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { BottomSheetScreenProps } from '@th3rdwave/react-navigation-bottom-sheet'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, LayoutChangeEvent, StyleSheet, Text } from 'react-native'
import { SafeAreaView, useSafeAreaFrame } from 'react-native-safe-area-context'
import { WalletConnectPairingOrigin } from 'src/analytics/types'
import { BOTTOM_SHEET_DEFAULT_HANDLE_HEIGHT } from 'src/navigator/constants'
import { Screens } from 'src/navigator/Screens'
import { BottomSheetParams, StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import ActionRequest from 'src/walletConnect/screens/ActionRequest'
import ConnectionTimedOut from 'src/walletConnect/screens/ConnectionTimedOut'
import SessionRequest from 'src/walletConnect/screens/SessionRequest'
import { WalletConnectRequestType } from 'src/walletConnect/types'

type Props = BottomSheetScreenProps<StackParamList, Screens.WalletConnectRequest> &
  BottomSheetParams

function WalletConnectRequest({ route: { params }, handleContentLayout }: Props) {
  const [scrollEnabled, setScrollEnabled] = useState(false)
  const { t } = useTranslation()
  const { height } = useSafeAreaFrame()

  const handleLayout = (event: LayoutChangeEvent) => {
    handleContentLayout(event)
    if (event.nativeEvent.layout.height >= height) {
      setScrollEnabled(true)
    }
  }

  return (
    <BottomSheetScrollView
      style={{ maxHeight: height - BOTTOM_SHEET_DEFAULT_HANDLE_HEIGHT }}
      scrollEnabled={scrollEnabled}
    >
      <SafeAreaView
        edges={['bottom']}
        style={[
          styles.container,
          params.type === WalletConnectRequestType.Loading ||
          params.type === WalletConnectRequestType.TimeOut
            ? styles.loadingTimeoutContainer
            : undefined,
        ]}
        onLayout={handleLayout}
      >
        {params.type === WalletConnectRequestType.Loading && (
          <>
            <ActivityIndicator color={colors.greenBrand} />
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
      </SafeAreaView>
    </BottomSheetScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.Thick24,
  },
  loadingTimeoutContainer: {
    alignItems: 'center',
    minHeight: 370,
  },
  connecting: {
    ...fontStyles.label,
    color: colors.gray4,
    marginTop: Spacing.Thick24,
  },
})

export default WalletConnectRequest

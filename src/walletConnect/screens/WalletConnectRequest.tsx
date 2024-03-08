import { BottomSheetScreenProps } from '@th3rdwave/react-navigation-bottom-sheet'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, Text } from 'react-native'
import { WalletConnectPairingOrigin } from 'src/analytics/types'
import BottomSheetScrollView from 'src/components/BottomSheetScrollView'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import ActionRequest from 'src/walletConnect/screens/ActionRequest'
import ConnectionTimedOut from 'src/walletConnect/screens/ConnectionTimedOut'
import SessionRequest from 'src/walletConnect/screens/SessionRequest'
import { WalletConnectRequestType } from 'src/walletConnect/types'

type Props = BottomSheetScreenProps<StackParamList, Screens.WalletConnectRequest>

function WalletConnectRequest({ route: { params } }: Props) {
  const { t } = useTranslation()

  return (
    <BottomSheetScrollView
      isScreen
      containerStyle={
        params.type === WalletConnectRequestType.Loading ||
        params.type === WalletConnectRequestType.TimeOut
          ? styles.loadingTimeoutContainer
          : undefined
      }
    >
      {params.type === WalletConnectRequestType.Loading && (
        <>
          <ActivityIndicator color={colors.primary} />
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
    </BottomSheetScrollView>
  )
}

const styles = StyleSheet.create({
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

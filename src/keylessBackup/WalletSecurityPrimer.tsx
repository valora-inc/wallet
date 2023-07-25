import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { KeylessBackupEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import Chain from 'src/icons/Chain'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import fontStyles from 'src/styles/fonts'

function onPressContinue() {
  ValoraAnalytics.track(KeylessBackupEvents.wallet_security_primer_get_started)
  navigate(Screens.SetUpKeylessBackup)
}

type Props =
  | NativeStackScreenProps<StackParamList, Screens.WalletSecurityPrimer>
  | NativeStackScreenProps<StackParamList, Screens.WalletSecurityPrimerDrawer>

function WalletSecurityPrimer({ route }: Props) {
  const { t } = useTranslation()
  const showDrawerTopBar = route.params?.showDrawerTopBar
  return (
    <SafeAreaView style={styles.container} edges={showDrawerTopBar ? undefined : ['bottom']}>
      {showDrawerTopBar && <DrawerTopBar testID="WalletSecurityPrimer/DrawerTopBar" />}
      <ScrollView style={styles.scrollContainer}>
        <Chain style={styles.chainIcon} />
        <Text style={styles.title}>{t('walletSecurityPrimer.title')}</Text>
        <Text style={styles.description}>{t('walletSecurityPrimer.description')}</Text>
      </ScrollView>
      <Button
        testID="WalletSecurityPrimer/GetStarted"
        onPress={onPressContinue}
        text={t('getStarted')}
        size={BtnSizes.FULL}
        type={BtnTypes.ONBOARDING}
        style={styles.button}
      />
    </SafeAreaView>
  )
}

export default WalletSecurityPrimer

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    flexGrow: 1,
  },
  scrollContainer: {
    padding: 24,
    paddingTop: 36,
  },
  chainIcon: {
    alignSelf: 'center',
  },
  title: {
    ...fontStyles.large600,
    fontSize: 20,
    lineHeight: 28,
    textAlign: 'center',
    marginTop: 24,
  },
  description: {
    ...fontStyles.regular,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 16,
  },
  button: {
    padding: 24,
  },
})

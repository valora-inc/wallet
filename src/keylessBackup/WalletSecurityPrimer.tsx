import React from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native'
import { KeylessBackupEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import BackChevron from 'src/icons/BackChevron'
import Chain from 'src/icons/Chain'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import fontStyles from 'src/styles/fonts'

function onPressContinue() {
  ValoraAnalytics.track(KeylessBackupEvents.wallet_security_primer_get_started)
  navigate(Screens.SetUpKeylessBackup)
}

function WalletSecurityPrimer() {
  const { t } = useTranslation()
  return (
    <SafeAreaView style={styles.container}>
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

WalletSecurityPrimer.navigationOptions = () => ({
  ...emptyHeader,
  headerLeft: () => (
    <TopBarIconButton
      style={styles.backButton}
      icon={<BackChevron height={16} />}
      onPress={navigateBack}
    />
  ),
})

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
  backButton: {
    marginLeft: 16,
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

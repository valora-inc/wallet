import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { KeylessBackupEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import Card from 'src/components/Card'
import Times from 'src/icons/Times'
import EnvelopeIcon from 'src/keylessBackup/EnvelopeIcon'
import SmartphoneIcon from 'src/keylessBackup/SmartphoneIcon'
import { KeylessBackupFlow } from 'src/keylessBackup/types'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import { default as Colors, default as colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'

function onPressContinue() {
  ValoraAnalytics.track(KeylessBackupEvents.set_up_keyless_backup_screen_continue)
  navigate(Screens.SignInWithEmail, { keylessBackupFlow: KeylessBackupFlow.Setup })
}

function SetUpKeylessBackup() {
  const { t } = useTranslation()
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.title}>{t('setUpKeylessBackup.title')}</Text>
        <Text style={styles.subtitle}>{t('setUpKeylessBackup.subtitle')}</Text>
        <Card style={styles.authFactorsCard} rounded={true} shadow={null}>
          <View style={styles.authFactorsContainer}>
            <View style={styles.authFactorLine}>
              <EnvelopeIcon style={styles.envelopeIcon} />
              <Text style={styles.authFactorText}>{t('setUpKeylessBackup.emailAddress')}</Text>
            </View>
            <View style={styles.authFactorLine}>
              <SmartphoneIcon style={styles.smartphoneIcon} />
              <Text style={styles.authFactorText}>{t('setUpKeylessBackup.phoneNumber')}</Text>
            </View>
          </View>

          <Text style={styles.reminderText}>
            <Trans i18nKey="setupKeylessBackupReminder">
              {/* namespaced keys did not work for this */}
              <Text style={styles.reminderPrefix} /> {/* prefix string gets injected here */}
            </Trans>
          </Text>
        </Card>
      </ScrollView>
      <Button
        testID="SetUpKeylessBackup/Continue"
        onPress={onPressContinue}
        text={t('continue')}
        size={BtnSizes.FULL}
        type={BtnTypes.ONBOARDING}
        style={styles.button}
      />
    </SafeAreaView>
  )
}

SetUpKeylessBackup.navigationOptions = () => ({
  ...emptyHeader,
  headerLeft: () => (
    <TopBarIconButton
      style={styles.cancelButton}
      icon={<Times height={16} />}
      onPress={navigateBack}
    />
  ),
})

export default SetUpKeylessBackup

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    flexGrow: 1,
  },
  scrollContainer: {
    padding: 24,
    paddingTop: 36,
  },
  cancelButton: {
    marginLeft: 16,
  },
  title: {
    ...fontStyles.h2,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subtitle: {
    ...fontStyles.regular,
    textAlign: 'center',
    paddingVertical: 8,
  },
  authFactorsCard: {
    backgroundColor: Colors.onboardingBackground,
    marginTop: 16,
  },
  authFactorsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: `${colors.black}33`, // alpha 0.2 (20% opacity)
    paddingBottom: variables.contentPadding,
    marginHorizontal: 16,
  },
  authFactorLine: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  smartphoneIcon: {
    alignSelf: 'center',
    marginLeft: 3,
    marginRight: 3,
  },
  envelopeIcon: {
    alignSelf: 'center',
  },
  authFactorText: {
    ...fontStyles.regular500,
    paddingLeft: 16,
  },
  reminderPrefix: {
    ...fontStyles.small600,
  },
  reminderText: {
    ...fontStyles.small,
    textAlign: 'center',
    paddingVertical: variables.contentPadding,
    paddingHorizontal: 8,
    marginTop: 12,
  },
  button: {
    padding: 24,
  },
})

import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { KeylessBackupEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import Card from 'src/components/Card'
import TextButton from 'src/components/TextButton'
import EnvelopeIcon from 'src/keylessBackup/EnvelopeIcon'
import SmartphoneIcon from 'src/keylessBackup/SmartphoneIcon'
import { KeylessBackupFlow } from 'src/keylessBackup/types'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { default as Colors, default as colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

function onPressContinue() {
  ValoraAnalytics.track(KeylessBackupEvents.cab_setup_continue)
  navigate(Screens.SignInWithEmail, { keylessBackupFlow: KeylessBackupFlow.Setup })
}

function onPressRecoveryPhrase() {
  ValoraAnalytics.track(KeylessBackupEvents.cab_setup_recovery_phrase)
  navigate(Screens.BackupIntroduction)
}

function SetUpKeylessBackup() {
  const { t } = useTranslation()
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.title}>{t('setUpKeylessBackup.title')}</Text>
        <Text style={styles.subtitle}>{t('setUpKeylessBackup.subtitle')}</Text>
        <Card style={styles.authFactorsCard} shadow={null}>
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
        <TextButton
          testID="SetUpKeylessBackup/RecoveryPhrase"
          style={styles.recoveryPhrase}
          onPress={onPressRecoveryPhrase}
        >
          {t('setUpKeylessBackup.useRecoveryPhrase')}
        </TextButton>
      </ScrollView>
      <Button
        testID="SetUpKeylessBackup/Continue"
        onPress={onPressContinue}
        text={t('continue')}
        size={BtnSizes.FULL}
        type={BtnTypes.PRIMARY}
        style={styles.button}
      />
    </SafeAreaView>
  )
}

SetUpKeylessBackup.navigationOptions = {
  ...headerWithBackButton,
}

export default SetUpKeylessBackup

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    flexGrow: 1,
  },
  scrollContainer: {
    padding: Spacing.Thick24,
  },
  title: {
    ...typeScale.labelSemiBoldLarge,
    textAlign: 'center',
    color: Colors.black,
  },
  subtitle: {
    ...typeScale.bodyMedium,
    textAlign: 'center',
    paddingVertical: Spacing.Regular16,
    color: Colors.black,
  },
  authFactorsCard: {
    backgroundColor: Colors.gray1,
    marginTop: Spacing.Smallest8,
    borderColor: Colors.gray2,
    borderWidth: 1,
    borderRadius: 10,
    padding: Spacing.Thick24,
  },
  authFactorsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: `${colors.black}33`, // alpha 0.2 (20% opacity)
    gap: Spacing.Thick24,
    paddingBottom: Spacing.Thick24,
  },
  authFactorLine: {
    flexDirection: 'row',
    gap: 10,
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
    ...typeScale.labelMedium,
    color: Colors.black,
  },
  reminderPrefix: {
    ...typeScale.labelSemiBoldXSmall,
    color: Colors.black,
  },
  reminderText: {
    ...typeScale.bodyXSmall,
    textAlign: 'center',
    marginTop: Spacing.Thick24,
    color: Colors.black,
  },
  recoveryPhrase: {
    ...typeScale.labelSmall,
    textAlign: 'center',
    margin: Spacing.Thick24,
  },
  button: {
    padding: Spacing.Thick24,
  },
})

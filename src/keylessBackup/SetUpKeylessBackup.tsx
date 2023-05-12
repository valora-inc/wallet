import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Trans, useTranslation } from 'react-i18next'
import fontStyles from 'src/styles/fonts'
import React from 'react'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { emptyHeader } from 'src/navigator/Headers'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import Times from 'src/icons/Times'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import Card from 'src/components/Card'
import Colors from 'src/styles/colors'
import variables from 'src/styles/variables'
import colors from 'src/styles/colors'
import EnvelopeIcon from 'src/keylessBackup/EnvelopeIcon'
import SmartphoneIcon from 'src/keylessBackup/SmartphoneIcon'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { KeylessBackupEvents } from 'src/analytics/Events'
import { Screens } from 'src/navigator/Screens'

function onPressContinue() {
  ValoraAnalytics.track(KeylessBackupEvents.set_up_keyless_backup_screen_continue)
  navigate(Screens.SignInWithEmail)
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
    borderBottomColor: colors.dark_0_2,
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

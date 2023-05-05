import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Trans, useTranslation } from 'react-i18next'
import fontStyles from 'src/styles/fonts'
import React from 'react'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { emptyHeader } from 'src/navigator/Headers'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import Times from 'src/icons/Times'
import { navigateBack } from 'src/navigator/NavigationService'
import Card from 'src/components/Card'
import Colors from 'src/styles/colors'
import variables from 'src/styles/variables'
import colors from 'src/styles/colors'

// const TAG = 'cloudBackup/SetUpKeylessBackup'

function onPressContinue() {
  // TODO analytics track event
  // TODO navigate
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
            {/* TODO add email and phone icons */}
            <Text style={styles.authFactorText}>{t('setUpKeylessBackup.emailAddress')}</Text>
            <Text style={styles.authFactorText}>{t('setUpKeylessBackup.phoneNumber')}</Text>
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
      icon={<Times height={24} />}
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
  cancelButton: {
    marginLeft: 16,
  },
  authFactorsCard: {
    backgroundColor: Colors.onboardingBackground,
    marginTop: 16,
  },
  authFactorsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray2,
    paddingBottom: variables.contentPadding,
    marginHorizontal: 16,
  },
  authFactorText: {
    ...fontStyles.regular500,
    paddingVertical: variables.contentPadding,
  },
  reminderPrefix: {
    ...fontStyles.small600,
  },
  reminderText: {
    ...fontStyles.small,
    textAlign: 'center',
    padding: variables.contentPadding,
    marginTop: 16,
  },
  scrollContainer: {
    padding: 24,
    paddingTop: 64,
  },
  title: {
    ...fontStyles.h1,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subtitle: {
    ...fontStyles.large,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  button: {
    padding: 24,
  },
})

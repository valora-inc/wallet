import { SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import fontStyles from 'src/styles/fonts'
import React from 'react'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { emptyHeader } from 'src/navigator/Headers'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import Times from 'src/icons/Times'
import { navigateBack } from 'src/navigator/NavigationService'
import Card from 'src/components/Card'
import Colors from 'src/styles/colors'

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
          <Text style={styles.authFactorText}>{t('setUpKeylessBackup.emailAddress')}</Text>
          <Text style={styles.authFactorText}>{t('setUpKeylessBackup.phoneNumber')}</Text>
          <Text style={styles.reminderText}>
            <Text style={styles.reminderPrefix}>
              {t('setupKeylessBackup.reminderPrefix') + ', '}
            </Text>
            {t('setUpKeylessBackup.reminder')}
          </Text>
        </Card>
        <Button
          testID="SetUpKeylessBackup/Continue"
          onPress={onPressContinue}
          text={t('continue')}
          size={BtnSizes.FULL}
          type={BtnTypes.ONBOARDING}
        />
      </ScrollView>
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
  },
  authFactorText: {
    ...fontStyles.regular500,
  },
  reminderPrefix: {
    ...fontStyles.small600,
  },
  reminderText: {
    ...fontStyles.small,
  },
  scrollContainer: {
    padding: 24,
    paddingTop: 40,
  },
  title: {
    ...fontStyles.h1,
    textAlign: 'center',
    marginTop: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    ...fontStyles.large,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  // bottomButtonContainer: {
  //   padding: Spacing.Thick24,
  //   alignItems: 'center',
  // },
})

import { SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import fontStyles from 'src/styles/fonts'
import React from 'react'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { emptyHeader } from 'src/navigator/Headers'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import Times from 'src/icons/Times'
import { navigateBack } from 'src/navigator/NavigationService'

// const TAG = 'cloudBackup/SetUpKeylessBackup'

function onPressContinue() {
  // TODO analytics track event
  // TODO navigate
}

function SetUpKeylessBackup() {
  const { t } = useTranslation()
  return (
    <SafeAreaView style={styles.container}>
      {/* TODO x button */}
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.title}>{t('setUpKeylessBackup.title')}</Text>
        <Text style={styles.subtitle}>{t('setUpKeylessBackup.subtitle')}</Text>
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
  headerLeft: () => <TopBarIconButton icon={<Times height={24} />} onPress={navigateBack} />, // TODO need more left padding on the X button
})

export default SetUpKeylessBackup

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    flexGrow: 1,
  },
  // cancelButton: {
  //   padding: 60,
  //   fontWeight: 'bold',
  // },
  scrollContainer: {
    padding: 24,
    paddingTop: 40,
  },
  title: {
    textAlign: 'center',
    marginTop: 50,
    ...fontStyles.h1,
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
    ...fontStyles.regular,
  },
  // bottomButtonContainer: {
  //   padding: Spacing.Thick24,
  //   alignItems: 'center',
  // },
})

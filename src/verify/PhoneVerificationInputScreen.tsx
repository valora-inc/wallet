import { StackScreenProps, useHeaderHeight } from '@react-navigation/stack'
import React, { useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import BackButton from 'src/components/BackButton'
import Dialog from 'src/components/Dialog'
import { HeaderTitleWithSubtitle } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

function PhoneVerificationInpuScreen({
  route,
  navigation,
}: StackScreenProps<StackParamList, Screens.PhoneVerificationInputScreen>) {
  const [showHelpDialog, setShowHelpDialog] = useState(false)

  const { t } = useTranslation()
  const dispatch = useDispatch()
  const headerHeight = useHeaderHeight()

  const onPressSkip = () => {
    // TODO handle skip
  }

  const onPressHelp = () => {
    setShowHelpDialog(true)
  }

  const onPressHelpDismiss = () => {
    setShowHelpDialog(false)
  }

  useLayoutEffect(() => {
    const registrationStep = route.params?.registrationStep
    const title = !registrationStep
      ? t('phoneVerificationInput.title')
      : () => (
          <HeaderTitleWithSubtitle
            title={t('phoneVerificationInput.title')}
            subTitle={t('registrationSteps', {
              step: registrationStep.step,
              totalSteps: registrationStep.totalSteps,
            })}
          />
        )

    navigation.setOptions({
      headerTitle: title,
      headerRight: () => (
        <TopBarTextButton
          title={t('phoneVerificationInput.help')}
          testID="PhoneVerificationHelpHeader"
          onPress={onPressHelp}
          titleStyle={{ color: colors.goldDark }}
        />
      ),
      headerLeft: () => <BackButton />,
      headerTransparent: true,
    })
  }, [navigation, route.params])

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={[styles.scrollContainer, headerHeight ? { marginTop: headerHeight } : undefined]}
      >
        <Text style={styles.body}>{t('phoneVerificationInput.description')}</Text>
        {/* TODO put in code here */}
      </ScrollView>
      <Dialog
        testID="PhoneVerificationInputHelpDialog"
        title={t('phoneVerificationInput.helpDialog.title')}
        isVisible={showHelpDialog}
        actionText={t('phoneVerificationInput.helpDialog.dismiss')}
        actionPress={onPressHelpDismiss}
        secondaryActionPress={onPressSkip}
        secondaryActionText={t('phoneVerificationInput.helpDialog.skip')}
        onBackgroundPress={onPressHelpDismiss}
      >
        {t('phoneVerificationInput.helpDialog.body')}
      </Dialog>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.onboardingBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flex: 1,
    padding: Spacing.Thick24,
    width: '100%',
  },
  body: {
    ...fontStyles.regular,
    marginBottom: Spacing.Thick24,
  },
})

export default PhoneVerificationInpuScreen

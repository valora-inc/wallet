import { StackScreenProps, useHeaderHeight } from '@react-navigation/stack'
import React, { useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { registrationStepsSelector } from 'src/app/selectors'
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
}: StackScreenProps<StackParamList, Screens.VerificationEducationScreen>) {
  const [showHelpDialog, setShowHelpDialog] = useState(false)

  const { t } = useTranslation()
  const dispatch = useDispatch()
  const headerHeight = useHeaderHeight()
  const insets = useSafeAreaInsets()

  const { step, totalSteps } = useSelector(registrationStepsSelector)

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
    const title = route.params?.hideOnboardingStep
      ? t('phoneVerificationInput.title')
      : () => (
          <HeaderTitleWithSubtitle
            title={t('phoneVerificationInput.title')}
            subTitle={t('registrationSteps', { step, totalSteps })}
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
      headerLeft: () => route.params?.hideOnboardingStep && <BackButton />,
    })
  }, [navigation, step, totalSteps, route.params])

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={headerHeight ? { marginTop: headerHeight } : undefined}
        contentContainerStyle={[styles.scrollContainer, insets && { marginBottom: insets.bottom }]}
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
        isActionHighlighted={false}
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
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  body: {
    ...fontStyles.regular,
    marginBottom: Spacing.Thick24,
  },
})

export default PhoneVerificationInpuScreen

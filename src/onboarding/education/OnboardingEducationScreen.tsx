import { useHeaderHeight } from '@react-navigation/elements'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import Education, { EducationTopic } from 'src/account/Education'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { BtnTypes } from 'src/components/Button'
import Logo, { LogoTypes } from 'src/icons/Logo'
import { onboardingEducation1, onboardingEducation2, onboardingEducation3 } from 'src/images/Images'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import LanguageButton from 'src/onboarding/LanguageButton'
import colors from 'src/styles/colors'
import progressDots from 'src/styles/progressDots'
import { Spacing } from 'src/styles/styles'

function useStep() {
  const { t } = useTranslation()

  return React.useMemo(() => {
    // Order is highest performing from experiment - Spend, Impact, Payment
    return [
      {
        title: t('onboardingEducation.step3'),
        isTopTitle: true,
        image: onboardingEducation3,
        topic: EducationTopic.onboarding,
      },
      {
        title: t('onboardingEducation.step2'),
        isTopTitle: true,
        image: onboardingEducation2,
        topic: EducationTopic.onboarding,
      },
      {
        title: t('onboardingEducation.step1'),
        isTopTitle: true,
        image: onboardingEducation1,
        topic: EducationTopic.onboarding,
      },
    ]
  }, [t])
}

export default function OnboardingEducationScreen() {
  const { t } = useTranslation()

  const headerHeight = useHeaderHeight()
  const stepInfo = useStep()

  useEffect(() => {
    // This is a sanity check that can be used to verify that the randomization is working
    ValoraAnalytics.track(OnboardingEvents.onboarding_education_start)
  }, [])

  const onFinish = () => {
    // This will track which variant and order is the most successful
    ValoraAnalytics.track(OnboardingEvents.onboarding_education_complete)
    navigate(Screens.Welcome)
  }

  return (
    <Education
      style={[styles.container, headerHeight ? { paddingTop: headerHeight } : undefined]}
      edges={['bottom']}
      embeddedNavBar={null}
      stepInfo={stepInfo}
      finalButtonType={BtnTypes.ONBOARDING}
      finalButtonText={t('getStarted')}
      buttonType={BtnTypes.ONBOARDING_SECONDARY}
      buttonText={t('next')}
      dotStyle={progressDots.circlePassiveOnboarding}
      activeDotStyle={progressDots.circleActiveOnboarding}
      onFinish={onFinish}
    />
  )
}

OnboardingEducationScreen.navigationOptions = {
  ...nuxNavigationOptions,
  headerLeft: () => {
    return <Logo type={LogoTypes.DARK} />
  },
  headerLeftContainerStyle: { paddingLeft: Spacing.Thick24 },
  headerRight: () => <LanguageButton />,
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.onboardingBackground,
  },
})

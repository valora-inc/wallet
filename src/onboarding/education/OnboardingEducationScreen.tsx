import { useHeaderHeight } from '@react-navigation/stack'
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

  // Randomize array in-place - Durstenfeld's shuffle algorithm
  const shuffleArray = (arr: Array<any>) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = arr[i]
      arr[i] = arr[j]
      arr[j] = temp
    }
    return arr
  }

  return React.useMemo(() => {
    // ScreenSet 0 is the old onboarding screens
    // ScreenSet 1 is the new onboarding screens
    const screenSet = Math.random() < 0.5 ? 0 : 1
    const variant = screenSet === 0 ? 'old' : 'new'
    const steps = shuffleArray([
      {
        title: [t('onboardingEducation.step1'), t('onboardingEducation.payment')][screenSet],
        isTopTitle: true,
        image: onboardingEducation1,
        topic: EducationTopic.onboarding,
        valueProp: 'Payment',
        variant,
      },
      {
        title: [t('onboardingEducation.step2'), t('onboardingEducation.impact')][screenSet],
        isTopTitle: true,
        image: onboardingEducation2,
        topic: EducationTopic.onboarding,
        valueProp: 'Impact',
        variant,
      },
      {
        title: [t('onboardingEducation.step3'), t('onboardingEducation.spend')][screenSet],
        isTopTitle: true,
        image: onboardingEducation3,
        topic: EducationTopic.onboarding,
        valueProp: 'Spend',
        variant,
      },
    ])
    const order = steps.map((item: { valueProp: any }) => item.valueProp).join('-')
    return { steps, variant, order }
  }, [t])
}

export default function OnboardingEducationScreen() {
  const { t } = useTranslation()

  const headerHeight = useHeaderHeight()
  const stepInfo = useStep()

  useEffect(() => {
    ValoraAnalytics.track(OnboardingEvents.onboarding_education_start)
    // This is a sanity check that can be used to verify that the randomization is working
    ValoraAnalytics.track(OnboardingEvents.onboarding_education_start_experiment, {
      variant: stepInfo.variant,
      order: stepInfo.order,
    })
  }, [])

  const onFinish = () => {
    ValoraAnalytics.track(OnboardingEvents.onboarding_education_complete)
    // This will track which variant and order is the most successful
    ValoraAnalytics.track(OnboardingEvents.onboarding_education_complete_experiment, {
      variant: stepInfo.variant,
      order: stepInfo.order,
    })
    navigate(Screens.Welcome)
  }

  return (
    <Education
      style={[styles.container, headerHeight ? { paddingTop: headerHeight } : undefined]}
      edges={['bottom']}
      embeddedNavBar={null}
      stepInfo={stepInfo.steps}
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

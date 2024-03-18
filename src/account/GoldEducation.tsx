import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform } from 'react-native'
import Education, { EducationTopic, EmbeddedNavBar } from 'src/account/Education'
import { setGoldEducationCompleted } from 'src/account/actions'
import { celoEducationCompletedSelector } from 'src/account/selectors'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { BtnTypes } from 'src/components/Button'
import { celoEducation1, celoEducation2, celoEducation3, celoEducation4 } from 'src/images/Images'
import { noHeader } from 'src/navigator/Headers'
import { navigateBack, navigateClearingStack, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'

export default function GoldEducation() {
  const { t } = useTranslation()

  const dispatch = useDispatch()

  const isCeloEducationComplete = useSelector(celoEducationCompletedSelector)

  const onFinish = () => {
    ValoraAnalytics.track(OnboardingEvents.celo_education_complete)

    if (isCeloEducationComplete) {
      navigateBack()
    } else {
      getFeatureGate(StatsigFeatureGates.USE_TAB_NAVIGATOR)
        ? navigateHome()
        : navigateClearingStack(Screens.DrawerNavigator, {
            initialScreen: Screens.ExchangeHomeScreen,
          })
      dispatch(setGoldEducationCompleted())
    }
  }

  const stepInfo = useStep()

  useEffect(() => {
    ValoraAnalytics.track(OnboardingEvents.celo_education_start)
  }, [])

  return (
    <Education
      embeddedNavBar={EmbeddedNavBar.Close}
      stepInfo={stepInfo}
      onFinish={onFinish}
      finalButtonType={BtnTypes.PRIMARY}
      finalButtonText={t('done')}
      buttonText={t('next')}
    />
  )
}

GoldEducation.navigationOptions = {
  ...noHeader,
  ...Platform.select({
    ios: { animation: 'slide_from_bottom' },
  }),
}

function useStep() {
  const { t } = useTranslation()

  return React.useMemo(() => {
    return [
      {
        image: celoEducation1,
        topic: EducationTopic.celo,
      },
      {
        image: celoEducation2,
        topic: EducationTopic.celo,
      },
      {
        image: celoEducation3,
        topic: EducationTopic.celo,
      },
      {
        image: celoEducation4, // Placeholder Image
        topic: EducationTopic.celo,
      },
    ].map((step, index) => {
      return {
        ...step,
        title: t(`goldEducationSteps.${index}.title`),
        text: t(`goldEducationSteps.${index}.text`),
      }
    })
  }, [])
}

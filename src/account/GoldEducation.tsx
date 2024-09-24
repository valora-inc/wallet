import React, { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform } from 'react-native'
import Education, { type EducationStep, EducationTopic } from 'src/account/Education'
import { setGoldEducationCompleted } from 'src/account/actions'
import { celoEducationCompletedSelector } from 'src/account/selectors'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { OnboardingEvents } from 'src/analytics/Events'
import { BtnTypes } from 'src/components/Button'
import { celoEducation1, celoEducation2, celoEducation3, celoEducation4 } from 'src/images/Images'
import { noHeader } from 'src/navigator/Headers'
import { navigateBack, navigateHome } from 'src/navigator/NavigationService'
import { useDispatch, useSelector } from 'src/redux/hooks'

export default function GoldEducation() {
  const { t } = useTranslation()

  const dispatch = useDispatch()

  const isCeloEducationComplete = useSelector(celoEducationCompletedSelector)

  const onFinish = () => {
    AppAnalytics.track(OnboardingEvents.celo_education_complete)

    if (isCeloEducationComplete) {
      navigateBack()
    } else {
      navigateHome()
      dispatch(setGoldEducationCompleted())
    }
  }

  const stepInfo = useStep()

  useEffect(() => {
    AppAnalytics.track(OnboardingEvents.celo_education_start)
  }, [])

  return (
    <Education
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

function useStep(): EducationStep[] {
  const { t } = useTranslation()

  return useMemo(() => {
    return [
      {
        image: celoEducation1,
        topic: EducationTopic.celo,
        title: t(`goldEducationSteps.0.title`),
        text: t(`goldEducationSteps.0.text`),
      },
      {
        image: celoEducation2,
        topic: EducationTopic.celo,
        title: t(`goldEducationSteps.1.title`),
        text: t(`goldEducationSteps.1.text`),
      },
      {
        image: celoEducation3,
        topic: EducationTopic.celo,
        title: t(`goldEducationSteps.2.title`),
        text: t(`goldEducationSteps.2.text`),
      },
      {
        image: celoEducation4, // Placeholder Image
        topic: EducationTopic.celo,
        title: t(`goldEducationSteps.3.title`),
        text: t(`goldEducationSteps.3.text`),
      },
    ]
  }, [])
}

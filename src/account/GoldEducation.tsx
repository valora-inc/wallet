import { TransitionPresets } from '@react-navigation/stack'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import Education, { EducationTopic, EmbeddedNavBar } from 'src/account/Education'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { BtnTypes } from 'src/components/Button'
import { setEducationCompleted } from 'src/goldToken/actions'
import { celoEducation1, celoEducation2, celoEducation3, celoEducation4 } from 'src/images/Images'
import { noHeader } from 'src/navigator/Headers'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import useSelector from 'src/redux/useSelector'

export default function GoldEducation() {
  const { t } = useTranslation()

  const dispatch = useDispatch()

  const isCeloEducationComplete = useSelector((state) => state.goldToken.educationCompleted)

  const onFinish = () => {
    ValoraAnalytics.track(OnboardingEvents.celo_education_complete)

    if (isCeloEducationComplete) {
      navigateBack()
    } else {
      navigate(Screens.ExchangeHomeScreen)
      dispatch(setEducationCompleted())
    }
  }

  const stepInfo = useStep()

  useEffect(() => {
    ValoraAnalytics.track(OnboardingEvents.celo_education_start)
  }, [])

  return (
    <Education
      embeddedNavBar={isCeloEducationComplete ? EmbeddedNavBar.Close : EmbeddedNavBar.Drawer}
      stepInfo={stepInfo}
      onFinish={onFinish}
      finalButtonType={BtnTypes.TERTIARY}
      finalButtonText={t('done')}
      buttonText={t('next')}
    />
  )
}

GoldEducation.navigationOptions = {
  ...noHeader,
  ...TransitionPresets.ModalTransition,
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

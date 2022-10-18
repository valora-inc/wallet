import { StackScreenProps, TransitionPresets } from '@react-navigation/stack'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Education, { EducationTopic, EmbeddedNavBar } from 'src/account/Education'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { BtnTypes } from 'src/components/Button'
import { noHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'

type Props = StackScreenProps<StackParamList, Screens.AccountKeyEducation>

export default function AccountKeyEducation(props: Props) {
  function onComplete() {
    ValoraAnalytics.track(OnboardingEvents.backup_education_complete)
    if (props.route.params?.nextScreen) {
      navigate(props.route.params?.nextScreen)
    } else {
      navigate(Screens.BackupPhrase)
    }
  }

  const { t } = useTranslation()

  const steps = useSteps()

  useEffect(() => {
    ValoraAnalytics.track(OnboardingEvents.backup_education_start)
  }, [])

  return (
    <Education
      embeddedNavBar={EmbeddedNavBar.Close}
      stepInfo={steps}
      onFinish={onComplete}
      experimentalSwiper={true}
      finalButtonText={t('completeEducation')}
      buttonText={t('next')}
      finalButtonType={BtnTypes.PRIMARY}
    />
  )
}

AccountKeyEducation.navigationOptions = {
  ...noHeader,
  ...TransitionPresets.ModalTransition,
}

function useSteps() {
  const { t } = useTranslation()
  return React.useMemo(
    () =>
      [
        { image: null, topic: EducationTopic.backup },
        { image: null, topic: EducationTopic.backup },
        { image: null, topic: EducationTopic.backup },
        { image: null, topic: EducationTopic.backup },
      ].map((step, index) => {
        return {
          ...step,
          title: t(`guide.${index}.title`),
          text: t(`guide.${index}.text`),
        }
      }),
    []
  )
}

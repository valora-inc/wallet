import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform } from 'react-native'
import Education, { type EducationStep, EducationTopic } from 'src/account/Education'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { OnboardingEvents } from 'src/analytics/Events'
import { BtnTypes } from 'src/components/Button'
import { accountKey1, accountKey2, accountKey3, accountKey4 } from 'src/images/Images'
import { noHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'

type Props = NativeStackScreenProps<StackParamList, Screens.AccountKeyEducation>

export default function AccountKeyEducation(props: Props) {
  function onComplete() {
    AppAnalytics.track(OnboardingEvents.backup_education_complete)
    if (props.route.params?.origin === 'cabOnboarding') {
      navigate(Screens.OnboardingRecoveryPhrase, { origin: 'cabOnboarding' })
    } else if (props.route.params?.nextScreen) {
      navigate(props.route.params?.nextScreen)
    } else {
      navigate(Screens.BackupPhrase)
    }
  }

  const { t } = useTranslation()

  const steps = useSteps()

  useEffect(() => {
    AppAnalytics.track(OnboardingEvents.backup_education_start)
  }, [])

  return (
    <Education
      stepInfo={steps}
      onFinish={onComplete}
      finalButtonText={t('completeEducation')}
      buttonText={t('next')}
      finalButtonType={BtnTypes.PRIMARY}
    />
  )
}

AccountKeyEducation.navigationOptions = {
  ...noHeader,
  ...Platform.select({
    ios: { animation: 'slide_from_bottom' },
  }),
}

function useSteps(): EducationStep[] {
  const { t } = useTranslation()
  return useMemo(
    () => [
      {
        image: accountKey1,
        topic: EducationTopic.backup,
        title: t(`guide.0.title`),
        text: t(`guide.0.text`),
      },
      {
        image: accountKey2,
        topic: EducationTopic.backup,
        title: t(`guide.1.title`),
        text: t(`guide.1.text`),
      },
      {
        image: accountKey3,
        topic: EducationTopic.backup,
        title: t(`guide.2.title`),
        text: t(`guide.2.text`),
      },
      {
        image: accountKey4,
        topic: EducationTopic.backup,
        title: t(`guide.3.title`),
        text: t(`guide.3.text`),
      },
    ],
    []
  )
}

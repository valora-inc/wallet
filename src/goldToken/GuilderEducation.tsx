import { StackScreenProps, TransitionPresets } from '@react-navigation/stack'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import Education, { EducationTopic, EmbeddedNavBar } from 'src/account/Education'
import { KolektivoNotificationEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { BtnTypes } from 'src/components/Button'
import { setCicoCompleted } from 'src/goldToken/actions'
import { noHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'

type Props = StackScreenProps<StackParamList, Screens.GuilderEducation>

export default function GuilderEducation(props: Props) {
  const dispatch = useDispatch()
  function onComplete() {
    ValoraAnalytics.track(KolektivoNotificationEvents.cico_prompt_complete)
    if (props.route.params?.nextScreen) {
      navigate(props.route.params?.nextScreen)
    } else {
      dispatch(setCicoCompleted())
      navigate(Screens.WalletHome)
    }
  }

  const { t } = useTranslation()

  const steps = useSteps()

  useEffect(() => {
    ValoraAnalytics.track(KolektivoNotificationEvents.view_cico_prompt)
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

GuilderEducation.navigationOptions = {
  ...noHeader,
  ...TransitionPresets.ModalTransition,
}

function useSteps() {
  const { t } = useTranslation()
  return React.useMemo(
    () =>
      [
        { image: null, topic: EducationTopic.celo },
        { image: null, topic: EducationTopic.celo },
        { image: null, topic: EducationTopic.celo },
        { image: null, topic: EducationTopic.celo },
      ].map((step, index) => {
        return {
          ...step,
          title: t(`cicoSteps.${index}.title`),
          text: t(`cicoSteps.${index}.text`),
        }
      }),
    []
  )
}

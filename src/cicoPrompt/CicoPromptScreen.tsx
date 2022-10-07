import { TransitionPresets } from '@react-navigation/stack'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { EmbeddedNavBar } from 'src/account/Education'
import { KolektivoNotificationEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { BtnTypes } from 'src/components/Button'
import { setCicoCompleted } from 'src/goldToken/actions'
import { celoEducation1, celoEducation2, celoEducation3, celoEducation4 } from 'src/images/Images'
import KolektivoNotification from 'src/kolektivoNotification/KolektivoNotification'
import { noHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import useSelector from 'src/redux/useSelector'

export enum CicoTopic {
  cico = 'cico',
}
export default function CicoPromptScreen() {
  const { t } = useTranslation()

  const dispatch = useDispatch()

  const isCicoPromptShowing = useSelector(
    (state) => state.goldToken.kolektivoNotifications.cicoPrompt
  )

  const onFinish = () => {
    ValoraAnalytics.track(KolektivoNotificationEvents.cico_prompt_complete)

    dispatch(setCicoCompleted())

    navigate(Screens.WalletHome)
  }

  const stepInfo = useStep()

  useEffect(() => {
    ValoraAnalytics.track(KolektivoNotificationEvents.view_cico_prompt)
  }, [])

  return (
    <KolektivoNotification
      embeddedNavBar={isCicoPromptShowing ? EmbeddedNavBar.Close : EmbeddedNavBar.Drawer}
      stepInfo={stepInfo}
      onFinish={onFinish}
      finalButtonType={BtnTypes.NOTIFICATION}
      finalButtonText={t('done')}
      buttonText={t('next')}
    />
  )
}

CicoPromptScreen.navigationOptions = {
  ...noHeader,
  ...TransitionPresets.ModalTransition,
}

function useStep() {
  const { t } = useTranslation()

  return React.useMemo(() => {
    return [
      {
        image: celoEducation1,
        topic: CicoTopic.cico,
      },
      {
        image: celoEducation2,
        topic: CicoTopic.cico,
      },
      {
        image: celoEducation3,
        topic: CicoTopic.cico,
      },
      {
        image: celoEducation4, // Placeholder Image
        topic: CicoTopic.cico,
      },
    ].map((step, index) => {
      return {
        ...step,
        title: t(`cicoSteps.${index}.title`),
        text: t(`cicoSteps.${index}.text`),
      }
    })
  }, [])
}

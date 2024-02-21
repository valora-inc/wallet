import React from 'react'
import { useTranslation } from 'react-i18next'
import { NotificationVariant } from 'src/components/InLineNotification'
import Toast from 'src/components/Toast'
import { showJumstartError } from 'src/jumpstart/selectors'
import { jumpstartErrorDismissed } from 'src/jumpstart/slice'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { useDispatch, useSelector } from 'src/redux/hooks'

export default function JumpstartClaimStatusError() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const showToast = useSelector(showJumstartError)

  const handleDismiss = () => {
    dispatch(jumpstartErrorDismissed())
  }

  const handleContactSupport = () => {
    navigate(Screens.SupportContact)
    dispatch(jumpstartErrorDismissed())
  }

  return (
    <Toast
      showToast={showToast}
      variant={NotificationVariant.Error}
      title={t('jumpstartStatus.error.title')}
      description={t('jumpstartStatus.error.description')}
      ctaLabel={t('jumpstartStatus.error.contactSupport')}
      onPressCta={handleContactSupport}
      ctaLabel2={t('jumpstartStatus.error.dismiss')}
      onPressCta2={handleDismiss}
    />
  )
}

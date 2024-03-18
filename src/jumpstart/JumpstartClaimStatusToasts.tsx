import React from 'react'
import { useTranslation } from 'react-i18next'
import { NotificationVariant } from 'src/components/InLineNotification'
import Toast from 'src/components/Toast'
import GreenLoadingSpinner from 'src/icons/GreenLoadingSpinner'
import { showJumstartError, showJumstartLoading } from 'src/jumpstart/selectors'
import { jumpstartErrorDismissed, jumpstartLoadingDismissed } from 'src/jumpstart/slice'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { Spacing } from 'src/styles/styles'

export default function JumpstartClaimStatusToasts() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const showLoading = useSelector(showJumstartLoading)
  const showError = useSelector(showJumstartError)

  const handleLoadingDismiss = () => {
    dispatch(jumpstartLoadingDismissed())
  }

  const handleErrorDismiss = () => {
    dispatch(jumpstartErrorDismissed())
  }

  const handleContactSupport = () => {
    navigate(Screens.SupportContact)
    dispatch(jumpstartErrorDismissed())
  }

  return (
    <>
      <Toast
        swipeable
        showToast={showLoading}
        variant={NotificationVariant.Info}
        title={t('jumpstartStatus.loading.title')}
        description={t('jumpstartStatus.loading.description')}
        customIcon={<GreenLoadingSpinner height={Spacing.Thick24} />}
        onDismiss={handleLoadingDismiss}
      />
      <Toast
        showToast={showError}
        variant={NotificationVariant.Error}
        title={t('jumpstartStatus.error.title')}
        description={t('jumpstartStatus.error.description')}
        ctaLabel={t('jumpstartStatus.error.contactSupport')}
        onPressCta={handleContactSupport}
        ctaLabel2={t('jumpstartStatus.error.dismiss')}
        onPressCta2={handleErrorDismiss}
      />
    </>
  )
}

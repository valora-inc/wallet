import React from 'react'
import { useTranslation } from 'react-i18next'
import { JumpstartEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { NotificationVariant } from 'src/components/InLineNotification'
import Toast from 'src/components/Toast'
import GreenLoadingSpinner from 'src/icons/GreenLoadingSpinner'
import { showJumstartClaimError, showJumstartClaimLoading } from 'src/jumpstart/selectors'
import { jumpstartClaimErrorDismissed, jumpstartClaimLoadingDismissed } from 'src/jumpstart/slice'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { Spacing } from 'src/styles/styles'

export default function JumpstartClaimStatusToasts() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const showLoading = useSelector(showJumstartClaimLoading)
  const showError = useSelector(showJumstartClaimError)

  const handleLoadingDismiss = () => {
    ValoraAnalytics.track(JumpstartEvents.jumpstart_claim_loading_dismissed)
    dispatch(jumpstartClaimLoadingDismissed())
  }

  const handleErrorDismiss = () => {
    ValoraAnalytics.track(JumpstartEvents.jumpstart_claim_error_dismissed)
    dispatch(jumpstartClaimErrorDismissed())
  }

  const handleContactSupport = () => {
    ValoraAnalytics.track(JumpstartEvents.jumpstart_claim_error_contact_support)
    navigate(Screens.SupportContact)
    dispatch(jumpstartClaimErrorDismissed())
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

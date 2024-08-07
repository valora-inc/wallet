import React from 'react'
import { useTranslation } from 'react-i18next'
import { JumpstartEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { NotificationVariant } from 'src/components/InLineNotification'
import Toast from 'src/components/Toast'
import GreenLoadingSpinner from 'src/icons/GreenLoadingSpinner'
import { jumpstartClaimStatusSelector } from 'src/jumpstart/selectors'
import { jumpstartClaimErrorDismissed, jumpstartClaimLoadingDismissed } from 'src/jumpstart/slice'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { Spacing } from 'src/styles/styles'

export default function JumpstartClaimStatusToasts() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const claimStatus = useSelector(jumpstartClaimStatusSelector)

  const handleLoadingDismiss = () => {
    AppAnalytics.track(JumpstartEvents.jumpstart_claim_loading_dismissed)
    dispatch(jumpstartClaimLoadingDismissed())
  }

  const handleErrorDismiss = () => {
    AppAnalytics.track(JumpstartEvents.jumpstart_claim_error_dismissed)
    dispatch(jumpstartClaimErrorDismissed())
  }

  const handleContactSupport = () => {
    AppAnalytics.track(JumpstartEvents.jumpstart_claim_error_contact_support)
    navigate(Screens.SupportContact)
    dispatch(jumpstartClaimErrorDismissed())
  }

  return (
    <>
      <Toast
        swipeable
        showToast={claimStatus === 'loading'}
        variant={NotificationVariant.Info}
        title={t('jumpstartStatus.loading.title')}
        description={t('jumpstartStatus.loading.description')}
        customIcon={<GreenLoadingSpinner height={Spacing.Thick24} />}
        onDismiss={handleLoadingDismiss}
      />
      <Toast
        showToast={claimStatus === 'error' || claimStatus === 'errorAlreadyClaimed'}
        variant={NotificationVariant.Error}
        title={t('jumpstartStatus.error.title')}
        description={
          claimStatus === 'errorAlreadyClaimed'
            ? t('jumpstartStatus.error.alreadyClaimedDescription')
            : t('jumpstartStatus.error.description')
        }
        ctaLabel={
          claimStatus === 'errorAlreadyClaimed' ? null : t('jumpstartStatus.error.contactSupport')
        }
        onPressCta={handleContactSupport}
        ctaLabel2={t('jumpstartStatus.error.dismiss')}
        onPressCta2={handleErrorDismiss}
      />
    </>
  )
}

import React from 'react'
import { useTranslation } from 'react-i18next'
import { NotificationVariant } from 'src/components/InLineNotification'
import Toast from 'src/components/Toast'
import GreenLoadingSpinner from 'src/icons/GreenLoadingSpinner'
import { showJumstartLoading } from 'src/jumpstart/selectors'
import { jumpstartLoadingDismissed } from 'src/jumpstart/slice'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { Spacing } from 'src/styles/styles'

export default function JumpstartClaimStatusLoading() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const showToast = useSelector(showJumstartLoading)

  const handleDismiss = () => {
    dispatch(jumpstartLoadingDismissed())
  }

  return (
    <Toast
      showToast={showToast}
      variant={NotificationVariant.Info}
      title={t('jumpstartStatus.loading.title')}
      description={t('jumpstartStatus.loading.description')}
      customIcon={<GreenLoadingSpinner height={Spacing.Thick24} />}
      swipeable
      onDismiss={handleDismiss}
    />
  )
}

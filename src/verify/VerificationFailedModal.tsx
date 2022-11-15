import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import Dialog from 'src/components/Dialog'
import { cancelVerification } from 'src/identity/actions'
import { VerificationStatus } from 'src/identity/types'
import { navigateHome } from 'src/navigator/NavigationService'

interface Props {
  verificationStatus: VerificationStatus
}

export function VerificationFailedModal({ verificationStatus }: Props) {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const [isDismissed, setIsDismissed] = useState(true)

  useEffect(() => {
    setIsDismissed(false) // Prevents a ghost modal from showing up briefly
  }, []) // after opening Verification Loading when it is already dismissed

  const onSkip = () => {
    dispatch(cancelVerification())
    navigateHome()
  }

  const userBalanceInsufficient = verificationStatus === VerificationStatus.InsufficientBalance
  const saltQuotaExceeded = verificationStatus === VerificationStatus.SaltQuotaExceeded

  const isVisible =
    (verificationStatus === VerificationStatus.Failed ||
      userBalanceInsufficient ||
      saltQuotaExceeded) &&
    !isDismissed

  if (userBalanceInsufficient) {
    // Show userBalanceInsufficient message and skip verification
    return (
      <Dialog
        isVisible={isVisible}
        title={t('failModal.header')}
        actionText={t('education.skip')}
        actionPress={onSkip}
      >
        {t('failModal.body1InsufficientBalance')}
        {'\n\n'}
        {t('failModal.body2InsufficientBalance')}
      </Dialog>
    )
  } else if (saltQuotaExceeded) {
    // Show saltQuotaExceeded message and skip verification
    return (
      <Dialog
        isVisible={isVisible}
        title={t('failModal.header')}
        actionText={t('education.skip')}
        actionPress={onSkip}
      >
        {t('failModal.body1SaltQuotaExceeded')}
        {'\n\n'}
        {t('failModal.body2SaltQuotaExceeded')}
      </Dialog>
    )
  } else {
    return (
      // Show general error and skip verification
      <Dialog
        isVisible={isVisible}
        title={t('failModal.header')}
        actionText={t('education.skip')}
        actionPress={onSkip}
      >
        {t('failModal.body1')}
        {'\n\n'}
        {t('failModal.body2')}
      </Dialog>
    )
  }
}

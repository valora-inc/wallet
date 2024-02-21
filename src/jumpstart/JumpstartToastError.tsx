import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import BottomSheetInLineNotification from 'src/components/BottomSheetInLineNotification'
import { Severity } from 'src/components/InLineNotification'
import { jumpstartErrorDismissed } from 'src/home/actions'
import { showJumstartError } from 'src/home/selectors'
import useSelector from 'src/redux/useSelector'

export default function JumpstartToastError() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const showToast = useSelector(showJumstartError)

  const handleToastDismiss = () => {
    dispatch(jumpstartErrorDismissed())
  }

  return (
    <BottomSheetInLineNotification
      showNotification={showToast}
      severity={Severity.Warning}
      title={t('jumpstart.error.title')}
      description={t('jumpstart.error.description')}
      ctaLabel={t('jumpstart.error.dismiss')}
      onPressCta={handleToastDismiss}
    />
  )
}

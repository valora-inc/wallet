import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import BottomSheetInLineNotification from 'src/components/BottomSheetInLineNotification'
import { Severity } from 'src/components/InLineNotification'
import { showJumstartError } from 'src/jumpstart/selectors'
import { jumpstartErrorDismissed } from 'src/jumpstart/slice'
import useSelector from 'src/redux/useSelector'

export default function JumpstartError() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const showNotification = useSelector(showJumstartError)

  const handleDismiss = () => {
    dispatch(jumpstartErrorDismissed())
  }

  return (
    <BottomSheetInLineNotification
      showNotification={showNotification}
      severity={Severity.Warning}
      title={t('jumpstart.error.title')}
      description={t('jumpstart.error.description')}
      ctaLabel={t('jumpstart.error.dismiss')}
      onPressCta={handleDismiss}
    />
  )
}

import React, { memo, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { hideAlert, hideAlertForSession } from 'src/alert/actions'
import { activeAlertSelector, ErrorDisplayType } from 'src/alert/reducer'
import SmartTopAlert from 'src/components/SmartTopAlert'
import useSelector from 'src/redux/useSelector'

function AlertBanner() {
  const activeAlert = useSelector(activeAlertSelector)
  const dispatch = useDispatch()

  const displayAlert = useMemo(() => {
    if (
      activeAlert?.displayMethod === ErrorDisplayType.BANNER &&
      (activeAlert.title || activeAlert.message)
    ) {
      const onPress = () => {
        if (activeAlert.action) {
          dispatch(activeAlert.action)
        }

        if (activeAlert.preventReappear) {
          dispatch(hideAlertForSession(activeAlert.message))
        } else {
          dispatch(hideAlert())
        }
      }

      const { type, title, message, buttonMessage, dismissAfter } = activeAlert

      return {
        type,
        title,
        message,
        buttonMessage,
        dismissAfter,
        onPress,
      }
    } else {
      return null
    }
  }, [activeAlert])

  return <SmartTopAlert alert={displayAlert} />
}

export default memo(AlertBanner)

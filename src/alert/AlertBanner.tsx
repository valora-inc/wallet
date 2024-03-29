import { noop } from 'lodash'
import React, { memo, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { AlertTypes, hideAlert } from 'src/alert/actions'
import { Alert, ErrorDisplayType } from 'src/alert/reducer'
import { NotificationVariant } from 'src/components/InLineNotification'
import SmartTopAlert from 'src/components/SmartTopAlert'
import Toast from 'src/components/Toast'
import { useDispatch, useSelector } from 'src/redux/hooks'

function AlertBanner() {
  const [toastAlert, setToastAlert] = useState<(Alert & { isActive: boolean }) | null>(null)
  const alert = useSelector((state) => state.alert)
  const dispatch = useDispatch()

  const onPressToast = () => {
    if (toastAlert?.action) {
      dispatch(toastAlert.action ?? hideAlert())
    }
  }

  const displayAlert = useMemo(() => {
    setToastAlert((prev) => {
      if (alert?.type === AlertTypes.TOAST) {
        return { ...alert, isActive: true }
      }

      return prev === null ? null : { ...prev, isActive: false }
    })

    if (alert?.displayMethod === ErrorDisplayType.BANNER && (alert.title || alert.message)) {
      const onPress = () => {
        const action = alert?.action ?? hideAlert()
        dispatch(action)
      }

      const { type, title, message, buttonMessage, dismissAfter } = alert

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
  }, [alert])

  // avoid conditionally rendering the Toast component to preserve the dismiss animation
  return (
    <>
      <View style={styles.floating}>
        <SmartTopAlert alert={displayAlert} />
      </View>

      <Toast
        showToast={!!toastAlert?.isActive}
        title={toastAlert?.title || ''}
        variant={NotificationVariant.Warning}
        description={toastAlert?.message || ''}
        ctaLabel={toastAlert?.buttonMessage || ''}
        onPressCta={toastAlert?.isActive ? onPressToast : noop}
      />
    </>
  )
}

const styles = StyleSheet.create({
  floating: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
})

export default memo(AlertBanner)

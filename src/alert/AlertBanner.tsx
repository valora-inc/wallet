import React, { memo, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { useDispatch } from 'react-redux'
import { AlertTypes, hideAlert } from 'src/alert/actions'
import { ErrorDisplayType } from 'src/alert/reducer'
import SmartTopAlert from 'src/components/SmartTopAlert'
import ToastWithCTA from 'src/components/ToastWithCTA'
import useSelector from 'src/redux/useSelector'

function AlertBanner() {
  const alert = useSelector((state) => state.alert)
  const dispatch = useDispatch()

  const displayAlert = useMemo(() => {
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

  if (displayAlert?.type === AlertTypes.TOAST) {
    return (
      <ToastWithCTA
        showToast={true}
        title={displayAlert.title || ''}
        message={displayAlert.message}
        labelCTA={displayAlert.buttonMessage || ''}
        onPress={displayAlert.onPress}
      />
    )
  }

  return (
    <View style={styles.floating}>
      <SmartTopAlert alert={displayAlert} />
    </View>
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

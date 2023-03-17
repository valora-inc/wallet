import ReactNativeHapticFeedback from 'react-native-haptic-feedback'

const options = {
  enableVibrateFallback: false,
  ignoreAndroidSystemSettings: false,
}

export const vibrate = () => {
  ReactNativeHapticFeedback.trigger('impactMedium', options)
}

export const vibrateLight = () => {
  ReactNativeHapticFeedback.trigger('impactMedium', options)
}

export const vibrateSuccess = () => {
  ReactNativeHapticFeedback.trigger('notificationSuccess', options)
}

export const vibrateError = () => {
  ReactNativeHapticFeedback.trigger('notificationError', options)
}

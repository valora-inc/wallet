import ReactNativeHapticFeedback, { HapticFeedbackTypes } from 'react-native-haptic-feedback'
import { hapticFeedbackEnabledSelector } from 'src/app/selectors'
import { store } from 'src/redux/store'

const options = {
  enableVibrateFallback: false,
  ignoreAndroidSystemSettings: false,
}

const triggerHapticFeedback = (type: HapticFeedbackTypes) => {
  const hapticFeedbackEnabled = hapticFeedbackEnabledSelector(store.getState())
  if (hapticFeedbackEnabled) {
    ReactNativeHapticFeedback.trigger(type, options)
  }
}

export const vibrateInformative = () => {
  triggerHapticFeedback(HapticFeedbackTypes.impactMedium)
}

export const vibrateSuccess = () => {
  triggerHapticFeedback(HapticFeedbackTypes.notificationSuccess)
}

export const vibrateError = () => {
  triggerHapticFeedback(HapticFeedbackTypes.notificationError)
}

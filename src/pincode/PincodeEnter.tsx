/**
 * This is a react navigation SCREEN to which we navigate,
 * when we need to fetch a PIN from a user.
 */
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AuthenticationEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { headerWithBackButton } from 'src/navigator/Headers'
import { modalScreenOptions } from 'src/navigator/Navigator'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { checkPin } from 'src/pincode/authentication'
import Pincode from 'src/pincode/Pincode'
import useSelector from 'src/redux/useSelector'
import { SentryTransactionHub } from 'src/sentry/SentryTransactionHub'
import { SentryTransaction } from 'src/sentry/SentryTransactions'
import { currentAccountSelector } from 'src/web3/selectors'

type Props = StackScreenProps<StackParamList, Screens.PincodeEnter>

export const PincodeEnter = ({ route }: Props) => {
  const { t } = useTranslation()
  const [pin, setPin] = useState('')
  const [errorText, setErrorText] = useState(undefined)
  const [pinIsCorrect, setPinIsCorrect] = useState(false)
  const currentAccount = useSelector(currentAccountSelector)

  useEffect(() => {
    ValoraAnalytics.track(AuthenticationEvents.get_pincode_with_input_start)
    SentryTransactionHub.startTransaction(SentryTransaction.pincode_enter)
    return () => {
      const onCancel = route.params.onCancel
      if (onCancel && !pinIsCorrect) {
        onCancel()
      }
    }
  }, [])

  const onChangePin = (pin: string) => {
    setPin(pin)
    setErrorText(undefined)
  }

  const onCorrectPin = (pin: string) => {
    setPinIsCorrect(true)
    const onSuccess = route.params.onSuccess
    if (onSuccess) {
      ValoraAnalytics.track(AuthenticationEvents.get_pincode_with_input_complete)
      onSuccess(pin)
      SentryTransactionHub.finishTransaction(SentryTransaction.pincode_enter)
    }
  }

  const onWrongPin = () => {
    setPin('')
    setErrorText(t(`${ErrorMessages.INCORRECT_PIN}`))
    ValoraAnalytics.track(AuthenticationEvents.get_pincode_with_input_error)
  }

  const onPressConfirm = async () => {
    const withVerification = route.params.withVerification
    const account = currentAccount ?? route.params.account
    if (withVerification && account) {
      if (await checkPin(pin, account)) {
        onCorrectPin(pin)
      } else {
        onWrongPin()
      }
    } else {
      onCorrectPin(pin)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Pincode
        title={t('confirmPin.title')}
        errorText={errorText}
        pin={pin}
        onChangePin={onChangePin}
        onCompletePin={onPressConfirm}
      />
    </SafeAreaView>
  )
}

PincodeEnter.navigationOptions = () => ({
  ...modalScreenOptions(),
  ...headerWithBackButton,
  gestureEnabled: false,
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
})

export default PincodeEnter

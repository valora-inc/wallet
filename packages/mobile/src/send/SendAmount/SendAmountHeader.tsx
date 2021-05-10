import DownArrowIcon from '@celo/react-components/icons/DownArrowIcon'
import colors from '@celo/react-components/styles/colors'
import React, { useMemo, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { RequestEvents, SendEvents } from 'src/analytics/Events'
import BackButton from 'src/components/BackButton'
import CurrencyPicker, { CurrencyPickerOrigin } from 'src/components/CurrencyPicker'
import CustomHeader from 'src/components/header/CustomHeader'
import { DOLLAR_TRANSACTION_MIN_AMOUNT } from 'src/config'
import i18n from 'src/i18n'
import { HeaderTitleWithBalance, styles as headerStyles } from 'src/navigator/Headers'
import useSelector from 'src/redux/useSelector'
import { balancesSelector } from 'src/stableToken/selectors'
import { CURRENCIES, Currency, STABLE_CURRENCIES } from 'src/utils/currencies'

interface Props {
  currency: Currency
  isOutgoingPaymentRequest: boolean
  onChangeCurrency: (currency: Currency) => void
}

function SendAmountHeader({ currency, isOutgoingPaymentRequest, onChangeCurrency }: Props) {
  const [showingCurrencyPicker, setShowCurrencyPicker] = useState(false)

  const balances = useSelector(balancesSelector)

  const onCurrencySelected = (currency: Currency) => {
    setShowCurrencyPicker(false)
    onChangeCurrency(currency)
  }

  const backButtonEventName = isOutgoingPaymentRequest
    ? RequestEvents.request_amount_back
    : SendEvents.send_amount_back

  const title = useMemo(() => {
    const currenciesWithBalance = STABLE_CURRENCIES.filter((currency) =>
      balances[currency].gt(DOLLAR_TRANSACTION_MIN_AMOUNT)
    ).length

    let titleText
    let title
    if (currenciesWithBalance < 2) {
      titleText = isOutgoingPaymentRequest
        ? i18n.t('paymentRequestFlow:request')
        : i18n.t('sendFlow7:send')
      title = titleText
    } else {
      titleText = isOutgoingPaymentRequest
        ? i18n.t('paymentRequestFlow:requestToken', { token: CURRENCIES[currency].code })
        : i18n.t('sendFlow7:sendToken', { token: CURRENCIES[currency].code })
      title = (
        <View style={styles.titleContainer} testID="HeaderCurrencyPicker">
          <Text style={headerStyles.headerTitle}>{titleText}</Text>
          <DownArrowIcon color={colors.dark} />
        </View>
      )
    }
    return (
      <TouchableOpacity
        disabled={currenciesWithBalance < 2}
        onPress={() => setShowCurrencyPicker(true)}
      >
        {isOutgoingPaymentRequest ? (
          <Text>{titleText}</Text>
        ) : (
          <HeaderTitleWithBalance title={title} token={currency} />
        )}
      </TouchableOpacity>
    )
  }, [isOutgoingPaymentRequest, currency])

  return (
    <>
      <CustomHeader left={<BackButton eventName={backButtonEventName} />} title={title} />
      <CurrencyPicker
        isVisible={showingCurrencyPicker}
        origin={CurrencyPickerOrigin.Send}
        onCurrencySelected={onCurrencySelected}
      />
    </>
  )
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
  },
})

export default SendAmountHeader

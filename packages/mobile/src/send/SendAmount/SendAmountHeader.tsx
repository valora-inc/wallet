import Touchable from '@celo/react-components/components/Touchable'
import DownArrowIcon from '@celo/react-components/icons/DownArrowIcon'
import colors from '@celo/react-components/styles/colors'
import React, { useMemo, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { RequestEvents, SendEvents } from 'src/analytics/Events'
import BackButton from 'src/components/BackButton'
import CustomHeader from 'src/components/header/CustomHeader'
import TokenBottomSheet, { TokenPickerOrigin } from 'src/components/TokenBottomSheet'
import { STABLE_TRANSACTION_MIN_AMOUNT } from 'src/config'
import i18n from 'src/i18n'
import { localCurrencyExchangeRatesSelector } from 'src/localCurrency/selectors'
import { HeaderTitleWithBalance, styles as headerStyles } from 'src/navigator/Headers'
import useSelector from 'src/redux/useSelector'
import { balancesSelector } from 'src/stableToken/selectors'
import { Currency, STABLE_CURRENCIES } from 'src/utils/currencies'

interface Props {
  currency: Currency
  isOutgoingPaymentRequest: boolean
  onChangeCurrency: (currency: Currency) => void
  disallowCurrencyChange: boolean
}

function SendAmountHeader({
  currency,
  isOutgoingPaymentRequest,
  onChangeCurrency,
  disallowCurrencyChange,
}: Props) {
  const [showingCurrencyPicker, setShowCurrencyPicker] = useState(false)
  const balances = useSelector(balancesSelector)
  const exchangeRates = useSelector(localCurrencyExchangeRatesSelector)

  const onCurrencySelected = (currency: Currency) => {
    setShowCurrencyPicker(false)
    onChangeCurrency(currency)
  }

  const closeCurrencyPicker = () => setShowCurrencyPicker(false)

  const backButtonEventName = isOutgoingPaymentRequest
    ? RequestEvents.request_amount_back
    : SendEvents.send_amount_back

  const title = useMemo(() => {
    const currenciesWithBalance = STABLE_CURRENCIES.filter(
      (currency) =>
        balances[currency]?.gt(STABLE_TRANSACTION_MIN_AMOUNT) && exchangeRates[currency] !== null
    ).length

    let titleText
    let title
    if (currenciesWithBalance < 2 || isOutgoingPaymentRequest) {
      titleText = isOutgoingPaymentRequest
        ? i18n.t('paymentRequestFlow:request')
        : i18n.t('sendFlow7:send')
      title = titleText
    } else {
      titleText = i18n.t('sendFlow7:sendToken', { token: currency })
      title = (
        <View style={styles.titleContainer} testID="HeaderCurrencyPicker">
          <Text style={headerStyles.headerTitle}>{titleText}</Text>
          {!disallowCurrencyChange ? <DownArrowIcon color={colors.dark} /> : null}
        </View>
      )
    }
    return (
      <Touchable
        disabled={currenciesWithBalance < 2 || disallowCurrencyChange}
        onPress={() => setShowCurrencyPicker(true)}
      >
        {isOutgoingPaymentRequest ? (
          <Text style={headerStyles.headerTitle}>{titleText}</Text>
        ) : (
          <HeaderTitleWithBalance title={title} token={currency} />
        )}
      </Touchable>
    )
  }, [isOutgoingPaymentRequest, currency])

  return (
    <>
      <CustomHeader left={<BackButton eventName={backButtonEventName} />} title={title} />
      <TokenBottomSheet
        isVisible={showingCurrencyPicker}
        origin={TokenPickerOrigin.Send}
        onCurrencySelected={onCurrencySelected}
        onClose={closeCurrencyPicker}
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

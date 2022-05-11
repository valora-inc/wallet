import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, StyleSheet, Text, View } from 'react-native'
import { CeloExchangeEvents } from 'src/analytics/Events'
import BackButton from 'src/components/BackButton'
import CustomHeader from 'src/components/header/CustomHeader'
import TokenBottomSheetLegacy, { TokenPickerOrigin } from 'src/components/TokenBottomSheetLegacy'
import Touchable from 'src/components/Touchable'
import { STABLE_TRANSACTION_MIN_AMOUNT } from 'src/config'
import DownArrowIcon from 'src/icons/DownArrowIcon'
import { localCurrencyExchangeRatesSelector } from 'src/localCurrency/selectors'
import { HeaderTitleWithBalance, styles as headerStyles } from 'src/navigator/Headers'
import useSelector from 'src/redux/useSelector'
import { balancesSelector } from 'src/stableToken/selectors'
import colors from 'src/styles/colors'
import { Currency, STABLE_CURRENCIES } from 'src/utils/currencies'

interface Props {
  currency: Currency
  isCeloPurchase: boolean
  onChangeCurrency: (currency: Currency) => void
}

function ExchangeTradeScreenHeader({ currency, isCeloPurchase, onChangeCurrency }: Props) {
  const { t } = useTranslation()
  const [showingTokenPicker, setShowTokenPicker] = useState(false)

  const onCurrencySelected = (currency: Currency) => {
    setShowTokenPicker(false)
    onChangeCurrency(currency)
  }

  const closeCurrencyPicker = () => setShowTokenPicker(false)

  const balances = useSelector(balancesSelector)
  const exchangeRates = useSelector(localCurrencyExchangeRatesSelector)

  const title = useMemo(() => {
    const currenciesWithBalance = STABLE_CURRENCIES.filter(
      (currency) =>
        balances[currency]?.gt(STABLE_TRANSACTION_MIN_AMOUNT) && exchangeRates[currency] !== null
    ).length

    let titleText
    let title
    const tokenPickerEnabled = currenciesWithBalance >= 2 || !isCeloPurchase
    if (!tokenPickerEnabled) {
      title = t('buyGold')
    } else {
      titleText = t('tokenBalance', { token: currency })
      title = (
        <View style={styles.titleContainer} testID="HeaderCurrencyPicker">
          <Text style={headerStyles.headerSubTitle}>{titleText}</Text>
          <DownArrowIcon color={colors.gray3} />
        </View>
      )
    }

    const showTokenPicker = () => {
      setShowTokenPicker(true)
      Keyboard.dismiss()
    }

    return (
      <Touchable disabled={!tokenPickerEnabled} onPress={showTokenPicker}>
        <HeaderTitleWithBalance title={title} token={currency} switchTitleAndSubtitle={true} />
      </Touchable>
    )
  }, [currency])

  const cancelEventName = isCeloPurchase
    ? CeloExchangeEvents.celo_buy_cancel
    : CeloExchangeEvents.celo_sell_cancel

  return (
    <>
      <CustomHeader left={<BackButton eventName={cancelEventName} />} title={title} />
      <TokenBottomSheetLegacy
        isVisible={showingTokenPicker}
        origin={TokenPickerOrigin.Exchange}
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

export default ExchangeTradeScreenHeader

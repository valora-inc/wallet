import Touchable from '@celo/react-components/components/Touchable'
import DownArrowIcon from '@celo/react-components/icons/DownArrowIcon'
import colors from '@celo/react-components/styles/colors'
import React, { useMemo, useState } from 'react'
import { Keyboard, StyleSheet, Text, View } from 'react-native'
import { CeloExchangeEvents } from 'src/analytics/Events'
import BackButton from 'src/components/BackButton'
import CustomHeader from 'src/components/header/CustomHeader'
import TokenBottomSheet, { TokenPickerOrigin } from 'src/components/TokenBottomSheet'
import { STABLE_TRANSACTION_MIN_AMOUNT } from 'src/config'
import i18n from 'src/i18n'
import { localCurrencyExchangeRatesSelector } from 'src/localCurrency/selectors'
import { HeaderTitleWithBalance, styles as headerStyles } from 'src/navigator/Headers'
import useSelector from 'src/redux/useSelector'
import { balancesSelector } from 'src/stableToken/selectors'
import { tokenBalancesSelector } from 'src/tokens/selectors'
import { Currency, STABLE_CURRENCIES } from 'src/utils/currencies'

interface Props {
  currency: Currency
  isCeloPurchase: boolean
  onChangeCurrency: (currency: Currency) => void
}

function ExchangeTradeScreenHeader({ currency, isCeloPurchase, onChangeCurrency }: Props) {
  const [showingTokenPicker, setShowTokenPicker] = useState(false)
  const tokensInfo = useSelector(tokenBalancesSelector)

  const onTokenSelected = (tokenAddress: string) => {
    setShowTokenPicker(false)
    const tokenInfo = tokensInfo[tokenAddress]
    // We need this condition because Currency.Celo maps to cGLD.
    const selectedCurrency: Currency | undefined =
      tokenInfo?.symbol === 'CELO'
        ? Currency.Celo
        : STABLE_CURRENCIES.find((cur) => cur === tokenInfo?.symbol)
    if (selectedCurrency) {
      onChangeCurrency(selectedCurrency)
    }
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
      title = i18n.t('exchangeFlow9:buyGold')
    } else {
      titleText = i18n.t('exchangeFlow9:tokenBalance', { token: currency })
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
      <TokenBottomSheet
        isVisible={showingTokenPicker}
        origin={TokenPickerOrigin.Exchange}
        onTokenSelected={onTokenSelected}
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

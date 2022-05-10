// VIEW which contains buy and sell buttons for CELO.

import { StackNavigationProp } from '@react-navigation/stack'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'
import { CeloExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { CELO_TRANSACTION_MIN_AMOUNT, STABLE_TRANSACTION_MIN_AMOUNT } from 'src/config'
import { exchangeRatesSelector } from 'src/exchange/reducer'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { balancesSelector } from 'src/stableToken/selectors'
import { Currency, STABLE_CURRENCIES } from 'src/utils/currencies'

interface Props {
  navigation: StackNavigationProp<StackParamList, Screens.ExchangeHomeScreen>
}

export default function CeloExchangeButtons({ navigation }: Props) {
  const { t } = useTranslation()

  const balances = useSelector(balancesSelector)
  const exchangeRates = useSelector(exchangeRatesSelector)

  const hasStable = STABLE_CURRENCIES.some((currency) =>
    balances[currency]?.isGreaterThan(STABLE_TRANSACTION_MIN_AMOUNT)
  )
  const hasCelo = balances[Currency.Celo]?.isGreaterThan(CELO_TRANSACTION_MIN_AMOUNT)

  function goToBuyCelo() {
    ValoraAnalytics.track(CeloExchangeEvents.celo_home_buy)
    navigation.navigate(Screens.ExchangeTradeScreen, {
      buyCelo: true,
    })
  }

  function goToBuyStableToken() {
    ValoraAnalytics.track(CeloExchangeEvents.celo_home_sell)
    navigation.navigate(Screens.ExchangeTradeScreen, {
      buyCelo: false,
    })
  }

  if (!exchangeRates || (!hasStable && !hasCelo)) {
    return <View style={styles.emptyContainer} />
  }

  return (
    <View style={styles.buttonContainer}>
      {hasStable && (
        <Button
          text={t('buy')}
          size={BtnSizes.FULL}
          onPress={goToBuyCelo}
          style={styles.button}
          type={BtnTypes.TERTIARY}
          testID="BuyCelo"
        />
      )}
      {hasCelo && (
        <Button
          size={BtnSizes.FULL}
          text={t('sell')}
          onPress={goToBuyStableToken}
          style={styles.button}
          type={BtnTypes.TERTIARY}
          testID="SellCelo"
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  emptyContainer: {
    marginTop: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 28,
    marginHorizontal: 12,
  },
  button: {
    marginHorizontal: 4,
    flex: 1,
  },
})

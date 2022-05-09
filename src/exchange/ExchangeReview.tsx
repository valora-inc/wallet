import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useEffect } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { CeloExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import FeeDrawer from 'src/components/FeeDrawer'
import HorizontalLine from 'src/components/HorizontalLine'
import LineItemRow from 'src/components/LineItemRow'
import TotalLineItem from 'src/components/TotalLineItem'
import { exchangeTokens, fetchExchangeRate, fetchTobinTax } from 'src/exchange/actions'
import { convertCurrencyToLocalAmount } from 'src/localCurrency/convert'
import { localCurrencyExchangeRatesSelector } from 'src/localCurrency/selectors'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { isAppConnected } from 'src/redux/selectors'
import useSelector from 'src/redux/useSelector'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { Currency } from 'src/utils/currencies'
import { getRateForMakerToken } from 'src/utils/currencyExchange'

type Props = StackScreenProps<StackParamList, Screens.ExchangeReview>

export default function ExchangeReview({ route }: Props) {
  const { t } = useTranslation()

  const exchangeRates = useSelector((state) => state.exchange.exchangeRates)
  const tobinTax = useSelector((state) => new BigNumber(state.exchange.tobinTax || 0))
  // TODO: use real fee
  const fee = new BigNumber(0)
  const appConnected = useSelector(isAppConnected)
  const localCurrencyExchangeRates = useSelector(localCurrencyExchangeRatesSelector)

  const {
    makerToken,
    takerToken,
    celoAmount,
    stableAmount,
    inputToken,
    inputAmount,
    inputTokenDisplayName,
  } = route.params
  const dispatch = useDispatch()

  const onPressConfirm = () => {
    const stableToken = makerToken === Currency.Celo ? takerToken : makerToken

    // BEGIN: Analytics
    const localCurrencyAmount = convertCurrencyToLocalAmount(
      stableAmount,
      localCurrencyExchangeRates[stableToken]
    )
    ValoraAnalytics.track(
      makerToken !== Currency.Celo
        ? CeloExchangeEvents.celo_buy_confirm
        : CeloExchangeEvents.celo_sell_confirm,
      {
        localCurrencyAmount: localCurrencyAmount?.toString() ?? null,
        goldAmount: celoAmount.toString(),
        stableAmount: stableAmount.toString(),
        inputToken,
      }
    )

    const makerTokenAmount = makerToken === Currency.Celo ? celoAmount : stableAmount
    dispatch(exchangeTokens(makerToken, makerTokenAmount, takerToken))
  }

  useEffect(() => {
    const makerTokenAmount = makerToken === Currency.Celo ? celoAmount : stableAmount
    dispatch(fetchTobinTax(makerTokenAmount, makerToken))
    dispatch(fetchExchangeRate(makerToken, makerTokenAmount))
  }, [])

  const stableToken = makerToken === Currency.Celo ? takerToken : makerToken
  const exchangeRate = getRateForMakerToken(exchangeRates, Currency.Celo, stableToken).pow(-1)

  const exchangeAmount = {
    value: inputAmount,
    currencyCode: inputToken,
  }
  const exchangeRateAmount = {
    value: exchangeRate,
    currencyCode: stableToken,
  }
  const subtotalAmount = {
    value: stableAmount,
    currencyCode: stableToken,
  }
  const totalFee = new BigNumber(tobinTax).plus(fee)

  const totalAmount = {
    value: stableAmount.plus(totalFee),
    currencyCode: stableToken,
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.paddedContainer}>
        <DisconnectBanner />
        <ScrollView>
          <View style={styles.flexStart}>
            <View style={styles.amountRow}>
              <Text style={styles.exchangeBodyText}>
                {t('exchangeAmount', {
                  tokenName: inputTokenDisplayName,
                })}
              </Text>
              <CurrencyDisplay style={styles.currencyAmountText} amount={exchangeAmount} />
            </View>
            <HorizontalLine />
            <LineItemRow
              title={
                <Trans i18nKey="subtotalAmount">
                  Subtotal @ <CurrencyDisplay amount={exchangeRateAmount} />
                </Trans>
              }
              amount={<CurrencyDisplay amount={subtotalAmount} />}
            />
            <FeeDrawer
              testID={'feeDrawer/ExchangeReview'}
              currency={Currency.Dollar}
              securityFee={fee}
              exchangeFee={tobinTax}
              isExchange={true}
              totalFee={totalFee}
            />

            <HorizontalLine />
            <TotalLineItem amount={totalAmount} />
          </View>
        </ScrollView>
      </View>
      <Button
        onPress={onPressConfirm}
        size={BtnSizes.FULL}
        text={
          <Trans i18nKey={makerToken === Currency.Celo ? 'sellGoldAmount' : 'buyGoldAmount'}>
            {/* Used instead of Currency Display to deal with large text - CELO only exchanged here */}
            {celoAmount.toFixed(2).toString()}
          </Trans>
        }
        style={styles.buyBtn}
        disabled={!appConnected || exchangeRate.isZero()}
        type={BtnTypes.TERTIARY}
        testID="ConfirmExchange"
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  paddedContainer: {
    paddingHorizontal: 16,
    flex: 1,
  },
  flexStart: {
    justifyContent: 'flex-start',
  },
  exchangeBodyText: {
    ...fontStyles.regular,
  },
  currencyAmountText: {
    ...fontStyles.regular,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
  },
  buyBtn: {
    padding: variables.contentPadding,
  },
})

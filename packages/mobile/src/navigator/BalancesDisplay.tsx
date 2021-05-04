import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import { GOLD_TRANSACTION_MIN_AMOUNT } from 'src/config'
import { celoTokenBalanceSelector } from 'src/goldToken/selectors'
import { RootState } from 'src/redux/reducers'
import useSelector from 'src/redux/useSelector'
import { cEurBalanceSelector, cUsdBalanceSelector } from 'src/stableToken/reducer'
import { CURRENCIES, Currency } from 'src/utils/currencies'

function useAmount(currency: Currency, selector: (state: RootState) => string | null) {
  const balance = useSelector(selector)
  return {
    value: new BigNumber(balance ?? '0'),
    currencyCode: CURRENCIES[currency].code,
  }
}

export function BalancesDisplay() {
  const dollarAmount = useAmount(Currency.Dollar, cUsdBalanceSelector)
  const euroAmount = useAmount(Currency.Euro, cEurBalanceSelector)
  const celoAmount = useAmount(Currency.Celo, celoTokenBalanceSelector)

  const hasEurBalance = euroAmount.value.isGreaterThan(GOLD_TRANSACTION_MIN_AMOUNT)
  const hasCeloBalance = celoAmount.value.isGreaterThan(GOLD_TRANSACTION_MIN_AMOUNT)

  return (
    <>
      <CurrencyDisplay
        style={fontStyles.regular500}
        amount={dollarAmount}
        showLocalAmount={true}
        testID="LocalDollarBalance"
      />
      <CurrencyDisplay
        style={styles.amountLabelSmall}
        amount={dollarAmount}
        showLocalAmount={false}
        hideFullCurrencyName={false}
        hideSymbol={true}
        testID="DollarBalance"
      />
      <View style={styles.borderBottom} />
      {hasEurBalance && (
        <>
          <CurrencyDisplay
            style={fontStyles.regular500}
            amount={euroAmount}
            showLocalAmount={true}
            testID="LocalEuroBalance"
          />
          <CurrencyDisplay
            style={styles.amountLabelSmall}
            amount={euroAmount}
            showLocalAmount={false}
            hideFullCurrencyName={false}
            hideSymbol={true}
            testID="EuroBalance"
          />
          <View style={styles.borderBottom} />
        </>
      )}
      {hasCeloBalance && (
        <>
          <CurrencyDisplay
            style={fontStyles.regular500}
            amount={celoAmount}
            showLocalAmount={true}
            testID="LocalCeloBalance"
          />
          <CurrencyDisplay
            style={styles.amountLabelSmall}
            amount={celoAmount}
            showLocalAmount={false}
            hideFullCurrencyName={false}
            hideSymbol={true}
            testID="CeloBalance"
          />
          <View style={styles.borderBottom} />
        </>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  amountLabelSmall: {
    ...fontStyles.small,
    color: colors.gray4,
    marginTop: 2,
  },
  borderBottom: {
    height: 1,
    backgroundColor: colors.gray2,
    alignSelf: 'stretch',
    marginTop: 12,
    marginBottom: 12,
  },
})

export default BalancesDisplay

import * as React from 'react'
import { Trans, WithTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import useBalanceAutoRefresh from 'src/home/useBalanceAutoRefresh'
import { withTranslation } from 'src/i18n'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { useLocalCurrencyCode } from 'src/localCurrency/hooks'
import useSelector from 'src/redux/useSelector'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { Currency } from 'src/utils/currencies'

type Props = WithTranslation

function CeloDollarsOverview({ t }: Props) {
  useBalanceAutoRefresh()
  const localCurrencyCode = useLocalCurrencyCode()
  const dollarBalance = useSelector((state) => state.stableToken.balances[Currency.Dollar])

  const isUsdLocalCurrency = localCurrencyCode === LocalCurrencyCode.USD
  const dollarBalanceAmount = dollarBalance
    ? { value: dollarBalance, currencyCode: Currency.Dollar }
    : null

  return (
    <View style={styles.container}>
      {dollarBalanceAmount && (
        <Text style={styles.balance} testID="DollarBalance">
          <CurrencyDisplay style={fontStyles.regular500} amount={dollarBalanceAmount} />
        </Text>
      )}
      {!isUsdLocalCurrency && dollarBalanceAmount && (
        <Text style={styles.dollarBalance} testID="GoldBalance">
          <Trans i18nKey="dollarBalance">
            <CurrencyDisplay
              amount={dollarBalanceAmount}
              showLocalAmount={false}
              hideSymbol={true}
            />{' '}
            {t('celoDollars')}
          </Trans>
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: variables.contentPadding,
    paddingVertical: 20,
  },
  balance: {
    fontSize: 44,
    // TODO: figure out why specifying the lineHeight with the font we're using
    // breaks the vertical centering. Then remove the hardcoded height here!
    lineHeight: 62,
    height: 48,
    color: colors.dark,
  },
  dollarBalance: {
    ...fontStyles.large,
    color: colors.gray5,
  },
})

export default withTranslation<Props>()(CeloDollarsOverview)

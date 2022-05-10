import React from 'react'
import { Trans, WithTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import { celoTokenBalanceSelector } from 'src/goldToken/selectors'
import useBalanceAutoRefresh from 'src/home/useBalanceAutoRefresh'
import { withTranslation } from 'src/i18n'
import useSelector from 'src/redux/useSelector'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { Currency } from 'src/utils/currencies'

interface OwnProps {
  testID: string
}

type Props = WithTranslation & OwnProps

export function CeloGoldOverview({ t, testID }: Props) {
  useBalanceAutoRefresh()
  const celoBalance = useSelector(celoTokenBalanceSelector)

  const celoBalanceAmount = celoBalance ? { value: celoBalance, currencyCode: Currency.Celo } : null

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.title}>{t('yourGoldBalance')}</Text>
      <Text style={styles.balance} testID="CeloBalance">
        {celoBalanceAmount && <CurrencyDisplay amount={celoBalanceAmount} />}
      </Text>
      <Text style={styles.localBalance}>
        {celoBalanceAmount ? (
          <Trans i18nKey="equalToAmount">
            Equal to <CurrencyDisplay amount={celoBalanceAmount} showLocalAmount={true} />
          </Trans>
        ) : (
          t('loadingExchangeRate')
        )}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: variables.contentPadding,
    marginVertical: 16,
  },
  title: {
    ...fontStyles.h2,
    marginBottom: 8,
  },
  balance: {
    ...fontStyles.mediumNumber,
    color: colors.dark,
    marginBottom: 8,
  },
  localBalance: {
    ...fontStyles.regular,
    color: colors.gray4,
  },
})

export default withTranslation<Props>()(CeloGoldOverview)

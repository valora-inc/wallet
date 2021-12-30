import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import fontStyles from '@celo/react-components/styles/fonts'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MoneyAmount } from 'src/apollo/types'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import FeeDrawer from 'src/components/FeeDrawer'
import LineItemRow from 'src/components/LineItemRow'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenTotalLineItem from 'src/components/TokenTotalLineItem'
import TotalLineItem from 'src/components/TotalLineItem'
import { usePaidFees } from 'src/fees/hooks'
import { FailedToFetchGenesisBlockError } from 'src/geth/geth'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { useTokenInfoBySymbol } from 'src/tokens/hooks'
import { TokenExchange } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import { getLocalCurrencyDisplayValue } from 'src/utils/formatting'

export interface Props {
  exchange: TokenExchange
}

export default function CeloExchangeContent({ exchange }: Props) {
  const { t } = useTranslation()

  const { inAmount, outAmount, fees } = exchange
  const celoAddress = useTokenInfoBySymbol('CELO')?.address ?? ''
  const soldCELO = inAmount.tokenAddress === celoAddress

  const stableTokenAddress = soldCELO ? outAmount.tokenAddress : inAmount.tokenAddress
  const [celoAmount, stableAmount] = soldCELO ? [inAmount, outAmount] : [outAmount, inAmount]

  const { securityFee, dekFee, totalFee, feeCurrencyInfo } = usePaidFees(fees)

  const exchangeRate = celoAmount.localAmount
    ? getLocalCurrencyDisplayValue(
        celoAmount.localAmount.exchangeRate,
        celoAmount.localAmount.currencyCode as LocalCurrencyCode,
        true
      )
    : '-'

  return (
    <>
      <View style={styles.flexStart}>
        <View style={styles.amountRow}>
          <Text style={styles.exchangeBodyText}>{t('goldAmount')}</Text>
          <TokenDisplay
            style={styles.currencyAmountText}
            amount={celoAmount.value}
            tokenAddress={celoAddress}
            showLocalAmount={false}
            showSymbol={false}
            testID="CeloAmount"
          />
        </View>
        <HorizontalLine />
        <LineItemRow
          title={
            <Trans i18nKey="subtotalAmount">
              Subtotal @{' '}
              <TokenDisplay
                amount={exchangeRate}
                tokenAddress={celoAddress}
                testID="CeloExchangeRate"
              />
            </Trans>
          }
          amount={<TokenDisplay amount={stableAmount.value} tokenAddress={stableTokenAddress} />}
        />
        <FeeDrawer
          testID={'feeDrawer/CeloExchangeContent'}
          currency={feeCurrencyInfo ? (feeCurrencyInfo[0] as Currency) : undefined}
          securityFee={securityFee}
          dekFee={dekFee}
          totalFee={totalFee}
        />
        <HorizontalLine />
        <TokenTotalLineItem
          tokenAmount={new BigNumber(stableAmount.value).plus(totalFee ?? 0)}
          tokenAddress={stableTokenAddress}
          feeToAddInUsd={undefined}
          hideSign={true}
        />
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  flexStart: {
    justifyContent: 'flex-start',
  },
  exchangeBodyText: {
    ...fontStyles.regular600,
  },
  currencyAmountText: {
    ...fontStyles.regular600,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
  },
})

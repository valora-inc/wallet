import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import FeeDrawer from 'src/components/FeeDrawer'
import HorizontalLine from 'src/components/HorizontalLine'
import LineItemRow from 'src/components/LineItemRow'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenTotalLineItem from 'src/components/TokenTotalLineItem'
import { usePaidFees } from 'src/fees/hooks'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import fontStyles from 'src/styles/fonts'
import { useConvertBetweenTokens, useTokenInfoBySymbol } from 'src/tokens/hooks'
import { TokenExchange } from 'src/transactions/types'
import { getLocalCurrencyDisplayValue } from 'src/utils/formatting'

export interface Props {
  exchange: TokenExchange
}

// Note that this is tested from TransactionDetailsScreen.test.tsx
export default function CeloExchangeContent({ exchange }: Props) {
  const { t } = useTranslation()

  const { inAmount, outAmount, fees } = exchange
  const celoAddress = useTokenInfoBySymbol('CELO')?.address ?? ''
  const soldCELO = inAmount.tokenAddress === celoAddress

  const [celoAmount, stableAmount] = soldCELO ? [inAmount, outAmount] : [outAmount, inAmount]

  const { securityFee, dekFee, totalFee, feeTokenAddress, feeCurrency } = usePaidFees(fees)
  const totalFromFeesInLocal = fees.reduce(
    (sum, fee) => sum.plus(fee.amount?.localAmount?.value ?? 0),
    new BigNumber(0)
  )
  const feeInStableToken = useConvertBetweenTokens(
    totalFee,
    feeTokenAddress,
    stableAmount.tokenAddress
  )

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
          title={<Trans i18nKey="subtotalAmount">Subtotal @{` ${exchangeRate}`}</Trans>}
          amount={
            <TokenDisplay
              amount={stableAmount.value}
              tokenAddress={stableAmount.tokenAddress}
              localAmount={stableAmount.localAmount}
              testID="FiatAmount"
            />
          }
        />
        <FeeDrawer
          testID={'feeDrawer/CeloExchangeContent'}
          currency={feeCurrency}
          securityFee={securityFee}
          dekFee={dekFee}
          totalFee={totalFee}
        />
        <HorizontalLine />
        <TokenTotalLineItem
          tokenAmount={new BigNumber(stableAmount.value).plus(feeInStableToken ?? 0)}
          tokenAddress={stableAmount.tokenAddress}
          localAmount={
            stableAmount.localAmount
              ? {
                  ...stableAmount.localAmount,
                  value: new BigNumber(stableAmount.localAmount.value)
                    .absoluteValue()
                    .plus(totalFromFeesInLocal)
                    .toString(),
                }
              : undefined
          }
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

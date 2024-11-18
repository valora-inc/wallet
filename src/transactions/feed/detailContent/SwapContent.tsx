import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import RowDivider from 'src/components/RowDivider'
import TokenDisplay, { formatValueToDisplay } from 'src/components/TokenDisplay'
import { NETWORK_NAMES } from 'src/shared/conts'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTokensList } from 'src/tokens/hooks'
import FeeRowItem from 'src/transactions/feed/detailContent/FeeRowItem'
import {
  FeeType,
  TokenExchange,
  TokenTransactionTypeV2,
  TransactionStatus,
} from 'src/transactions/types'
export interface Props {
  transaction: TokenExchange
}

// Note that this is tested from TransactionDetailsScreen.test.tsx
export default function SwapContent({ transaction }: Props) {
  const { t } = useTranslation()
  const tokensList = useTokensList()

  const fromToken = tokensList.find((token) => token.tokenId === transaction.outAmount.tokenId)
  const toToken = tokensList.find((token) => token.tokenId === transaction.inAmount.tokenId)
  const isCrossChainSwap = transaction.type === TokenTransactionTypeV2.CrossChainSwapTransaction

  const showExchangeRate =
    transaction.status === TransactionStatus.Complete &&
    !new BigNumber(transaction.inAmount.value).isNaN() &&
    !!fromToken &&
    !!toToken

  return (
    <View style={styles.contentContainer}>
      <View style={styles.row}>
        <Text style={styles.bodyText}>{t('swapTransactionDetailPage.swapFrom')}</Text>
        <TokenDisplay
          style={styles.currencyAmountPrimaryText}
          amount={transaction.outAmount.value}
          tokenId={transaction.outAmount.tokenId}
          showLocalAmount={false}
          showSymbol={true}
          hideSign={true}
          testID="SwapContent/swapFrom"
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.bodyText}>{t('swapTransactionDetailPage.swapTo')}</Text>
        <TokenDisplay
          style={styles.currencyAmountPrimaryText}
          amount={transaction.inAmount.value}
          tokenId={transaction.inAmount.tokenId}
          showLocalAmount={false}
          showSymbol={true}
          hideSign={true}
          showApprox={
            !!transaction.inAmount.value && transaction.status === TransactionStatus.Pending
          }
          testID="SwapContent/swapTo"
        />
      </View>
      {isCrossChainSwap && !!fromToken && !!toToken && (
        <View style={styles.row}>
          <Text style={styles.bodyText}>{t('swapTransactionDetailPage.network')}</Text>
          <Text style={styles.bodyText}>
            {t('swapTransactionDetailPage.networkValue', {
              fromNetwork: NETWORK_NAMES[fromToken.networkId],
              toNetwork: NETWORK_NAMES[toToken.networkId],
            })}
          </Text>
        </View>
      )}

      {(showExchangeRate || transaction.fees.length > 0) && <RowDivider />}

      {showExchangeRate && (
        <View style={styles.row}>
          <Text style={styles.bodyText}>{t('swapTransactionDetailPage.rate')}</Text>
          <Text testID="SwapContent/rate" style={styles.currencyAmountPrimaryText}>
            {`1 ${fromToken.symbol} ≈ ${formatValueToDisplay(
              new BigNumber(transaction.inAmount.value).dividedBy(transaction.outAmount.value)
            )} ${toToken.symbol}`}
          </Text>
        </View>
      )}

      <FeeRowItem
        fees={transaction.fees}
        feeType={FeeType.SecurityFee}
        transactionStatus={transaction.status}
      />
      <FeeRowItem
        fees={transaction.fees}
        feeType={FeeType.AppFee}
        transactionStatus={transaction.status}
      />
      <FeeRowItem
        fees={transaction.fees}
        feeType={FeeType.CrossChainFee}
        transactionStatus={transaction.status}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    gap: Spacing.Smallest8,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.Regular16,
  },
  bodyText: {
    ...typeScale.bodyMedium,
    color: Colors.black,
  },
  currencyAmountPrimaryText: {
    ...typeScale.bodyMedium,
    color: Colors.black,
    textAlign: 'right',
  },
})

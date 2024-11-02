import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import RowDivider from 'src/components/RowDivider'
import TokenDisplay from 'src/components/TokenDisplay'
import ArrowRightThick from 'src/icons/ArrowRightThick'
import { NETWORK_NAMES } from 'src/shared/conts'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTokenInfo } from 'src/tokens/hooks'
import FeeRowItem from 'src/transactions/feed/detailContent/FeeRowItem'
import { DepositOrWithdraw, FeeType, TokenTransactionTypeV2 } from 'src/transactions/types'

interface DepositOrWithdrawContentProps {
  transaction: DepositOrWithdraw
}

export function DepositOrWithdrawContent({ transaction }: DepositOrWithdrawContentProps) {
  const { t } = useTranslation()
  const txAppName = transaction.appName
  const tokenInfo = useTokenInfo(
    transaction.type === TokenTransactionTypeV2.Deposit
      ? transaction.outAmount.tokenId
      : transaction.inAmount.tokenId
  )
  const tokenSymbol = tokenInfo?.symbol ?? ''

  const isDeposit = transaction.type === TokenTransactionTypeV2.Deposit
  const amount = isDeposit ? transaction.outAmount : transaction.inAmount

  return (
    <>
      <Text style={styles.detailsTitle}>{t('transactionDetails.descriptionLabel')}</Text>
      <Text style={styles.detailsSubtitle}>
        {t(
          isDeposit ? 'transactionDetails.depositSubtitle' : 'transactionDetails.withdrawSubtitle',
          { context: !txAppName ? 'noTxAppName' : undefined, txAppName, tokenSymbol }
        )}
      </Text>
      <RowDivider />
      <View style={styles.amountContainer}>
        <View>
          <View style={styles.row}>
            <Text
              style={styles.amountTitle}
              testID={`${isDeposit ? 'Deposit' : 'Withdraw'}Details/title`}
            >
              {t(
                isDeposit
                  ? 'transactionDetails.depositDetails'
                  : 'transactionDetails.withdrawDetails'
              )}
            </Text>
            <TokenDisplay
              amount={amount.value}
              tokenId={amount.tokenId}
              showSymbol={true}
              showLocalAmount={false}
              style={styles.amountTitle}
            />
          </View>
          <TokenDisplay
            amount={amount.value}
            localAmount={amount.localAmount}
            tokenId={amount.tokenId}
            style={styles.amountSubtitle}
          />
        </View>
        {transaction.swap && (
          <View style={styles.row}>
            <Text style={styles.bodyText}>{t('transactionDetails.swap')}</Text>
            <View style={styles.swapValueContainer}>
              <TokenDisplay
                testID="DepositOrWithdraw/Swap/From"
                tokenId={transaction.swap.outAmount.tokenId}
                amount={transaction.swap.outAmount.value}
                showLocalAmount={false}
                style={styles.bodyText}
              />
              <ArrowRightThick size={20} color={Colors.black} />
              <TokenDisplay
                testID="DepositOrWithdraw/Swap/To"
                tokenId={transaction.swap.inAmount.tokenId}
                amount={transaction.swap.inAmount.value}
                showLocalAmount={false}
                style={styles.bodyText}
              />
            </View>
          </View>
        )}
        <View style={styles.row}>
          <Text style={styles.bodyText}>{t('transactionDetails.network')}</Text>
          <Text style={styles.bodyTextValue}>{NETWORK_NAMES[transaction.networkId]}</Text>
        </View>
      </View>
      <RowDivider />
      <Text style={styles.detailsTitle}>{t('transactionDetails.fees')}</Text>
      <View style={styles.feeContainer}>
        <FeeRowItem
          fees={transaction.fees}
          feeType={FeeType.SecurityFee}
          transactionStatus={transaction.status}
        />
        {transaction.swap && (
          <FeeRowItem
            fees={transaction.fees}
            feeType={FeeType.AppFee}
            transactionStatus={transaction.status}
          />
        )}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  detailsTitle: {
    ...typeScale.labelSmall,
    color: Colors.black,
  },
  detailsSubtitle: {
    ...typeScale.bodyMedium,
    color: Colors.black,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  bodyText: {
    ...typeScale.bodyMedium,
    color: Colors.black,
  },
  bodyTextValue: {
    ...typeScale.bodyMedium,
    color: Colors.black,
    textAlign: 'right',
  },
  amountTitle: {
    ...typeScale.labelSemiBoldMedium,
    color: Colors.black,
  },
  amountSubtitle: {
    ...typeScale.bodySmall,
    color: Colors.gray4,
    marginLeft: 'auto',
  },
  amountContainer: {
    gap: Spacing.Regular16,
  },
  feeContainer: {
    marginTop: Spacing.Smallest8,
    gap: Spacing.Regular16,
  },
  swapValueContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.Tiny4,
    alignItems: 'center',
  },
})

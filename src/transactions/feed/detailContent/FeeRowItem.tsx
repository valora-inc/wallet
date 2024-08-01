import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import TokenDisplay from 'src/components/TokenDisplay'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { Fee, FeeType, TransactionStatus } from 'src/transactions/types'

export interface Props {
  fees: Fee[]
  feeType: FeeType
  transactionStatus: TransactionStatus
}

export default function FeeRowItem({ fees, feeType, transactionStatus }: Props) {
  const { t } = useTranslation()

  let label = ''
  if (feeType === FeeType.SecurityFee) {
    label =
      transactionStatus === TransactionStatus.Pending
        ? t('transactionFeed.estimatedNetworkFee')
        : t('transactionFeed.networkFee')
  } else if (feeType === FeeType.AppFee) {
    label = t('transactionFeed.appFee')
  } else if (feeType === FeeType.CrossChainFee) {
    label =
      transactionStatus === TransactionStatus.Pending
        ? t('transactionFeed.estimatedCrossChainFee')
        : t('transactionFeed.crossChainFee')
  }

  const fee = fees.find((fee) => fee.type === feeType)

  if (!label || !fee) {
    return null
  }

  const showApproxFee =
    transactionStatus === TransactionStatus.Pending && feeType !== FeeType.AppFee
  return (
    <View style={styles.row} testID="TransactionDetails/FeeRowItem">
      <Text style={styles.bodyText}>{label}</Text>
      <View>
        <TokenDisplay
          style={styles.currencyAmountPrimaryText}
          amount={fee.amount.value}
          tokenId={fee.amount.tokenId}
          showLocalAmount={false}
          showSymbol={true}
          hideSign={true}
          showApprox={showApproxFee}
        />
        <TokenDisplay
          style={styles.currencyAmountSecondaryText}
          amount={fee.amount.value}
          tokenId={fee.amount.tokenId}
          showLocalAmount={true}
          localAmount={fee.amount.localAmount}
          showSymbol={true}
          hideSign={true}
          showApprox={showApproxFee}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.Small12,
  },
  bodyText: {
    ...typeScale.bodyMedium,
    color: Colors.black,
    flex: 1,
  },
  currencyAmountPrimaryText: {
    ...typeScale.bodyMedium,
    color: Colors.black,
    textAlign: 'right',
  },
  currencyAmountSecondaryText: {
    ...typeScale.bodySmall,
    color: Colors.gray3,
    textAlign: 'right',
  },
})

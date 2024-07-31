import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import TokenDisplay from 'src/components/TokenDisplay'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
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
  }

  const fee = fees.find((fee) => fee.type === feeType)

  if (!label || !fee) {
    return null
  }

  return (
    <View testID="TransactionDetails/FeeRowItem">
      <View style={styles.row}>
        <Text style={styles.bodyText}>{label}</Text>
        <TokenDisplay
          style={styles.currencyAmountPrimaryText}
          amount={fee.amount.value}
          tokenId={fee.amount.tokenId}
          showLocalAmount={false}
          showSymbol={true}
          hideSign={true}
        />
      </View>
      <TokenDisplay
        style={styles.currencyAmountSecondaryText}
        amount={fee.amount.value}
        tokenId={fee.amount.tokenId}
        showLocalAmount={true}
        showSymbol={true}
        hideSign={true}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    color: Colors.gray4,
    marginLeft: 'auto',
  },
})

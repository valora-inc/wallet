import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import TokenDisplay from 'src/components/TokenDisplay'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Fee, TransactionStatus } from 'src/transactions/types'

export interface Props {
  fees: Fee[]
  transactionStatus: TransactionStatus
}

export default function NetworkFeeRowItem({ fees, transactionStatus }: Props) {
  const { t } = useTranslation()

  return (
    <>
      {fees[0] && (
        <>
          <View style={styles.row}>
            <Text style={styles.bodyText}>
              {transactionStatus === TransactionStatus.Pending
                ? t('transactionFeed.estimatedNetworkFee')
                : t('transactionFeed.networkFee')}
            </Text>
            <TokenDisplay
              style={styles.currencyAmountPrimaryText}
              amount={fees[0].amount.value}
              tokenId={fees[0].amount.tokenId}
              showLocalAmount={false}
              showSymbol={true}
              hideSign={true}
              testID="TransactionDetails/EstimatedFee"
            />
          </View>
          <TokenDisplay
            style={styles.currencyAmountSecondaryText}
            amount={fees[0].amount.value}
            tokenId={fees[0].amount.tokenId}
            showLocalAmount={true}
            showSymbol={true}
            hideSign={true}
            testID="TransactionDetails/EstimatedFeeLocalAmount"
          />
        </>
      )}
    </>
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

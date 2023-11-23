import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTokensList } from 'src/tokens/hooks'
import NetworkFeeRowItem from 'src/transactions/feed/detailContent/NetworkFeeRowItem'
import { TokenApproval } from 'src/transactions/types'

export interface Props {
  transaction: TokenApproval
}

// Note that this is tested from TransactionDetailsScreen.test.tsx
export default function TokenApprovalDetails({ transaction }: Props) {
  const { t } = useTranslation()
  const tokensList = useTokensList()

  const tokenSymbol = tokensList.find((token) => token.tokenId === transaction.tokenId)?.symbol
  const approvedAmount = transaction.approvedAmount

  return (
    <View>
      <Text style={typeScale.labelSmall}>{t('transactionFeed.descriptionLabel')}</Text>
      <Text style={styles.description}>
        {tokenSymbol
          ? t('transactionFeed.approvalDescription', {
              tokenSymbol,
              approvedAmount: approvedAmount ?? '',
            })
          : '-'}
      </Text>

      <NetworkFeeRowItem fees={transaction.fees} transactionStatus={transaction.status} />
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  description: {
    ...typeScale.bodyMedium,
    color: Colors.black,
    flex: 1,
    paddingBottom: Spacing.XLarge48,
  },
})

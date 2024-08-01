import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { formatValueToDisplay } from 'src/components/TokenDisplay'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTokensList } from 'src/tokens/hooks'
import FeeRowItem from 'src/transactions/feed/detailContent/FeeRowItem'
import { FeeType, TokenApproval } from 'src/transactions/types'

export interface Props {
  transaction: TokenApproval
}

// Note that this is tested from TransactionDetailsScreen.test.tsx
export default function TokenApprovalDetails({ transaction }: Props) {
  const { t } = useTranslation()
  const tokensList = useTokensList()
  const token = tokensList.find((token) => token.tokenId === transaction.tokenId)

  let description = '-'
  if (token) {
    const tokenSymbol = token?.symbol
    const tokenDecimals = token?.decimals

    if (transaction.approvedAmount === null) {
      description = t('transactionFeed.infiniteApprovalDescription', { tokenSymbol })
    } else if (transaction.approvedAmount === '0') {
      description = t('transactionFeed.revokeApprovalDescription', { tokenSymbol })
    } else if (tokenDecimals) {
      description = t('transactionFeed.finiteApprovalDescription', {
        tokenSymbol,
        approvedAmount: formatValueToDisplay(new BigNumber(transaction.approvedAmount)),
      })
    }
  }

  return (
    <View>
      <Text style={typeScale.labelSmall}>{t('transactionFeed.descriptionLabel')}</Text>
      <Text style={styles.description}>{description}</Text>

      <FeeRowItem
        fees={transaction.fees}
        feeType={FeeType.SecurityFee}
        transactionStatus={transaction.status}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  description: {
    ...typeScale.bodyMedium,
    color: Colors.black,
    flex: 1,
    paddingBottom: Spacing.XLarge48,
  },
})

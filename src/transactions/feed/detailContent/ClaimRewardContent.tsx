import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import RowDivider from 'src/components/RowDivider'
import TokenDisplay from 'src/components/TokenDisplay'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { useTokenInfo } from 'src/tokens/hooks'
import FeeRowItem from 'src/transactions/feed/detailContent/FeeRowItem'
import { ClaimReward, FeeType } from 'src/transactions/types'

interface ClaimRewardProps {
  transaction: ClaimReward
}

export function ClaimRewardContent({ transaction }: ClaimRewardProps) {
  const { t } = useTranslation()
  const txAppName = transaction.appName
  const tokenInfo = useTokenInfo(transaction.amount.tokenId)
  const tokenSymbol = tokenInfo?.symbol ?? ''

  return (
    <>
      <Text style={styles.detailsTitle}>{t('transactionDetails.descriptionLabel')}</Text>
      <Text style={styles.detailsSubtitle}>
        {t('transactionDetails.claimRewardSubtitle', {
          context: !txAppName ? 'noTxAppName' : undefined,
          txAppName,
          tokenSymbol,
        })}
      </Text>
      <RowDivider />
      <View>
        <View style={styles.row}>
          <Text style={styles.amountTitle} testID={'ClaimRewardContent/title'}>
            {t('transactionDetails.claimRewardDetails')}
          </Text>
          <TokenDisplay
            amount={transaction.amount.value}
            tokenId={transaction.amount.tokenId}
            showSymbol={true}
            showLocalAmount={false}
            style={styles.amountTitle}
          />
        </View>
        <TokenDisplay
          amount={transaction.amount.value}
          localAmount={transaction.amount.localAmount}
          tokenId={transaction.amount.tokenId}
          style={styles.amountSubtitle}
        />
      </View>
      <RowDivider />
      <FeeRowItem
        fees={transaction.fees}
        feeType={FeeType.SecurityFee}
        transactionStatus={transaction.status}
      />
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
  amountTitle: {
    ...typeScale.labelSemiBoldMedium,
    color: Colors.black,
  },
  amountSubtitle: {
    ...typeScale.bodySmall,
    color: Colors.gray4,
    marginLeft: 'auto',
  },
})

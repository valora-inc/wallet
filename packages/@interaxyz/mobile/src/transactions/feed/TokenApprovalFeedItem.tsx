import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { HomeEvents } from 'src/analytics/Events'
import Touchable from 'src/components/Touchable'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import TransactionFeedItemImage from 'src/transactions/feed/TransactionFeedItemImage'
import { TokenApproval } from 'src/transactions/types'

interface Props {
  transaction: TokenApproval
}

function TokenApprovalFeedItem({ transaction }: Props) {
  const { t } = useTranslation()

  const handleOpenTransactionDetails = () => {
    navigate(Screens.TransactionDetailsScreen, { transaction })
    AppAnalytics.track(HomeEvents.transaction_feed_item_select, {
      itemType: transaction.type,
    })
  }

  return (
    <Touchable
      testID={`TokenApprovalFeedItem/${transaction.transactionHash}`}
      onPress={handleOpenTransactionDetails}
    >
      <View style={styles.container}>
        <TransactionFeedItemImage
          status={transaction.status}
          transactionType={transaction.type}
          networkId={transaction.networkId}
        />
        <Text style={styles.title}>{t('transactionFeed.approvalTransactionTitle')}</Text>
      </View>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: Spacing.Small12,
    paddingHorizontal: variables.contentPadding,
    alignItems: 'center',
  },
  title: {
    ...typeScale.labelMedium,
    paddingLeft: Spacing.Regular16,
  },
})

export default TokenApprovalFeedItem

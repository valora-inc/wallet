import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import TokenDisplay from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import TransactionFeedItemImage from 'src/transactions/feed/TransactionFeedItemImage'
import { CrossChainTokenExchange, TransactionStatus } from 'src/transactions/types'

interface Props {
  transaction: CrossChainTokenExchange
}

function CrossChainSwapFeedItem({ transaction }: Props) {
  const { t } = useTranslation()

  const handleOpenTransactionDetails = () => {
    navigate(Screens.TransactionDetailsScreen, { transaction })
    ValoraAnalytics.track(HomeEvents.transaction_feed_item_select)
  }

  return (
    <Touchable testID="CrossChainSwapFeedItem" onPress={handleOpenTransactionDetails}>
      <View style={styles.container}>
        <TransactionFeedItemImage
          status={transaction.status}
          transactionType={transaction.__typename}
          networkId={transaction.networkId}
          hideNetworkIcon
        />
        <View style={styles.contentContainer}>
          <Text style={styles.title} testID={'SwapFeedItem/title'} numberOfLines={1}>
            {t('swapScreen.title')}
          </Text>
          <Text style={styles.subtitle} testID={'SwapFeedItem/subtitle'} numberOfLines={1}>
            {t('transactionFeed.crossChainSwapTransactionLabel')}
          </Text>
        </View>
        <View style={styles.tokenAmountContainer}>
          {transaction.status === TransactionStatus.Complete && !!transaction.inAmount.value && (
            <TokenDisplay
              amount={transaction.inAmount.value}
              tokenId={transaction.inAmount.tokenId}
              showLocalAmount={false}
              showSymbol={true}
              showExplicitPositiveSign={true}
              hideSign={false}
              style={styles.amount}
              testID={'CrossChainSwapFeedItem/incomingAmount'}
            />
          )}

          <TokenDisplay
            amount={-transaction.outAmount.value}
            tokenId={transaction.outAmount.tokenId}
            showLocalAmount={false}
            showSymbol={true}
            hideSign={false}
            style={styles.tokenAmount}
            testID={'CrossChainSwapFeedItem/outgoingAmount'}
          />
        </View>
      </View>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingVertical: Spacing.Small12,
    paddingHorizontal: variables.contentPadding,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: variables.contentPadding,
  },
  title: {
    ...typeScale.labelMedium,
  },
  subtitle: {
    ...typeScale.bodySmall,
    color: colors.gray4,
  },
  tokenAmountContainer: {
    maxWidth: '50%',
  },
  amount: {
    ...typeScale.labelMedium,
    color: colors.primary,
    flexWrap: 'wrap',
    textAlign: 'right',
  },
  tokenAmount: {
    ...typeScale.bodySmall,
    color: colors.gray4,
    flexWrap: 'wrap',
    textAlign: 'right',
  },
})

export default CrossChainSwapFeedItem

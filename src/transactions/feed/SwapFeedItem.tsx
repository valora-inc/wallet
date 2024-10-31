import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { HomeEvents } from 'src/analytics/Events'
import TokenDisplay from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { useTokenInfo } from 'src/tokens/hooks'
import TransactionFeedItemImage from 'src/transactions/feed/TransactionFeedItemImage'
import { TokenExchange, TokenTransactionTypeV2 } from 'src/transactions/types'

interface Props {
  transaction: TokenExchange
}

function SwapFeedItem({ transaction }: Props) {
  const { t } = useTranslation()
  const incomingTokenInfo = useTokenInfo(transaction.inAmount.tokenId)
  const outgoingTokenInfo = useTokenInfo(transaction.outAmount.tokenId)

  const handleOpenTransactionDetails = () => {
    navigate(Screens.TransactionDetailsScreen, { transaction: transaction })
    AppAnalytics.track(HomeEvents.transaction_feed_item_select, {
      itemType: transaction.type,
    })
  }

  const isCrossChainSwap = transaction.type === TokenTransactionTypeV2.CrossChainSwapTransaction

  return (
    <Touchable testID="SwapFeedItem" onPress={handleOpenTransactionDetails}>
      <View style={styles.container}>
        <TransactionFeedItemImage
          status={transaction.status}
          transactionType={transaction.type}
          networkId={transaction.networkId}
          hideNetworkIcon={isCrossChainSwap}
        />
        <View style={styles.contentContainer}>
          <Text style={styles.title} testID={'SwapFeedItem/title'} numberOfLines={1}>
            {t('swapScreen.title')}
          </Text>
          <Text style={styles.subtitle} testID={'SwapFeedItem/subtitle'} numberOfLines={1}>
            {isCrossChainSwap
              ? t('transactionFeed.crossChainSwapTransactionLabel')
              : t('feedItemSwapPath', {
                  token1: outgoingTokenInfo?.symbol,
                  token2: incomingTokenInfo?.symbol,
                })}
          </Text>
        </View>
        <View style={styles.tokenAmountContainer}>
          {
            // for cross chain swaps specifically, the inAmount value is empty
            // until the transaction is completed on the destination network
            !new BigNumber(transaction.inAmount.value).isNaN() && (
              <TokenDisplay
                amount={transaction.inAmount.value}
                tokenId={transaction.inAmount.tokenId}
                showLocalAmount={false}
                showSymbol={true}
                showExplicitPositiveSign={true}
                hideSign={false}
                style={styles.amount}
                testID={'SwapFeedItem/incomingAmount'}
              />
            )
          }

          <TokenDisplay
            amount={-transaction.outAmount.value}
            tokenId={transaction.outAmount.tokenId}
            showLocalAmount={false}
            showSymbol={true}
            hideSign={false}
            style={styles.tokenAmount}
            testID={'SwapFeedItem/outgoingAmount'}
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
    color: colors.accent,
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

export default SwapFeedItem

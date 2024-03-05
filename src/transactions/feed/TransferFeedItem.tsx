import BigNumber from 'bignumber.js'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { hideHomeBalancesSelector } from 'src/app/selectors'
import TokenDisplay from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { useSelector } from 'src/redux/hooks'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { useTokenInfo } from 'src/tokens/hooks'
import { FeedTokenProperties } from 'src/transactions/feed/TransactionFeed'
import TransactionFeedItemImage from 'src/transactions/feed/TransactionFeedItemImage'
import { useTransferFeedDetails } from 'src/transactions/transferFeedUtils'
import { TokenTransfer } from 'src/transactions/types'

export type FeedTokenTransfer = TokenTransfer & FeedTokenProperties
interface Props {
  transfer: FeedTokenTransfer
}

function TransferFeedItem({ transfer }: Props) {
  const { amount } = transfer

  const openTransferDetails = () => {
    navigate(Screens.TransactionDetailsScreen, { transaction: transfer })
    ValoraAnalytics.track(HomeEvents.transaction_feed_item_select)
  }

  const tokenInfo = useTokenInfo(amount.tokenId)
  const showTokenAmount = !amount.localAmount && !tokenInfo?.priceUsd
  const { title, subtitle, recipient, customLocalAmount } = useTransferFeedDetails(transfer)

  const colorStyle = new BigNumber(amount.value).isPositive() ? { color: colors.primary } : {}

  const hideHomeBalanceState = useSelector(hideHomeBalancesSelector)
  const hideBalance =
    getFeatureGate(StatsigFeatureGates.SHOW_HIDE_HOME_BALANCES_TOGGLE) && hideHomeBalanceState

  return (
    <Touchable testID="TransferFeedItem" onPress={openTransferDetails}>
      <View style={styles.container}>
        <TransactionFeedItemImage
          recipient={recipient}
          status={transfer.status}
          transactionType={transfer.__typename}
        />
        <View style={styles.contentContainer}>
          <Text style={styles.title} testID={'TransferFeedItem/title'} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle} testID={'TransferFeedItem/subtitle'} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        {!hideBalance && (
          <View style={styles.amountContainer}>
            <TokenDisplay
              amount={amount.value}
              tokenId={amount.tokenId}
              localAmount={customLocalAmount ?? amount.localAmount}
              showExplicitPositiveSign={true}
              showLocalAmount={!showTokenAmount}
              style={[styles.amount, colorStyle]}
              testID={'TransferFeedItem/amount'}
            />
            <TokenDisplay
              amount={amount.value}
              tokenId={amount.tokenId}
              showLocalAmount={false}
              showSymbol={true}
              hideSign={true}
              style={[styles.tokenAmount, { opacity: showTokenAmount ? 0 : 1 }]}
              testID={'TransferFeedItem/tokenAmount'}
            />
          </View>
        )}
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
  amountContainer: {
    maxWidth: '50%',
  },
  title: {
    ...typeScale.labelMedium,
  },
  subtitle: {
    ...typeScale.bodySmall,
    color: colors.gray4,
  },
  amount: {
    ...typeScale.labelMedium,
    color: colors.black,
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

export default TransferFeedItem

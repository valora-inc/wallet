import BigNumber from 'bignumber.js'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { hideHomeBalancesSelector } from 'src/app/selectors'
import TokenDisplay from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
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

  const colorStyle = new BigNumber(amount.value).isPositive() ? { color: colors.greenUI } : {}

  const hideBalance = getFeatureGate(StatsigFeatureGates.SHOW_HIDE_HOME_BALANCES_TOGGLE)
    ? useSelector(hideHomeBalancesSelector)
    : false

  return (
    <Touchable testID="TransferFeedItem" disabled={false} onPress={openTransferDetails}>
      <View style={styles.container}>
        <TransactionFeedItemImage
          recipient={recipient}
          status={transfer.status}
          transactionType={transfer.__typename}
        />
        <View style={styles.contentContainer}>
          <Text style={styles.title} testID={'TransferFeedItem/title'}>
            {title}
          </Text>
          <Text style={styles.subtitle} testID={'TransferFeedItem/subtitle'}>
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
            {!showTokenAmount && (
              <TokenDisplay
                amount={amount.value}
                tokenId={amount.tokenId}
                showLocalAmount={false}
                showSymbol={true}
                hideSign={true}
                style={styles.tokenAmount}
                testID={'TransferFeedItem/tokenAmount'}
              />
            )}
          </View>
        )}
      </View>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: variables.contentPadding,
  },
  contentContainer: {
    paddingHorizontal: variables.contentPadding,
    flex: 1,
    flexGrow: 1,
  },
  amountContainer: {
    alignItems: 'flex-end',
    flex: 0,
    maxWidth: '35%',
  },
  title: {
    ...fontStyles.regular500,
    flexShrink: 1,
  },
  subtitle: {
    ...fontStyles.small,
    color: colors.gray4,
    paddingTop: 2,
  },
  amount: {
    ...fontStyles.regular500,
    flexWrap: 'wrap',
    textAlign: 'right',
  },
  tokenAmount: {
    ...fontStyles.small,
    color: colors.gray4,
    paddingTop: 2,
    flexWrap: 'wrap',
    textAlign: 'right',
  },
})

export default TransferFeedItem

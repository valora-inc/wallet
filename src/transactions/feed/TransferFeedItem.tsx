import BigNumber from 'bignumber.js'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import ContactCircle from 'src/components/ContactCircle'
import TokenDisplay from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { useTokenInfo } from 'src/tokens/hooks'
import { FeedTokenProperties } from 'src/transactions/feed/TransactionFeed'
import { useTransferFeedDetails } from 'src/transactions/transferFeedUtils'
import { TokenTransfer } from 'src/transactions/types'

const AVATAR_SIZE = 40

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

  const tokenInfo = useTokenInfo(amount.tokenAddress)
  const showTokenAmount = !amount.localAmount && !tokenInfo?.usdPrice
  const { title, subtitle, recipient, elapsed, displayTime } = useTransferFeedDetails(transfer)

  const colorStyle = new BigNumber(amount.value).isPositive() ? { color: colors.greenUI } : {}

  return (
    <Touchable disabled={false} onPress={openTransferDetails}>
      <View style={styles.container}>
        <View>{<ContactCircle recipient={recipient} size={AVATAR_SIZE} />}</View>
        <View style={styles.descriptionContainer}>
          <Text style={styles.title} testID={'TransferFeedItem/title'}>
            {title}
          </Text>
          <Text style={styles.subtitle} testID={'TransferFeedItem/subtitle'}>
            {subtitle} {displayTime || elapsed}
          </Text>
        </View>
        <View style={styles.amountContainer}>
          <TokenDisplay
            amount={amount.value}
            tokenAddress={amount.tokenAddress}
            localAmount={amount.localAmount}
            showExplicitPositiveSign={true}
            showLocalAmount={!showTokenAmount}
            style={[styles.amount, colorStyle]}
            testID={'TransferFeedItem/amount'}
          />
          {!showTokenAmount && (
            <TokenDisplay
              amount={amount.value}
              tokenAddress={amount.tokenAddress}
              showLocalAmount={false}
              showSymbol={true}
              hideSign={true}
              style={styles.tokenAmount}
              testID={'TransferFeedItem/tokenAmount'}
            />
          )}
        </View>
      </View>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: variables.contentPadding,
  },
  descriptionContainer: {
    marginLeft: variables.contentPadding,
    width: '60%',
  },
  amountContainer: {
    marginLeft: variables.contentPadding,
    flexShrink: 1,
  },
  title: {
    ...fontStyles.regular500,
  },
  subtitle: {
    ...fontStyles.small,
    color: colors.gray4,
    paddingTop: 2,
  },
  amount: {
    ...fontStyles.regular500,
    marginLeft: 'auto',
    textAlign: 'right',
  },
  tokenAmount: {
    ...fontStyles.small,
    color: colors.gray4,
    paddingTop: 2,
    marginLeft: 'auto',
    minWidth: '40%',
    textAlign: 'right',
  },
})

export default TransferFeedItem

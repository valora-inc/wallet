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
  const { title, subtitle, recipient } = useTransferFeedDetails(transfer)

  const colorStyle = new BigNumber(amount.value).isPositive() ? { color: colors.greenUI } : {}

  return (
    <Touchable testID="TransferFeedItem" disabled={false} onPress={openTransferDetails}>
      <View style={styles.container}>
        <ContactCircle
          style={{ alignItems: 'flex-start' }}
          recipient={recipient}
          size={AVATAR_SIZE}
        />
        <View style={styles.contentContainer}>
          <Text style={styles.title} testID={'TransferFeedItem/title'}>
            {title}
          </Text>
          <Text style={styles.subtitle} testID={'TransferFeedItem/subtitle'}>
            {subtitle}
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

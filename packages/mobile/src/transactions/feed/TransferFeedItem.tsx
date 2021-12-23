import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import ContactCircle from 'src/components/ContactCircle'
import TokenDisplay from 'src/components/TokenDisplay'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { FeedTokenProperties } from 'src/transactions/feed/TransactionFeed'
import { useTransferFeedDetails } from 'src/transactions/transferFeedUtils'
import { TokenTransfer, TransactionStatus } from 'src/transactions/types'

const AVATAR_SIZE = 40

export const STAND_BY_TRANSACTION_SUBTITLE_KEY = 'confirmingTransaction'

export type FeedTokenTransfer = TokenTransfer & FeedTokenProperties

interface Props {
  transfer: FeedTokenTransfer
}

function TransferFeedItem({ transfer }: Props) {
  const { amount } = transfer
  const { t } = useTranslation()

  const openTransferDetails = () => {
    navigate(Screens.TransactionDetailsScreen, { transaction: transfer })
    ValoraAnalytics.track(HomeEvents.transaction_feed_item_select)
  }

  const { title, subtitle, recipient } = useTransferFeedDetails(transfer)
  const isStandbyTransaction = transfer.status === TransactionStatus.Pending

  // I feel this should be inside useTransferFeedDetails() instead of here. What do you think?
  const subtitleModified = isStandbyTransaction ? t(STAND_BY_TRANSACTION_SUBTITLE_KEY) : subtitle
  const colorStyle = new BigNumber(amount.value).isPositive() ? { color: colors.greenUI } : {}

  return (
    <Touchable disabled={isStandbyTransaction} onPress={openTransferDetails}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          {<ContactCircle recipient={recipient} size={AVATAR_SIZE} />}
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} testID={'TransferFeedItem/title'}>
              {title}
            </Text>
            <TokenDisplay
              amount={amount.value}
              tokenAddress={amount.tokenAddress}
              currencyInfo={
                amount.localAmount
                  ? {
                      localCurrencyCode: amount.localAmount.currencyCode as LocalCurrencyCode,
                      localExchangeRate: amount.localAmount.exchangeRate,
                    }
                  : undefined
              }
              showExplicitPositiveSign={true}
              style={[styles.amount, colorStyle]}
              testID={'TransferFeedItem/amount'}
            />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.subtitle} testID={'TransferFeedItem/subtitle'}>
              {subtitleModified}
            </Text>
            <TokenDisplay
              amount={amount.value}
              tokenAddress={amount.tokenAddress}
              showLocalAmount={false}
              showSymbol={true}
              hideSign={true}
              style={styles.tokenAmount}
              testID={'TransferFeedItem/tokenAmount'}
            />
          </View>
        </View>
      </View>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: variables.contentPadding,
  },
  iconContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    marginLeft: variables.contentPadding,
  },
  titleContainer: {
    flexDirection: 'row',
    marginTop: -1,
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
    marginLeft: 'auto',
    paddingLeft: 10,
    minWidth: '40%',
    textAlign: 'right',
    flexWrap: 'wrap',
  },
  tokenAmount: {
    ...fontStyles.small,
    color: colors.gray4,
    paddingTop: 2,
    paddingLeft: 10,
    marginLeft: 'auto',
    minWidth: '40%',
    textAlign: 'right',
    flexWrap: 'wrap',
  },
})

export default TransferFeedItem

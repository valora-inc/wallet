import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import BigNumber from 'bignumber.js'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import ContactCircle from 'src/components/ContactCircle'
import TokenDisplay from 'src/components/TokenDisplay'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { useTransferFeedDetails } from 'src/transactions/transferFeedUtils'
import { TokenTransfer } from 'src/transactions/types'

const AVATAR_SIZE = 40

interface Props {
  transfer: TokenTransfer
}

function TransferFeedItem({ transfer }: Props) {
  const { type, amount } = transfer

  const openTransferDetails = () => {
    // TODO: Allow opening detail screen.
    // navigateToPaymentTransferReview(type, timestamp, {
    //   comment: getDecryptedTransferFeedComment(comment ?? null, commentKey, type),
    //   amount,
    //   recipient,
    //   type,
    //   // fee TODO: add fee here.
    // })
    ValoraAnalytics.track(HomeEvents.transaction_feed_item_select)
  }

  const { title, subtitle, recipient } = useTransferFeedDetails(transfer)
  const colorStyle = new BigNumber(amount.value).isPositive() ? { color: colors.greenUI } : {}

  return (
    <Touchable disabled={false} onPress={openTransferDetails}>
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
              {subtitle}
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
    width: '40%',
    textAlign: 'right',
    flexWrap: 'wrap',
  },
  tokenAmount: {
    ...fontStyles.small,
    color: colors.gray4,
    paddingTop: 2,
    paddingLeft: 10,
    marginLeft: 'auto',
    width: '40%',
    textAlign: 'right',
    flexWrap: 'wrap',
  },
})

export default TransferFeedItem

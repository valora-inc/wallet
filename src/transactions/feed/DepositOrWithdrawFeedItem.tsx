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
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import TransactionFeedItemImage from 'src/transactions/feed/TransactionFeedItemImage'
import { DepositOrWithdraw, TokenTransactionTypeV2 } from 'src/transactions/types'

interface DescriptionProps {
  transaction: DepositOrWithdraw
}

function Description({ transaction }: DescriptionProps) {
  const { t } = useTranslation()
  const txAppName = transaction.appName
  let title
  let subtitle

  switch (transaction.type) {
    case TokenTransactionTypeV2.Deposit:
      title = t('transactionFeed.depositTitle')
      subtitle = t('transactionFeed.depositSubtitle', {
        context: !txAppName ? 'noTxAppName' : undefined,
        txAppName,
      })
      break
    case TokenTransactionTypeV2.Withdraw:
      title = t('transactionFeed.withdrawTitle')
      subtitle = t('transactionFeed.withdrawSubtitle', {
        context: !txAppName ? 'noTxAppName' : undefined,
        txAppName,
      })
      break
  }

  return (
    <View style={styles.contentContainer}>
      <Text style={styles.title} testID={'DepositOrWithdrawFeedItem/title'} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.subtitle} testID={'DepositOrWithdrawFeedItem/subtitle'} numberOfLines={1}>
        {subtitle}
      </Text>
    </View>
  )
}

interface AmountDisplayProps {
  transaction: DepositOrWithdraw
  isLocal: boolean
}

function AmountDisplay({ transaction, isLocal }: AmountDisplayProps) {
  let amountValue
  let localAmount
  let tokenId

  switch (transaction.type) {
    case TokenTransactionTypeV2.Deposit:
      amountValue = new BigNumber(-transaction.outAmount.value)
      localAmount = transaction.outAmount.localAmount
      tokenId = transaction.outAmount.tokenId
      break
    case TokenTransactionTypeV2.Withdraw:
      amountValue = new BigNumber(transaction.inAmount.value)
      localAmount = transaction.inAmount.localAmount
      tokenId = transaction.inAmount.tokenId
      break
  }

  const textStyle = isLocal
    ? styles.amountSubtitle
    : [
        styles.amountTitle,
        transaction.type === TokenTransactionTypeV2.Withdraw && { color: Colors.accent },
      ]

  return (
    <TokenDisplay
      amount={amountValue}
      localAmount={localAmount}
      tokenId={tokenId}
      showLocalAmount={isLocal}
      showSymbol={true}
      showExplicitPositiveSign={!isLocal}
      hideSign={!!isLocal}
      style={textStyle}
      testID={`DepositOrWithdrawFeedItem/${transaction.type}-amount-${isLocal ? 'local' : 'crypto'}`}
    />
  )
}

interface AmountProps {
  transaction: DepositOrWithdraw
}

function Amount({ transaction }: AmountProps) {
  return (
    <View style={styles.amountContainer}>
      <AmountDisplay transaction={transaction} isLocal={false} />
      <AmountDisplay transaction={transaction} isLocal={true} />
    </View>
  )
}

interface Props {
  transaction: DepositOrWithdraw
}

export default function DepositOrWithdrawFeedItem({ transaction }: Props) {
  return (
    <Touchable
      testID={`DepositOrWithdrawFeedItem/${transaction.transactionHash}`}
      onPress={() => {
        AppAnalytics.track(HomeEvents.transaction_feed_item_select, {
          itemType: transaction.type,
        })
        navigate(Screens.TransactionDetailsScreen, { transaction })
      }}
    >
      <View style={styles.container}>
        <TransactionFeedItemImage
          status={transaction.status}
          transactionType={transaction.type}
          networkId={transaction.networkId}
        />
        <Description transaction={transaction} />
        <Amount transaction={transaction} />
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
  contentContainer: {
    flex: 1,
    paddingHorizontal: variables.contentPadding,
  },
  title: {
    ...typeScale.labelMedium,
    color: Colors.black,
  },
  subtitle: {
    ...typeScale.bodySmall,
    color: Colors.gray4,
  },
  amountContainer: {
    maxWidth: '50%',
  },
  amountTitle: {
    ...typeScale.labelMedium,
    color: Colors.black,
    flexWrap: 'wrap',
    textAlign: 'right',
  },
  amountSubtitle: {
    ...typeScale.bodySmall,
    color: Colors.gray4,
    flexWrap: 'wrap',
    textAlign: 'right',
  },
})

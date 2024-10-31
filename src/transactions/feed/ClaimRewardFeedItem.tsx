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
import { ClaimReward } from 'src/transactions/types'

interface DescriptionProps {
  transaction: ClaimReward
}

function Description({ transaction }: DescriptionProps) {
  const { t } = useTranslation()
  const txAppName = transaction.appName
  const title = t('transactionFeed.claimRewardTitle')
  const subtitle = t('transactionFeed.claimRewardSubtitle', {
    context: !txAppName ? 'noTxAppName' : undefined,
    txAppName,
  })

  return (
    <View style={styles.contentContainer}>
      <Text style={styles.title} testID={'ClaimRewardFeedItem/title'} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.subtitle} testID={'ClaimRewardFeedItem/subtitle'} numberOfLines={1}>
        {subtitle}
      </Text>
    </View>
  )
}

interface AmountDisplayProps {
  transaction: ClaimReward
  isLocal: boolean
}

function AmountDisplay({ transaction, isLocal }: AmountDisplayProps) {
  const amountValue = new BigNumber(transaction.amount.value)
  const tokenId = transaction.amount.tokenId

  const textStyle = isLocal ? styles.amountSubtitle : [styles.amountTitle, { color: Colors.accent }]

  return (
    <TokenDisplay
      amount={amountValue}
      localAmount={transaction.amount.localAmount}
      tokenId={tokenId}
      showLocalAmount={isLocal}
      showSymbol={true}
      showExplicitPositiveSign={!isLocal}
      hideSign={!!isLocal}
      style={textStyle}
      testID={`ClaimRewardFeedItem/amount-${isLocal ? 'local' : 'crypto'}`}
    />
  )
}

interface AmountProps {
  transaction: ClaimReward
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
  transaction: ClaimReward
}

export default function ClaimRewardFeedItem({ transaction }: Props) {
  return (
    <Touchable
      testID={`ClaimRewardFeedItem/${transaction.transactionHash}`}
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

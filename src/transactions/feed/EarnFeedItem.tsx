import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import TokenDisplay from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import { useEarnPositionProviderName } from 'src/earn/hooks'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import TransactionFeedItemImage from 'src/transactions/feed/TransactionFeedItemImage'
import { EarnClaimReward, EarnDeposit, EarnSwapDeposit, EarnWithdraw } from 'src/transactions/types'

interface DescriptionProps {
  transaction: EarnWithdraw | EarnDeposit | EarnClaimReward | EarnSwapDeposit
}

function Description({ transaction }: DescriptionProps) {
  const { t } = useTranslation()
  const providerName = useEarnPositionProviderName(
    transaction.__typename === 'EarnSwapDeposit'
      ? transaction.deposit.providerId
      : transaction.providerId
  )
  let title
  let subtitle

  switch (transaction.__typename) {
    case 'EarnSwapDeposit':
    case 'EarnDeposit':
      title = t('earnFlow.transactionFeed.earnDepositTitle')
      subtitle = t('earnFlow.transactionFeed.earnDepositSubtitle', { providerName })
      break
    case 'EarnWithdraw':
      title = t('earnFlow.transactionFeed.earnWithdrawTitle')
      subtitle = t('earnFlow.transactionFeed.earnWithdrawSubtitle', { providerName })
      break
    case 'EarnClaimReward':
      title = t('earnFlow.transactionFeed.earnClaimTitle')
      subtitle = t('earnFlow.transactionFeed.earnClaimSubtitle', { providerName })
      break
  }

  return (
    <View style={styles.contentContainer}>
      <Text style={styles.title} testID={'EarnFeedItem/title'} numberOfLines={1}>
        {title}
      </Text>
      {!!providerName && (
        <Text style={styles.subtitle} testID={'EarnFeedItem/subtitle'} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
    </View>
  )
}

interface AmountDisplayProps {
  transaction: EarnWithdraw | EarnDeposit | EarnClaimReward | EarnSwapDeposit
  isLocal: boolean
}

function AmountDisplay({ transaction, isLocal }: AmountDisplayProps) {
  let amountValue
  let tokenId

  switch (transaction.__typename) {
    case 'EarnDeposit':
      amountValue = new BigNumber(-transaction.inAmount.value)
      tokenId = transaction.outAmount.tokenId
      break
    case 'EarnSwapDeposit':
      amountValue = new BigNumber(-transaction.deposit.inAmount.value)
      tokenId = transaction.deposit.outAmount.tokenId
      break
    case 'EarnWithdraw':
      amountValue = new BigNumber(transaction.outAmount.value)
      tokenId = transaction.inAmount.tokenId
      break
    case 'EarnClaimReward':
      amountValue = new BigNumber(transaction.amount.value)
      tokenId = transaction.amount.tokenId
      break
  }

  const textStyle = isLocal
    ? styles.amountSubtitle
    : [
        styles.amountTitle,
        transaction.__typename !== 'EarnDeposit' &&
          transaction.__typename !== 'EarnSwapDeposit' && { color: Colors.primary },
      ]

  return (
    <TokenDisplay
      amount={amountValue}
      tokenId={tokenId}
      showLocalAmount={isLocal}
      showSymbol={true}
      showExplicitPositiveSign={!isLocal}
      hideSign={!!isLocal}
      style={textStyle}
      testID={`EarnFeedItem/${transaction.__typename}-amount-${isLocal ? 'local' : 'crypto'}`}
    />
  )
}

interface AmountProps {
  transaction: EarnWithdraw | EarnDeposit | EarnClaimReward | EarnSwapDeposit
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
  transaction: EarnWithdraw | EarnDeposit | EarnClaimReward | EarnSwapDeposit
}

export default function EarnFeedItem({ transaction }: Props) {
  return (
    <Touchable
      testID={`EarnFeedItem/${transaction.transactionHash}`}
      onPress={() => {
        AppAnalytics.track(EarnEvents.earn_feed_item_select, { origin: transaction.__typename })
        navigate(Screens.TransactionDetailsScreen, { transaction })
      }}
    >
      <View style={styles.container}>
        <TransactionFeedItemImage
          status={transaction.status}
          transactionType={transaction.__typename}
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

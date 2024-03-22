import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { hideHomeBalancesSelector } from 'src/app/selectors'
import TokenDisplay from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { useTokenInfo } from 'src/tokens/hooks'
import TransactionFeedItemImage from 'src/transactions/feed/TransactionFeedItemImage'
import { TokenExchange } from 'src/transactions/types'

interface Props {
  exchange: TokenExchange
}

function SwapFeedItem({ exchange }: Props) {
  const { t } = useTranslation()
  const incomingTokenInfo = useTokenInfo(exchange.inAmount.tokenId)
  const outgoingTokenInfo = useTokenInfo(exchange.outAmount.tokenId)

  const handleTransferDetails = () => {
    navigate(Screens.TransactionDetailsScreen, { transaction: exchange })
    ValoraAnalytics.track(HomeEvents.transaction_feed_item_select)
  }

  const hideHomeBalanceState = useSelector(hideHomeBalancesSelector)

  return (
    <Touchable testID="SwapFeedItem" onPress={handleTransferDetails}>
      <View style={styles.container}>
        <TransactionFeedItemImage
          status={exchange.status}
          transactionType={exchange.__typename}
          networkId={exchange.networkId}
        />
        <View style={styles.contentContainer}>
          <Text style={styles.title} testID={'SwapFeedItem/title'} numberOfLines={1}>
            {t('swapScreen.title')}
          </Text>
          <Text style={styles.subtitle} testID={'SwapFeedItem/subtitle'} numberOfLines={1}>
            {t('feedItemSwapPath', {
              token1: outgoingTokenInfo?.symbol,
              token2: incomingTokenInfo?.symbol,
            })}
          </Text>
        </View>
        {!hideHomeBalanceState && (
          <View style={styles.tokenAmountContainer}>
            <TokenDisplay
              amount={exchange.inAmount.value}
              tokenId={exchange.inAmount.tokenId}
              showLocalAmount={false}
              showSymbol={true}
              showExplicitPositiveSign={true}
              hideSign={false}
              style={styles.amount}
              testID={'SwapFeedItem/incomingAmount'}
            />
            <TokenDisplay
              amount={-exchange.outAmount.value}
              tokenId={exchange.outAmount.tokenId}
              showLocalAmount={false}
              showSymbol={true}
              hideSign={false}
              style={styles.tokenAmount}
              testID={'SwapFeedItem/outgoingAmount'}
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
    color: colors.primary,
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

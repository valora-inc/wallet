import React from 'react'
import { useTranslation } from 'react-i18next'
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

  const hideBalanceSelectorReturn = useSelector(hideHomeBalancesSelector)
  const hideBalance = getFeatureGate(StatsigFeatureGates.SHOW_HIDE_HOME_BALANCES_TOGGLE)
    ? hideBalanceSelectorReturn
    : false

  return (
    <Touchable testID="SwapFeedItem" onPress={handleTransferDetails}>
      <View style={styles.container}>
        <TransactionFeedItemImage status={exchange.status} transactionType={exchange.__typename} />
        <View style={styles.contentContainer}>
          <Text style={styles.title} testID={'SwapFeedItem/title'}>
            {t('swapScreen.title')}
          </Text>
          <Text style={styles.subtitle} testID={'SwapFeedItem/subtitle'}>
            {t('feedItemSwapPath', {
              token1: outgoingTokenInfo?.symbol,
              token2: incomingTokenInfo?.symbol,
            })}
          </Text>
        </View>
        {!hideBalance && (
          <View style={styles.tokenAmountContainer}>
            <TokenDisplay
              amount={exchange.inAmount.value}
              tokenId={exchange.inAmount.tokenId}
              showLocalAmount={false}
              showSymbol={true}
              showExplicitPositiveSign={true}
              hideSign={false}
              style={[styles.amount, { color: colors.greenUI }]}
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
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: variables.contentPadding,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: variables.contentPadding,
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
  tokenAmountContainer: {
    flex: 1,
    marginLeft: variables.contentPadding,
    paddingLeft: 10,
    alignItems: 'flex-end',
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

export default SwapFeedItem

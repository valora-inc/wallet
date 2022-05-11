import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import TokenDisplay from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import { transactionExchange } from 'src/images/Images'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { useTokenInfoBySymbol } from 'src/tokens/hooks'
import { TokenExchange } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import { getLocalCurrencyDisplayValue, getMoneyDisplayValue } from 'src/utils/formatting'

interface Props {
  exchange: TokenExchange
}

function ExchangeFeedItem({ exchange }: Props) {
  const { t } = useTranslation()
  const { inAmount, outAmount } = exchange

  const celoAddress = useTokenInfoBySymbol('CELO')?.address

  const soldCELO = inAmount.tokenAddress === celoAddress
  const [celoAmount, stableAmount] = soldCELO ? [inAmount, outAmount] : [outAmount, inAmount]
  const colorStyle = soldCELO ? { color: colors.greenUI } : {}

  const openTransferDetails = () => {
    navigate(Screens.TransactionDetailsScreen, { transaction: exchange })
    ValoraAnalytics.track(HomeEvents.transaction_feed_item_select)
  }

  return (
    <Touchable disabled={false} onPress={openTransferDetails}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Image source={transactionExchange} style={styles.image} resizeMode="contain" />
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} testID={'ExchangeFeedItem/title'}>
              {t(soldCELO ? 'feedItemSoldCeloTitle' : 'feedItemBoughtCeloTitle')}
            </Text>
            <TokenDisplay
              amount={new BigNumber(stableAmount.value).times(soldCELO ? 1 : -1)}
              tokenAddress={stableAmount.tokenAddress}
              localAmount={stableAmount.localAmount}
              showExplicitPositiveSign={true}
              style={[styles.amount, colorStyle]}
              testID={'ExchangeFeedItem/amount'}
            />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.subtitle} testID={'ExchangeFeedItem/subtitle'}>
              {t('feedItemExchangeCeloInfo', {
                amount: getMoneyDisplayValue(celoAmount.value, Currency.Celo),
                price: celoAmount.localAmount
                  ? getLocalCurrencyDisplayValue(
                      celoAmount.localAmount.exchangeRate,
                      celoAmount.localAmount.currencyCode as LocalCurrencyCode,
                      true
                    )
                  : '-',
              })}
            </Text>
            <TokenDisplay
              amount={celoAmount.value}
              tokenAddress={celoAmount.tokenAddress}
              showLocalAmount={false}
              showSymbol={true}
              hideSign={true}
              style={styles.tokenAmount}
              testID={'ExchangeFeedItem/tokenAmount'}
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
  image: {
    height: 40,
    width: 40,
  },
})

export default ExchangeFeedItem

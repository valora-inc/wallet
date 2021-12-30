import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import TokenDisplay from 'src/components/TokenDisplay'
import { transactionExchange } from 'src/images/Images'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { useTokenInfoBySymbol } from 'src/tokens/hooks'
import { TokenExchange } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import { getLocalCurrencyDisplayValue, getMoneyDisplayValue } from 'src/utils/formatting'

const AVATAR_SIZE = 40

interface Props {
  exchange: TokenExchange
}

function ExchangeFeedItem({ exchange }: Props) {
  const { t } = useTranslation()
  const { inAmount, outAmount } = exchange

  const celoAddress = useTokenInfoBySymbol('CELO')?.address

  const soldCELO = inAmount.tokenAddress === celoAddress
  const celoAmount = soldCELO ? inAmount : outAmount
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
              amount={new BigNumber(celoAmount.value).times(soldCELO ? 1 : -1)}
              tokenAddress={celoAmount.tokenAddress}
              currencyInfo={
                celoAmount.localAmount
                  ? {
                      localCurrencyCode: celoAmount.localAmount.currencyCode as LocalCurrencyCode,
                      localExchangeRate: celoAmount.localAmount.exchangeRate,
                    }
                  : undefined
              }
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

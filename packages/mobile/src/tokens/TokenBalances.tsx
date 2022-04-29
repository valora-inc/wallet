import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import React, { useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { showPriceChangeIndicatorInBalancesSelector } from 'src/app/selectors'
import PercentageIndicator from 'src/components/PercentageIndicator'
import TokenDisplay from 'src/components/TokenDisplay'
import { TIME_OF_SUPPORTED_UNSYNC_HISTORICAL_PRICES } from 'src/config'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { headerWithBackButton } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { TokenBalance } from 'src/tokens/reducer'
import { tokensWithTokenBalanceSelector, totalTokenBalanceSelector } from 'src/tokens/selectors'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'
import { sortByUsdBalance } from './utils'

type Props = StackScreenProps<StackParamList, Screens.TokenBalances>
function TokenBalancesScreen({ navigation }: Props) {
  const { t } = useTranslation()
  const tokens = useSelector(tokensWithTokenBalanceSelector)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const totalBalance = useSelector(totalTokenBalanceSelector)
  const showPriceChangeIndicatorInBalances = useSelector(showPriceChangeIndicatorInBalancesSelector)

  const header = () => {
    return (
      <View style={styles.header}>
        <Text style={fontStyles.navigationHeader}>{t('balances')}</Text>
        <Text style={styles.subtext}>
          {localCurrencySymbol}
          {totalBalance?.toFormat(2)}
        </Text>
      </View>
    )
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: header,
    })
  }, [navigation, totalBalance, localCurrencySymbol])

  function isHistoricalPriceUpdated(token: TokenBalance) {
    return (
      token.historicalUsdPrices?.lastDay &&
      TIME_OF_SUPPORTED_UNSYNC_HISTORICAL_PRICES >
        Math.abs(token.historicalUsdPrices.lastDay.at - (Date.now() - ONE_DAY_IN_MILLIS))
    )
  }

  function getTokenDisplay(token: TokenBalance) {
    return (
      <View key={`Token${token.address}`} style={styles.tokenContainer}>
        <View style={styles.row}>
          <Image source={{ uri: token.imageUrl }} style={styles.tokenImg} />
          <View style={styles.tokenLabels}>
            <Text style={styles.tokenName}>{token.symbol}</Text>
            <Text style={styles.subtext}>{token.name}</Text>
          </View>
        </View>
        <View style={styles.balances}>
          <TokenDisplay
            amount={new BigNumber(token.balance!)}
            tokenAddress={token.address}
            style={styles.tokenAmt}
            showLocalAmount={false}
            showSymbol={false}
            testID={`tokenBalance:${token.symbol}`}
          />
          {token.usdPrice?.gt(0) && (
            <View style={{ flexDirection: 'row' }}>
              {showPriceChangeIndicatorInBalances &&
                token.historicalUsdPrices &&
                isHistoricalPriceUpdated(token) && (
                  <PercentageIndicator
                    testID={`percentageIndicator:${token.symbol}`}
                    comparedValue={token.historicalUsdPrices.lastDay.price}
                    currentValue={token.usdPrice}
                  />
                )}
              <TokenDisplay
                amount={new BigNumber(token.balance!)}
                tokenAddress={token.address}
                style={{ ...styles.subtext, marginLeft: 8 }}
                testID={`tokenLocalBalance:${token.symbol}`}
              />
            </View>
          )}
        </View>
      </View>
    )
  }

  return (
    <>
      {showPriceChangeIndicatorInBalances && (
        <View style={styles.lastDayLabel}>
          <Text style={styles.lastDayText}>{t('lastDay')}</Text>
        </View>
      )}
      <ScrollView style={styles.scrollContainer}>
        {tokens.sort(sortByUsdBalance).map(getTokenDisplay)}
      </ScrollView>
    </>
  )
}

TokenBalancesScreen.navigationOptions = {
  ...headerWithBackButton,
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    flexDirection: 'column',
    paddingHorizontal: variables.contentPadding,
  },
  tokenImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  tokenContainer: {
    flexDirection: 'row',
    paddingTop: 22,
    justifyContent: 'space-between',
    flex: 1,
  },
  tokenLabels: {
    flexShrink: 1,
    flexDirection: 'column',
  },
  balances: {
    flex: 2,
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  row: {
    flex: 3,
    flexDirection: 'row',
  },
  tokenName: {
    flexShrink: 1,
    ...fontStyles.large600,
  },
  subtext: {
    flexShrink: 1,
    ...fontStyles.small,
    color: Colors.gray4,
  },
  tokenAmt: {
    ...fontStyles.large600,
  },
  lastDayText: {
    ...fontStyles.small500,
    color: Colors.gray4,
    marginHorizontal: Spacing.Regular16,
  },
  lastDayLabel: {
    marginTop: Spacing.Regular16,
    flexDirection: 'row-reverse',
  },
})

export default TokenBalancesScreen

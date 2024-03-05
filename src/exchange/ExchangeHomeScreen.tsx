import BigNumber from 'bignumber.js'
import React, { useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CeloExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Touchable from 'src/components/Touchable'
import CeloGoldHistoryChart from 'src/exchange/CeloGoldHistoryChart'
import CeloNewsFeed from 'src/exchange/CeloNewsFeed'
import { exchangeHistorySelector } from 'src/exchange/reducer'
import InfoIcon from 'src/icons/InfoIcon'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { convertDollarsToLocalAmount } from 'src/localCurrency/convert'
import { getLocalCurrencyCode, usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import PriceHistoryChart from 'src/priceHistory/PriceHistoryChart'
import { useSelector } from 'src/redux/hooks'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { tokensBySymbolSelector } from 'src/tokens/selectors'
import { getLocalCurrencyDisplayValue } from 'src/utils/formatting'
import networkConfig from 'src/web3/networkConfig'

function navigateToGuide() {
  ValoraAnalytics.track(CeloExchangeEvents.celo_home_info)
  navigate(Screens.GoldEducation)
}

function ExchangeHomeScreen() {
  function dollarsToLocal(amount: BigNumber.Value) {
    return convertDollarsToLocalAmount(amount, localCurrencyCode ? localExchangeRate : 1)
  }

  function displayLocalCurrency(amount: BigNumber.Value) {
    return getLocalCurrencyDisplayValue(amount, localCurrencyCode || LocalCurrencyCode.USD, true)
  }

  const scrollPosition = useRef(new Animated.Value(0)).current
  const onScroll = Animated.event([
    {
      nativeEvent: {
        contentOffset: {
          y: scrollPosition,
        },
      },
    },
  ])
  const headerOpacity = useMemo(
    () => ({
      opacity: scrollPosition.interpolate({
        inputRange: [0, 100],
        outputRange: [0, 1],
        extrapolate: Animated.Extrapolate.CLAMP,
      }),
    }),
    []
  )

  const { t } = useTranslation()

  const tokensBySymbol = useSelector(tokensBySymbolSelector)
  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const localExchangeRate = useSelector(usdToLocalCurrencyRateSelector)
  const exchangeHistory = useSelector(exchangeHistorySelector)
  const usePriceHistoryFromBlockchainApi = getFeatureGate(
    StatsigFeatureGates.USE_PRICE_HISTORY_FROM_BLOCKCHAIN_API
  )

  const exchangeHistoryLength = exchangeHistory.aggregatedExchangeRates.length
  const lastKnownPriceUsd =
    tokensBySymbol.CGLD?.lastKnownPriceUsd ||
    (exchangeHistoryLength &&
      exchangeHistory.aggregatedExchangeRates[exchangeHistoryLength - 1].exchangeRate) ||
    new BigNumber(0)

  const currentGoldRateInLocalCurrency = dollarsToLocal(lastKnownPriceUsd)
  let rateChangeInPercentage, rateWentUp

  if (exchangeHistoryLength) {
    const oldestGoldRateInLocalCurrency = dollarsToLocal(
      exchangeHistory.aggregatedExchangeRates[0].exchangeRate
    )
    if (oldestGoldRateInLocalCurrency) {
      const rateChange = currentGoldRateInLocalCurrency?.minus(oldestGoldRateInLocalCurrency)
      rateChangeInPercentage = currentGoldRateInLocalCurrency
        ?.div(oldestGoldRateInLocalCurrency)
        .minus(1)
        .multipliedBy(100)

      rateWentUp = rateChange?.gt(0)
    }
  }

  return (
    <SafeAreaView testID="ExchangeHomeScreen" style={styles.background} edges={['top']}>
      <DrawerTopBar
        scrollPosition={scrollPosition}
        middleElement={
          <Animated.View testID="Header" style={[styles.header, headerOpacity]}>
            {currentGoldRateInLocalCurrency && (
              <Text testID="CeloPriceInLocalCurrency" style={styles.goldPriceCurrentValueHeader}>
                {getLocalCurrencyDisplayValue(
                  currentGoldRateInLocalCurrency,
                  LocalCurrencyCode.USD,
                  true
                )}
              </Text>
            )}
            {rateChangeInPercentage && (
              <Text
                testID="CeloPriceChange"
                style={rateWentUp ? styles.goldPriceWentUpHeader : styles.goldPriceWentDownHeader}
              >
                {rateWentUp ? '▴' : '▾'} {rateChangeInPercentage.toFormat(2)}%
              </Text>
            )}
          </Animated.View>
        }
      />
      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={onScroll}
        // style={styles.background}
        testID="ExchangeScrollView"
        stickyHeaderIndices={[]}
        contentContainerStyle={styles.contentContainer}
      >
        <SafeAreaView style={styles.background} edges={['bottom']}>
          <DisconnectBanner />
          <View style={styles.goldPrice}>
            <View style={styles.goldPriceTitleArea}>
              <Text style={styles.goldPriceTitle}>{t('goldPrice')}</Text>
              <Touchable onPress={navigateToGuide} hitSlop={variables.iconHitslop}>
                <InfoIcon testID="ExchangeHomeScreen/Info" size={14} />
              </Touchable>
            </View>
            <View style={styles.goldPriceValues}>
              <Text style={styles.goldPriceCurrentValue}>
                {currentGoldRateInLocalCurrency
                  ? displayLocalCurrency(currentGoldRateInLocalCurrency)
                  : '-'}
              </Text>

              {rateChangeInPercentage && (
                <Text style={rateWentUp ? styles.goldPriceWentUp : styles.goldPriceWentDown}>
                  {rateWentUp ? '▴' : '▾'} {rateChangeInPercentage.toFormat(2)}%
                </Text>
              )}
            </View>
          </View>

          {usePriceHistoryFromBlockchainApi && networkConfig.celoTokenId ? (
            <PriceHistoryChart
              tokenId={networkConfig.celoTokenId}
              testID={`CeloNews/Chart/${networkConfig.celoTokenId}`}
              chartPadding={Spacing.Thick24}
              color={colors.goldBrand}
              containerStyle={styles.chartContainer}
            />
          ) : (
            <CeloGoldHistoryChart testID="PriceChart" />
          )}
          <CeloNewsFeed />
        </SafeAreaView>
      </Animated.ScrollView>
    </SafeAreaView>
  )
}

export default ExchangeHomeScreen

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    paddingBottom: variables.contentPadding,
  },
  chartContainer: {
    marginBottom: Spacing.Thick24,
  },
  header: {
    alignItems: 'center',
  },
  background: {
    flex: 1,
    justifyContent: 'space-between',
  },
  goldPrice: {
    padding: variables.contentPadding,
  },
  goldPriceTitleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  goldPriceTitle: {
    ...fontStyles.h2,
    marginRight: 8,
  },
  goldPriceValues: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  goldPriceCurrentValue: {
    minHeight: 27,
    ...fontStyles.mediumNumber,
  },
  goldPriceCurrentValueHeader: {
    ...fontStyles.regular500,
  },
  goldPriceWentUp: {
    ...fontStyles.regular,
    color: colors.primary,
  },
  goldPriceWentDown: {
    ...fontStyles.regular,
    marginLeft: 4,
    color: colors.error,
  },
  goldPriceWentUpHeader: {
    ...fontStyles.small600,
    color: colors.primary,
  },
  goldPriceWentDownHeader: {
    ...fontStyles.small600,
    color: colors.error,
  },
})

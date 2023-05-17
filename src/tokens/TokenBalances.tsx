import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, LayoutChangeEvent, PixelRatio, StyleSheet, Text, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { showPriceChangeIndicatorInBalancesSelector } from 'src/app/selectors'
import PercentageIndicator from 'src/components/PercentageIndicator'
import { AssetsTokenBalance } from 'src/components/TokenBalance'
import TokenDisplay from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import { TIME_OF_SUPPORTED_UNSYNC_HISTORICAL_PRICES } from 'src/config'
import OpenLinkIcon from 'src/icons/OpenLinkIcon'
import { useDollarsToLocalAmount } from 'src/localCurrency/hooks'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { HeaderTitleWithSubtitle, headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { positionsSelector, totalPositionsBalanceUsdSelector } from 'src/positions/selectors'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import SegmentedControl from 'src/tokens/SegmentedControl'
import {
  stalePriceSelector,
  tokensWithTokenBalanceSelector,
  totalTokenBalanceSelector,
  visualizeNFTsEnabledInHomeAssetsPageSelector,
} from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { sortByUsdBalance } from 'src/tokens/utils'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'
import networkConfig from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'

type Props = NativeStackScreenProps<StackParamList, Screens.TokenBalances>

enum ViewType {
  WalletAssets = 0,
  Positions = 1,
}

function TokenBalancesScreen({ navigation }: Props) {
  const { t } = useTranslation()
  const tokens = useSelector(tokensWithTokenBalanceSelector)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const totalTokenBalanceLocal = useSelector(totalTokenBalanceSelector) ?? new BigNumber(0)
  const tokensAreStale = useSelector(stalePriceSelector)
  const showPriceChangeIndicatorInBalances = useSelector(showPriceChangeIndicatorInBalancesSelector)
  const shouldVisualizeNFTsInHomeAssetsPage = useSelector(
    visualizeNFTsEnabledInHomeAssetsPageSelector
  )
  const walletAddress = useSelector(walletAddressSelector)
  const insets = useSafeAreaInsets()

  const positions = useSelector(positionsSelector)
  const showPostions = getFeatureGate(StatsigFeatureGates.SHOW_POSITIONS)

  const totalPositionsBalanceUsd = useSelector(totalPositionsBalanceUsdSelector)
  const totalPositionsBalanceLocal = useDollarsToLocalAmount(totalPositionsBalanceUsd)
  const totalBalanceLocal = totalTokenBalanceLocal?.plus(totalPositionsBalanceLocal ?? 0)

  const [activeView, setActiveView] = useState<ViewType>(ViewType.WalletAssets)
  const [assetsComponentHeight, setAssetsComponentHeight] = useState(0)

  const scrollPosition = useRef(new Animated.Value(0)).current
  const handleScroll = Animated.event([
    {
      nativeEvent: {
        contentOffset: {
          y: scrollPosition,
        },
      },
    },
  ])

  const animatedScreenHeaderStyles = useMemo(
    () => ({
      opacity: scrollPosition.interpolate({
        // start animating the screen header opacity 24pt before the assets
        // component is fully scrolled out of view.
        inputRange: [assetsComponentHeight - 24, assetsComponentHeight],
        outputRange: [0, 1],
        extrapolate: Animated.Extrapolate.CLAMP,
      }),
    }),
    [assetsComponentHeight]
  )

  const animatedListHeaderStyles = useMemo(
    () => ({
      transform: [
        {
          translateY: scrollPosition.interpolate({
            inputRange: [0, assetsComponentHeight],
            outputRange: [0, -assetsComponentHeight],
            extrapolate: Animated.Extrapolate.CLAMP,
          }),
        },
      ],
    }),
    [assetsComponentHeight]
  )

  useLayoutEffect(() => {
    const subTitle =
      !tokensAreStale && totalBalanceLocal.gte(0)
        ? t('totalBalanceWithLocalCurrencySymbol', {
            localCurrencySymbol,
            totalBalance: totalBalanceLocal.toFormat(2),
          })
        : `${localCurrencySymbol} -`

    navigation.setOptions({
      headerTitle: () => (
        <Animated.View style={animatedScreenHeaderStyles}>
          <HeaderTitleWithSubtitle title={t('totalAssets')} subTitle={subTitle} />
        </Animated.View>
      ),
    })
  }, [navigation, totalBalanceLocal, localCurrencySymbol, animatedScreenHeaderStyles])

  function isHistoricalPriceUpdated(token: TokenBalance) {
    return (
      token.historicalUsdPrices?.lastDay &&
      TIME_OF_SUPPORTED_UNSYNC_HISTORICAL_PRICES >
        Math.abs(token.historicalUsdPrices.lastDay.at - (Date.now() - ONE_DAY_IN_MILLIS))
    )
  }

  function renderTokenBalance({ item: token }: { item: TokenBalance }) {
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
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
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

  const onPressNFTsBanner = () => {
    ValoraAnalytics.track(HomeEvents.view_nft_home_assets)
    navigate(Screens.WebViewScreen, {
      uri: `${networkConfig.nftsValoraAppUrl}?address=${walletAddress}&hide-header=true`,
    })
  }

  const handleMeasureHeaderHeight = (event: LayoutChangeEvent) => {
    setAssetsComponentHeight(event.nativeEvent.layout.height)
  }

  const segmentedControlValues = useMemo(
    () => [t('assetsSegmentedControl.walletAssets'), t('assetsSegmentedControl.dappPositions')],
    [t]
  )

  const renderListHeader = () => (
    <Animated.View style={[styles.listHeaderContainer, animatedListHeaderStyles]}>
      <View style={styles.assetBalanceContainer} onLayout={handleMeasureHeaderHeight}>
        <AssetsTokenBalance />
      </View>
      {showPostions && positions.length > 0 && (
        <View style={styles.segmentedControlContainer}>
          <SegmentedControl
            values={segmentedControlValues}
            selectedIndex={activeView === ViewType.WalletAssets ? 0 : 1}
            onChange={(_, index) => {
              setActiveView(index)
            }}
          />
        </View>
      )}
    </Animated.View>
  )

  return (
    <>
      {shouldVisualizeNFTsInHomeAssetsPage && (
        <Touchable
          style={
            // For larger fonts we need different marginTop for nft banner
            PixelRatio.getFontScale() > 1.5
              ? { marginTop: Spacing.Small12 }
              : PixelRatio.getFontScale() > 1.25
              ? { marginTop: Spacing.Smallest8 }
              : null
          }
          testID={'NftViewerBanner'}
          onPress={onPressNFTsBanner}
        >
          <View style={styles.bannerContainer}>
            <Text style={styles.bannerText}>{t('nftViewer')}</Text>
            <View style={styles.rightInnerContainer}>
              <Text style={styles.bannerText}>{t('open')}</Text>
              <OpenLinkIcon color={Colors.greenUI} />
            </View>
          </View>
        </Touchable>
      )}
      {!shouldVisualizeNFTsInHomeAssetsPage && showPriceChangeIndicatorInBalances && (
        <View style={styles.lastDayLabel}>
          <Text style={styles.lastDayText}>{t('lastDay')}</Text>
        </View>
      )}

      <Animated.FlatList
        style={styles.flatListContainer}
        contentContainerStyle={{
          paddingBottom: insets.bottom,
        }}
        // Workaround iOS setting an incorrect automatic inset at the top
        scrollIndicatorInsets={{ top: 0.01 }}
        data={tokens.sort(sortByUsdBalance)}
        renderItem={renderTokenBalance}
        keyExtractor={(item) => item.address}
        onScroll={handleScroll}
        ListHeaderComponent={renderListHeader}
        stickyHeaderIndices={[0]}
      />
    </>
  )
}

TokenBalancesScreen.navigationOptions = {
  ...headerWithBackButton,
}

const styles = StyleSheet.create({
  tokenImg: {
    width: 32,
    height: 32,
    borderRadius: 20,
    marginRight: Spacing.Regular16,
  },
  tokenContainer: {
    flexDirection: 'row',
    paddingBottom: Spacing.Large32,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenLabels: {
    flexShrink: 1,
    flexDirection: 'column',
  },
  balances: {
    flex: 1,
    alignItems: 'flex-end',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  flatListContainer: {
    paddingHorizontal: Spacing.Thick24,
  },
  tokenName: {
    ...fontStyles.large600,
  },
  subtext: {
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
  bannerContainer: {
    marginTop: Spacing.Smallest8,
    paddingHorizontal: Spacing.Thick24,
    paddingVertical: 4,
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    width: '100%',
    alignItems: 'center',
    backgroundColor: Colors.gray1,
    flexDirection: 'row',
  },
  bannerText: {
    ...fontStyles.small500,
    color: Colors.greenUI,
    marginRight: 4,
  },
  rightInnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listHeaderContainer: {
    paddingBottom: Spacing.Thick24,
  },
  assetBalanceContainer: {
    paddingTop: Spacing.Thick24,
  },
  segmentedControlContainer: {
    backgroundColor: Colors.light,
    paddingTop: Spacing.Thick24,
  },
})

export default TokenBalancesScreen

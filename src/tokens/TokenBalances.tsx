import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useLayoutEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, PixelRatio, StyleSheet, Text, View } from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { showPriceChangeIndicatorInBalancesSelector } from 'src/app/selectors'
import { AssetsTokenBalance } from 'src/components/TokenBalance'
import Touchable from 'src/components/Touchable'
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
import { getShadowStyle, Shadow, Spacing } from 'src/styles/styles'
import SegmentedControl from 'src/tokens/SegmentedControl'
import {
  stalePriceSelector,
  tokensWithTokenBalanceSelector,
  totalTokenBalanceSelector,
  visualizeNFTsEnabledInHomeAssetsPageSelector,
} from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import TokenBalanceItem from 'src/tokens/TokenBalanceItem'
import { sortByUsdBalance } from 'src/tokens/utils'
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
  const showPositions = getFeatureGate(StatsigFeatureGates.SHOW_POSITIONS)
  const displayPositions = showPositions && positions.length > 0

  const totalPositionsBalanceUsd = useSelector(totalPositionsBalanceUsdSelector)
  const totalPositionsBalanceLocal = useDollarsToLocalAmount(totalPositionsBalanceUsd)
  const totalBalanceLocal = totalTokenBalanceLocal?.plus(totalPositionsBalanceLocal ?? 0)

  const [activeView, setActiveView] = useState<ViewType>(ViewType.WalletAssets)
  const [nonStickyHeaderHeight, setNonStickyHeaderHeight] = useState(0)

  const scrollPosition = useSharedValue(0)
  const handleScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollPosition.value = event.contentOffset.y
    },
  })

  const animatedHeaderOpacity = useDerivedValue(() => {
    if (nonStickyHeaderHeight === 0) {
      // initial render
      return 0
    }

    const startAnimationPosition = nonStickyHeaderHeight - 44
    const endAnimationPosition = nonStickyHeaderHeight - 20
    const totalAnimationDistance = endAnimationPosition - startAnimationPosition
    const animatedValue = (scrollPosition.value - startAnimationPosition) / totalAnimationDistance

    // return only values between 0 and 1
    return Math.max(0, Math.min(1, animatedValue))
  }, [scrollPosition.value, nonStickyHeaderHeight])

  const animatedScreenHeaderStyles = useAnimatedStyle(() => {
    return {
      opacity: animatedHeaderOpacity.value,
    }
  }, [animatedHeaderOpacity.value])

  const animatedListHeaderStyles = useAnimatedStyle(() => {
    if (nonStickyHeaderHeight === 0 || !displayPositions) {
      return {
        shadowColor: 'transparent',
      }
    }

    return {
      transform: [
        {
          translateY:
            scrollPosition.value > nonStickyHeaderHeight
              ? -nonStickyHeaderHeight
              : -Math.max(scrollPosition.value, 0),
        },
      ],
      shadowColor: interpolateColor(
        scrollPosition.value,
        [nonStickyHeaderHeight - 10, nonStickyHeaderHeight + 10],
        ['transparent', 'rgba(48, 46, 37, 0.15)']
      ),
    }
  }, [scrollPosition.value, nonStickyHeaderHeight, displayPositions])

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

  function renderTokenBalance({ item: token }: { item: TokenBalance }) {
    return (
      <TokenBalanceItem
        token={token}
        showPriceChangeIndicatorInBalances={showPriceChangeIndicatorInBalances}
      />
    )
  }

  const onPressNFTsBanner = () => {
    ValoraAnalytics.track(HomeEvents.view_nft_home_assets)
    navigate(Screens.WebViewScreen, {
      uri: `${networkConfig.nftsValoraAppUrl}?address=${walletAddress}&hide-header=true`,
    })
  }

  const handleMeasureNonStickyHeaderHeight = (event: LayoutChangeEvent) => {
    setNonStickyHeaderHeight(event.nativeEvent.layout.height)
  }

  const segmentedControlValues = useMemo(
    () => [t('assetsSegmentedControl.walletAssets'), t('assetsSegmentedControl.dappPositions')],
    [t]
  )

  const renderListHeader = () => (
    <Animated.View style={[styles.listHeaderContainer, animatedListHeaderStyles]}>
      <View
        style={[
          styles.nonStickyHeaderContainer,
          {
            paddingBottom: displayPositions ? Spacing.Thick24 : 0,
          },
        ]}
        onLayout={handleMeasureNonStickyHeaderHeight}
      >
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
            <View style={styles.nftBannerContainer}>
              <Text style={styles.nftBannerText}>{t('nftViewer')}</Text>
              <View style={styles.nftBannerCtaContainer}>
                <Text style={styles.nftBannerText}>{t('open')}</Text>
                <OpenLinkIcon color={Colors.greenUI} />
              </View>
            </View>
          </Touchable>
        )}
        <AssetsTokenBalance showInfo={displayPositions} />
      </View>
      {displayPositions && (
        <SegmentedControl
          values={segmentedControlValues}
          selectedIndex={activeView === ViewType.WalletAssets ? 0 : 1}
          onChange={(_, index) => {
            setActiveView(index)
          }}
        />
      )}
    </Animated.View>
  )

  return (
    <Animated.FlatList
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
      stickyHeaderIndices={displayPositions ? [0] : undefined}
    />
  )
}

TokenBalancesScreen.navigationOptions = {
  ...headerWithBackButton,
}

const styles = StyleSheet.create({
  nftBannerContainer: {
    marginHorizontal: -Spacing.Thick24,
    marginBottom: Spacing.Thick24,
    paddingHorizontal: Spacing.Thick24,
    paddingVertical: 4,
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    alignItems: 'center',
    backgroundColor: Colors.gray1,
    flexDirection: 'row',
  },
  nftBannerText: {
    ...fontStyles.small500,
    color: Colors.greenUI,
    marginRight: 4,
  },
  nftBannerCtaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listHeaderContainer: {
    ...getShadowStyle(Shadow.SoftLight),
    padding: Spacing.Thick24,
    paddingTop: Spacing.Smallest8,
    backgroundColor: Colors.light,
  },
  nonStickyHeaderContainer: {
    zIndex: 1, // above siblings to enable overflow of absolutely positioned tooltip
  },
})

export default TokenBalancesScreen

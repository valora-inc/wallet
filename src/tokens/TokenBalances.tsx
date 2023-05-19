import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, PixelRatio, StyleSheet, Text, View } from 'react-native'
import Animated from 'react-native-reanimated'
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
import { Spacing } from 'src/styles/styles'
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
  const showPostions = getFeatureGate(StatsigFeatureGates.SHOW_POSITIONS)

  const totalPositionsBalanceUsd = useSelector(totalPositionsBalanceUsdSelector)
  const totalPositionsBalanceLocal = useDollarsToLocalAmount(totalPositionsBalanceUsd)
  const totalBalanceLocal = totalTokenBalanceLocal?.plus(totalPositionsBalanceLocal ?? 0)

  const [activeView, setActiveView] = useState<ViewType>(ViewType.WalletAssets)
  const [nonStickyHeaderHeight, setNonStickyHeaderHeight] = useState(0)

  const scrollPosition = useRef<Animated.Value<number>>(new Animated.Value(0)).current
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
        inputRange: [nonStickyHeaderHeight - 24, nonStickyHeaderHeight],
        outputRange: [0, 1],
        extrapolate: Animated.Extrapolate.CLAMP,
      }),
    }),
    [nonStickyHeaderHeight]
  )

  const animatedListHeaderStyles = useMemo(
    () => ({
      transform: [
        {
          translateY: scrollPosition.interpolate({
            inputRange: [0, nonStickyHeaderHeight],
            outputRange: [0, -nonStickyHeaderHeight],
            extrapolate: Animated.Extrapolate.CLAMP,
          }),
        },
      ],
    }),
    [nonStickyHeaderHeight]
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
      <View style={styles.nonStickyHeaderContainer} onLayout={handleMeasureNonStickyHeaderHeight}>
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
  )
}

TokenBalancesScreen.navigationOptions = {
  ...headerWithBackButton,
}

const styles = StyleSheet.create({
  flatListContainer: {
    paddingHorizontal: Spacing.Thick24,
  },
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
    marginHorizontal: -Spacing.Thick24,
    padding: Spacing.Thick24,
    paddingTop: Spacing.Smallest8,
    backgroundColor: Colors.light,
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    shadowOpacity: 1,
  },
  nonStickyHeaderContainer: {
    // note that this 20pt paddingBottom is combined with the marginTop of
    // segmentedControlContainer to create 24pt spacing between components,
    // with a 4pt marginTop on the segmented control when sticky
    paddingBottom: 20,
  },
  segmentedControlContainer: {
    backgroundColor: Colors.light,
    marginTop: 4,
  },
})

export default TokenBalancesScreen

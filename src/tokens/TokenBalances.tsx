import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useLayoutEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LayoutChangeEvent,
  PixelRatio,
  SectionList,
  SectionListData,
  SectionListProps,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import { AssetsEvents, HomeEvents } from 'src/analytics/Events'
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
import { Position } from 'src/positions/types'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { getShadowStyle, Shadow, Spacing } from 'src/styles/styles'
import { PositionItem, TokenBalanceItem } from 'src/tokens/AssetItem'
import SegmentedControl from 'src/tokens/SegmentedControl'
import {
  stalePriceSelector,
  tokensWithTokenBalanceSelector,
  totalTokenBalanceSelector,
  visualizeNFTsEnabledInHomeAssetsPageSelector,
} from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { sortByUsdBalance } from 'src/tokens/utils'
import networkConfig from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'

type Props = NativeStackScreenProps<StackParamList, Screens.TokenBalances>
interface SectionData {
  appName?: string
}

const AnimatedSectionList =
  Animated.createAnimatedComponent<SectionListProps<TokenBalance | Position, SectionData>>(
    SectionList
  )

const assetIsPosition = (asset: Position | TokenBalance): asset is Position =>
  'type' in asset && (asset.type === 'app-token' || asset.type === 'contract-position')

export enum AssetViewType {
  WalletAssets = 0,
  Positions = 1,
}

// offset relative to the bottom of the non sticky header component, where the
// screen header opacity animation starts
const HEADER_OPACITY_ANIMATION_START_OFFSET = 44
// distance in points over which the screen header opacity animation is applied
const HEADER_OPACITY_ANIMATION_DISTANCE = 20

function TokenBalancesScreen({ navigation, route }: Props) {
  const { t } = useTranslation()

  const activeView = route.params?.activeView ?? AssetViewType.WalletAssets

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

  const [nonStickyHeaderHeight, setNonStickyHeaderHeight] = useState(0)
  const [listHeaderHeight, setListHeaderHeight] = useState(0)

  const scrollPosition = useSharedValue(0)
  const handleScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollPosition.value = event.contentOffset.y
    },
  })

  const animatedScreenHeaderOpacity = useDerivedValue(() => {
    if (nonStickyHeaderHeight === 0) {
      // initial render
      return 0
    }

    const startAnimationPosition = nonStickyHeaderHeight - HEADER_OPACITY_ANIMATION_START_OFFSET
    const animatedValue =
      (scrollPosition.value - startAnimationPosition) / HEADER_OPACITY_ANIMATION_DISTANCE

    // return only values between 0 and 1
    return Math.max(0, Math.min(1, animatedValue))
  }, [scrollPosition.value, nonStickyHeaderHeight])

  const animatedScreenHeaderStyles = useAnimatedStyle(() => {
    return {
      opacity: animatedScreenHeaderOpacity.value,
    }
  }, [animatedScreenHeaderOpacity.value])

  const animatedListHeaderStyles = useAnimatedStyle(() => {
    if (nonStickyHeaderHeight === 0 || !displayPositions) {
      return {
        shadowColor: 'transparent',
        transform: [
          {
            translateY: -scrollPosition.value,
          },
        ],
      }
    }

    return {
      transform: [
        {
          translateY:
            scrollPosition.value > nonStickyHeaderHeight
              ? -nonStickyHeaderHeight
              : -scrollPosition.value,
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

  const onPressNFTsBanner = () => {
    ValoraAnalytics.track(HomeEvents.view_nft_home_assets)
    navigate(Screens.WebViewScreen, {
      uri: `${networkConfig.nftsValoraAppUrl}?address=${walletAddress}&hide-header=true`,
    })
  }

  const handleMeasureNonStickyHeaderHeight = (event: LayoutChangeEvent) => {
    setNonStickyHeaderHeight(event.nativeEvent.layout.height)
  }

  const handleMeasureListHeaderHeight = (event: LayoutChangeEvent) => {
    setListHeaderHeight(event.nativeEvent.layout.height)
  }

  const handleChangeActiveView = (_: string, index: number) => {
    navigation.setParams({ activeView: index })
    ValoraAnalytics.track(
      index === AssetViewType.WalletAssets
        ? AssetsEvents.view_wallet_assets
        : AssetsEvents.view_dapp_positions
    )
  }

  const tokenItems = useMemo(() => tokens.sort(sortByUsdBalance), [tokens])
  const positionSections = useMemo(() => {
    const positionsByDapp = new Map<string, Position[]>()
    positions.forEach((position) => {
      if (positionsByDapp.has(position.appName)) {
        positionsByDapp.get(position.appName)?.push(position)
      } else {
        positionsByDapp.set(position.appName, [position])
      }
    })

    const sections: SectionListData<TokenBalance | Position, SectionData>[] = []
    positionsByDapp.forEach((positions, appName) => {
      sections.push({
        data: positions,
        appName,
      })
    })
    return sections
  }, [positions])

  const sections =
    activeView === AssetViewType.WalletAssets ? [{ data: tokenItems }] : positionSections

  const renderSectionHeader = ({
    section,
  }: {
    section: SectionListData<TokenBalance | Position, SectionData>
  }) => {
    if (section.appName) {
      return (
        <View style={styles.positionSectionHeaderContainer}>
          <Text style={styles.positionSectionHeaderText}>
            {section.appName.toLocaleUpperCase()}
          </Text>
        </View>
      )
    }
    return null
  }

  const renderAssetItem = ({ item }: { item: TokenBalance | Position }) => {
    if (assetIsPosition(item)) {
      return <PositionItem position={item} />
    }
    return (
      <TokenBalanceItem
        token={item}
        showPriceChangeIndicatorInBalances={showPriceChangeIndicatorInBalances}
      />
    )
  }

  const segmentedControlValues = useMemo(
    () => [t('assetsSegmentedControl.walletAssets'), t('assetsSegmentedControl.dappPositions')],
    [t]
  )

  return (
    <>
      <Animated.View
        style={[styles.listHeaderContainer, animatedListHeaderStyles]}
        onLayout={handleMeasureListHeaderHeight}
      >
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
            selectedIndex={activeView === AssetViewType.WalletAssets ? 0 : 1}
            onChange={handleChangeActiveView}
          />
        )}
      </Animated.View>
      <AnimatedSectionList
        contentContainerStyle={{
          paddingBottom: insets.bottom,
          opacity: listHeaderHeight > 0 ? 1 : 0,
        }}
        // ensure header is above the scrollbar on ios overscroll
        scrollIndicatorInsets={{ top: listHeaderHeight }}
        // @ts-ignore can't get the SectionList to accept a union type :(
        sections={sections}
        renderItem={renderAssetItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.address}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={<View style={{ height: listHeaderHeight }} />}
      />
    </>
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
    position: 'absolute',
    width: '100%',
    zIndex: 1,
  },
  positionSectionHeaderContainer: {
    padding: Spacing.Thick24,
    paddingTop: Spacing.Regular16,
  },
  positionSectionHeaderText: {
    ...fontStyles.xsmall600,
    color: Colors.gray5,
  },
  nonStickyHeaderContainer: {
    zIndex: 1,
  },
})

export default TokenBalancesScreen

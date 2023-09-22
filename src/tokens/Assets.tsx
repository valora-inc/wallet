import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LayoutChangeEvent,
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
  useSharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import { AssetsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { AssetsTokenBalance } from 'src/components/TokenBalance'
import Touchable from 'src/components/Touchable'
import { useDollarsToLocalAmount } from 'src/localCurrency/hooks'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import useScrollAwareHeader from 'src/navigator/ScrollAwareHeader'
import { StackParamList } from 'src/navigator/types'
import {
  positionsSelector,
  positionsWithClaimableRewardsSelector,
  totalPositionsBalanceUsdSelector,
} from 'src/positions/selectors'
import { Position } from 'src/positions/types'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { vibrateInformative } from 'src/styles/hapticFeedback'
import { Shadow, Spacing, getShadowStyle } from 'src/styles/styles'
import { width } from 'src/styles/variables'
import { PositionItem, TokenBalanceItem } from 'src/tokens/AssetItem'
import {
  stalePriceSelector,
  tokensWithTokenBalanceSelector,
  totalTokenBalanceSelector,
} from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { sortByUsdBalance } from 'src/tokens/utils'

const DEVICE_WIDTH_BREAKPOINT = 340

type Props = NativeStackScreenProps<StackParamList, Screens.Assets>
interface SectionData {
  appName?: string
}

const AnimatedSectionList = Animated.createAnimatedComponent<
  SectionListProps<TokenBalance | Position, SectionData>
>(SectionList<TokenBalance | Position, SectionData>)

const assetIsPosition = (asset: Position | TokenBalance): asset is Position =>
  'type' in asset && (asset.type === 'app-token' || asset.type === 'contract-position')

export enum AssetTabType {
  Assets = 0,
  Collectibles = 1,
  Positions = 2,
}

// offset relative to the bottom of the non sticky header component, where the
// screen header opacity animation starts
const HEADER_OPACITY_ANIMATION_START_OFFSET = 44
// distance in points over which the screen header opacity animation is applied
const HEADER_OPACITY_ANIMATION_DISTANCE = 20

function AssetsScreen({ navigation, route }: Props) {
  const { t } = useTranslation()

  const activeTab = route.params?.activeTab ?? AssetTabType.Assets

  const tokens = useSelector(tokensWithTokenBalanceSelector)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const totalTokenBalanceLocal = useSelector(totalTokenBalanceSelector) ?? new BigNumber(0)
  const tokensAreStale = useSelector(stalePriceSelector)
  const insets = useSafeAreaInsets()

  const positions = useSelector(positionsSelector)
  const showPositions = getFeatureGate(StatsigFeatureGates.SHOW_POSITIONS)
  const displayPositions = showPositions && positions.length > 0

  const dappShortcutsEnabled = getFeatureGate(StatsigFeatureGates.SHOW_CLAIM_SHORTCUTS)
  const positionsWithClaimableRewards = useSelector(positionsWithClaimableRewardsSelector)
  const showClaimRewards =
    dappShortcutsEnabled &&
    positionsWithClaimableRewards.length > 0 &&
    activeTab !== AssetTabType.Collectibles

  const totalPositionsBalanceUsd = useSelector(totalPositionsBalanceUsdSelector)
  const totalPositionsBalanceLocal = useDollarsToLocalAmount(totalPositionsBalanceUsd)
  const totalBalanceLocal = totalTokenBalanceLocal?.plus(totalPositionsBalanceLocal ?? 0)

  const [nonStickyHeaderHeight, setNonStickyHeaderHeight] = useState(0)
  const [listHeaderHeight, setListHeaderHeight] = useState(0)
  const [listFooterHeight, setListFooterHeight] = useState(0)

  const scrollPosition = useSharedValue(0)
  const footerPosition = useSharedValue(0)
  const handleScroll = useAnimatedScrollHandler<{ prevScrollY: number }>(
    {
      onScroll: (event, ctx) => {
        const scrollY = event.contentOffset.y
        scrollPosition.value = scrollY

        function clamp(value: number, min: number, max: number) {
          return Math.min(Math.max(value, min), max)
        }

        // Omit overscroll in the calculation
        const clampedScrollY = clamp(
          scrollY,
          0,
          event.contentSize.height - event.layoutMeasurement.height
        )

        // This does the same as React Native's Animated.diffClamp
        const diff = clampedScrollY - ctx.prevScrollY
        footerPosition.value = clamp(footerPosition.value + diff, 0, listFooterHeight)
        ctx.prevScrollY = clampedScrollY
      },
      onBeginDrag: (event, ctx) => {
        ctx.prevScrollY = event.contentOffset.y
      },
    },
    [listFooterHeight]
  )

  const animatedListHeaderStyles = useAnimatedStyle(() => {
    if (nonStickyHeaderHeight === 0) {
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
  }, [scrollPosition.value, nonStickyHeaderHeight])

  const animatedFooterStyles = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: footerPosition.value,
        },
      ],
    }
  }, [footerPosition.value])

  useScrollAwareHeader({
    navigation,
    title: t('totalAssets'),
    subtitle:
      !tokensAreStale && totalBalanceLocal.gte(0)
        ? t('totalBalanceWithLocalCurrencySymbol', {
            localCurrencySymbol,
            totalBalance: totalBalanceLocal.toFormat(2),
          })
        : `${localCurrencySymbol} -`,
    scrollPosition,
    startFadeInPosition: nonStickyHeaderHeight - HEADER_OPACITY_ANIMATION_START_OFFSET,
    animationDistance: HEADER_OPACITY_ANIMATION_DISTANCE,
  })

  const handleMeasureNonStickyHeaderHeight = (event: LayoutChangeEvent) => {
    setNonStickyHeaderHeight(event.nativeEvent.layout.height)
  }

  const handleMeasureListHeaderHeight = (event: LayoutChangeEvent) => {
    setListHeaderHeight(event.nativeEvent.layout.height)
  }

  const handleMeasureListFooterHeight = (event: LayoutChangeEvent) => {
    setListFooterHeight(event.nativeEvent.layout.height)
  }

  const handleChangeActiveView = (_: string, index: number) => {
    navigation.setParams({ activeTab: index })
    ValoraAnalytics.track(
      [
        AssetsEvents.view_wallet_assets,
        AssetsEvents.view_collectibles,
        AssetsEvents.view_dapp_positions,
      ][index]
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
    // TODO(ACT-912) replace with new asset component
    return <TokenBalanceItem token={item} showPriceChangeIndicatorInBalances={false} />
  }

  const tabBarItems = useMemo(() => {
    const items = [t('assets.tabBar.assets'), t('assets.tabBar.collectibles')]
    if (displayPositions) {
      items.push(t('assets.tabBar.dappPositions'))
    }
    return items
  }, [t, displayPositions])

  return (
    <>
      <Animated.View
        style={[styles.listHeaderContainer, animatedListHeaderStyles]}
        onLayout={handleMeasureListHeaderHeight}
      >
        <View
          style={[styles.nonStickyHeaderContainer]}
          onLayout={handleMeasureNonStickyHeaderHeight}
        >
          <AssetsTokenBalance showInfo={displayPositions} />
        </View>
        <TabBar items={tabBarItems} selectedIndex={activeTab} onChange={handleChangeActiveView} />
      </Animated.View>
      {activeTab !== AssetTabType.Collectibles && (
        <AnimatedSectionList
          contentContainerStyle={{
            paddingBottom: insets.bottom,
            opacity: listHeaderHeight > 0 ? 1 : 0,
          }}
          // ensure header is above the scrollbar on ios overscroll
          scrollIndicatorInsets={{ top: listHeaderHeight }}
          sections={activeTab === AssetTabType.Assets ? [{ data: tokenItems }] : positionSections}
          renderItem={renderAssetItem}
          renderSectionHeader={renderSectionHeader}
          // TODO(ACT-912): use tokenId once available
          keyExtractor={(item) => item.address}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          ListHeaderComponent={<View style={{ height: listHeaderHeight }} />}
        />
      )}
      {/* TODO(ACT-918): render collectibles */}
      {showClaimRewards && (
        <Animated.View
          style={[
            styles.footerContainer,
            { paddingBottom: Math.max(insets.bottom, Spacing.Regular16) },
            animatedFooterStyles,
          ]}
          onLayout={handleMeasureListFooterHeight}
        >
          <Button
            type={BtnTypes.SECONDARY}
            size={BtnSizes.FULL}
            text={t('assets.claimRewards')}
            onPress={() => {
              ValoraAnalytics.track(AssetsEvents.tap_claim_rewards)
              navigate(Screens.DappShortcutsRewards)
            }}
          />
        </Animated.View>
      )}
    </>
  )
}

AssetsScreen.navigationOptions = {
  ...headerWithBackButton,
}

function TabBar({
  items,
  selectedIndex,
  onChange,
}: {
  items: string[]
  selectedIndex: number
  onChange: (item: string, selectedIndex: number) => void
}) {
  const handleSelectOption = (item: string, index: number) => () => {
    onChange(item, index)
    vibrateInformative()
  }

  // On a smaller device, if there are more than two tabs, use smaller gaps
  // between tabs
  const gap =
    items.length > 2 && width < DEVICE_WIDTH_BREAKPOINT ? Spacing.Smallest8 : Spacing.Regular16

  return (
    <View style={[styles.tabBarContainer, { gap }]} testID="Assets/TabBar">
      {items.map((value, index) => (
        <Touchable
          testID="Assets/TabBarItem"
          key={value}
          onPress={handleSelectOption(value, index)}
          style={{ flexShrink: 1 }}
        >
          <Text
            style={[index === selectedIndex ? styles.tabBarItemSelected : styles.tabBarItem]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {value}
          </Text>
        </Touchable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
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
    ...typeScale.labelXXSmall,
    color: Colors.gray5,
  },
  nonStickyHeaderContainer: {
    zIndex: 1,
    paddingBottom: Spacing.Thick24,
  },
  footerContainer: {
    backgroundColor: Colors.light,
    position: 'absolute',
    bottom: 0,
    left: 10, // so the scroll bar is still visible
    right: 10,
    paddingHorizontal: Spacing.Thick24 - 10,
    paddingTop: Spacing.Regular16,
  },
  tabBarContainer: {
    flexDirection: 'row',
  },
  tabBarItem: {
    ...typeScale.bodyMedium,
    color: Colors.gray4,
  },
  tabBarItemSelected: {
    ...typeScale.labelMedium,
    color: Colors.dark,
  },
})

export default AssetsScreen

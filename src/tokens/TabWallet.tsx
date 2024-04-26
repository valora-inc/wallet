import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, StyleSheet, View } from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { AssetsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { AssetsTokenBalance } from 'src/components/TokenBalance'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import useScrollAwareHeader from 'src/navigator/ScrollAwareHeader'
import { StackParamList } from 'src/navigator/types'
import { positionsSelector, positionsWithClaimableRewardsSelector } from 'src/positions/selectors'
import { useSelector } from 'src/redux/hooks'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import Colors from 'src/styles/colors'
import { Shadow, Spacing, getShadowStyle } from 'src/styles/styles'
import AssetList from 'src/tokens/AssetList'
import AssetTabBar from 'src/tokens/AssetTabBar'
import { AssetTabType } from 'src/tokens/types'

type Props = NativeStackScreenProps<StackParamList, Screens.TabWallet>

// offset relative to the bottom of the non sticky header component, where the
// screen header opacity animation starts
const HEADER_OPACITY_ANIMATION_START_OFFSET = 44
// distance in points over which the screen header opacity animation is applied
const HEADER_OPACITY_ANIMATION_DISTANCE = 20

function TabWallet({ navigation, route }: Props) {
  const { t } = useTranslation()

  const activeTab = route.params?.activeAssetTab ?? AssetTabType.Tokens

  // TODO: Update this to filter out unsupported networks once positions support non-Celo chains
  const positions = useSelector(positionsSelector)
  const showPositions = getFeatureGate(StatsigFeatureGates.SHOW_POSITIONS)
  const displayPositions = showPositions && positions.length > 0

  const dappShortcutsEnabled = getFeatureGate(StatsigFeatureGates.SHOW_CLAIM_SHORTCUTS)
  const positionsWithClaimableRewards = useSelector(positionsWithClaimableRewardsSelector)
  const showClaimRewards =
    dappShortcutsEnabled &&
    positionsWithClaimableRewards.length > 0 &&
    activeTab !== AssetTabType.Collectibles

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
    title: t('bottomTabsNavigator.wallet.title'),
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

  const handleChangeActiveView = (selectedTab: AssetTabType) => {
    navigation.setParams({ activeAssetTab: selectedTab })
  }

  return (
    // Transparency issue on Android present when a fragment is used - Nested Animated.View prevents it
    <Animated.View>
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
        <AssetTabBar
          activeTab={activeTab}
          onChange={handleChangeActiveView}
          displayPositions={displayPositions}
        />
      </Animated.View>

      <AssetList
        activeTab={activeTab}
        listHeaderHeight={listHeaderHeight}
        handleScroll={handleScroll}
      />
      {showClaimRewards && (
        <Animated.View
          style={[styles.footerContainer, animatedFooterStyles]}
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
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  listHeaderContainer: {
    ...getShadowStyle(Shadow.SoftLight),
    paddingBottom: Spacing.Regular16,
    paddingHorizontal: Spacing.Regular16,
    backgroundColor: Colors.white,
    position: 'absolute',
    width: '100%',
    zIndex: 1,
  },
  nonStickyHeaderContainer: {
    zIndex: 1,
    paddingBottom: Spacing.Thick24,
  },
  footerContainer: {
    backgroundColor: Colors.white,
    position: 'absolute',
    bottom: 0,
    left: 10, // so the scroll bar is still visible
    right: 10,
    paddingHorizontal: Spacing.Thick24 - 10,
    paddingVertical: Spacing.Regular16,
  },
})

export default TabWallet

import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, StyleSheet, View } from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AssetsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { AssetsTokenBalance } from 'src/components/TokenBalance'
import { useDollarsToLocalAmount } from 'src/localCurrency/hooks'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import useScrollAwareHeader from 'src/navigator/ScrollAwareHeader'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import {
  positionsSelector,
  positionsWithClaimableRewardsSelector,
  totalPositionsBalanceUsdSelector,
} from 'src/positions/selectors'
import { useSelector } from 'src/redux/hooks'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Shadow, Spacing, getShadowStyle } from 'src/styles/styles'
import AssetList from 'src/tokens/AssetList'
import AssetTabBar from 'src/tokens/AssetTabBar'
import { useTokenPricesAreStale, useTotalTokenBalance } from 'src/tokens/hooks'
import { AssetTabType } from 'src/tokens/types'
import { getSupportedNetworkIdsForTokenBalances } from 'src/tokens/utils'

type Props = NativeStackScreenProps<StackParamList, Screens.Assets | Screens.TabWallet>

// offset relative to the bottom of the non sticky header component, where the
// screen header opacity animation starts
const HEADER_OPACITY_ANIMATION_START_OFFSET = 44
// distance in points over which the screen header opacity animation is applied
const HEADER_OPACITY_ANIMATION_DISTANCE = 20

function AssetsScreen({ navigation, route }: Props) {
  const { t } = useTranslation()

  const activeTab = route.params?.activeTab ?? AssetTabType.Tokens

  const supportedNetworkIds = getSupportedNetworkIdsForTokenBalances()

  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const totalTokenBalanceLocal = useTotalTokenBalance() ?? new BigNumber(0)
  const tokensAreStale = useTokenPricesAreStale(supportedNetworkIds)

  const insets = useSafeAreaInsets()

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

  // TODO(ACT-1095): Update these to filter out unsupported networks once positions support non-Celo chains
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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        getFeatureGate(StatsigFeatureGates.SHOW_IMPORT_TOKENS_FLOW) && (
          <TopBarTextButton
            onPress={() => {
              ValoraAnalytics.track(AssetsEvents.import_token_screen_open)
              navigate(Screens.TokenImport)
            }}
            title={t('assets.importToken')}
            style={styles.topBarTextButton}
          />
        ),
    })
  }, [navigation])

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

  const handleChangeActiveView = (selectedTab: AssetTabType) => {
    navigation.setParams({ activeTab: selectedTab })
  }

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

const styles = StyleSheet.create({
  listHeaderContainer: {
    ...getShadowStyle(Shadow.SoftLight),
    padding: Spacing.Thick24,
    paddingTop: Spacing.Smallest8,
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
    paddingTop: Spacing.Regular16,
  },
  topBarTextButton: {
    ...typeScale.bodyMedium,
    paddingRight: Spacing.Smallest8,
  },
})

export default AssetsScreen

import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import { default as React, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import Animated, {
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import FilterChipsCarousel, {
  FilterChip,
  NetworkFilterChip,
  TokenSelectFilterChip,
  isNetworkChip,
  isTokenSelectChip,
} from 'src/components/FilterChipsCarousel'
import TokenBottomSheet, { TokenPickerOrigin } from 'src/components/TokenBottomSheet'
import NetworkMultiSelectBottomSheet from 'src/components/multiSelect/NetworkMultiSelectBottomSheet'
import EarnTabBar from 'src/earn/EarnTabBar'
import PoolList from 'src/earn/PoolList'
import { EarnTabType } from 'src/earn/types'
import { Screens } from 'src/navigator/Screens'
import useScrollAwareHeader from 'src/navigator/ScrollAwareHeader'
import { StackParamList } from 'src/navigator/types'
import { earnPositionsSelector } from 'src/positions/selectors'
import { useSelector } from 'src/redux/hooks'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Shadow, Spacing, getShadowStyle } from 'src/styles/styles'
import { tokensByIdSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { NetworkId } from 'src/transactions/types'

const HEADER_OPACITY_ANIMATION_START_OFFSET = 44
const HEADER_OPACITY_ANIMATION_DISTANCE = 20

type Props = NativeStackScreenProps<StackParamList, Screens.EarnHome>

function useFilterChips(): FilterChip<TokenBalance>[] {
  const { t } = useTranslation()

  const pools = useSelector(earnPositionsSelector)
  const supportedNetworkIds = [...new Set(pools.map((pool) => pool.networkId))]
  const tokens = [...new Set(pools.flatMap((pool) => pool.tokens))]
  const networkChipConfig: NetworkFilterChip<TokenBalance> = {
    id: 'network-ids',
    name: t('tokenBottomSheet.filters.selectNetwork'),
    filterFn: (token: TokenBalance, selected?: NetworkId[]) => {
      return !!selected && selected.includes(token.networkId)
    },
    isSelected: false,
    allNetworkIds: supportedNetworkIds,
    selectedNetworkIds: supportedNetworkIds,
  }

  const tokensChipConfig: TokenSelectFilterChip<TokenBalance> = {
    id: 'token-select',
    name: t('tokenBottomSheet.filters.tokens'),
    filterFn: (token: TokenBalance, tokenId: string) => token.tokenId === tokenId,
    selectedTokenId: tokens[0].tokenId,
    isSelected: false,
  }

  return [networkChipConfig, tokensChipConfig]
}

export default function EarnHome({ navigation, route }: Props) {
  const { t } = useTranslation()
  const filterChipsCarouselRef = useRef<ScrollView>(null)
  const pools = useSelector(earnPositionsSelector)

  const activeTab = route.params?.activeEarnTab ?? EarnTabType.OpenPools

  const insets = useSafeAreaInsets()

  const supportedNetworkIds = [...new Set(pools.map((pool) => pool.networkId))]
  const allTokens = useSelector((state) => tokensByIdSelector(state, supportedNetworkIds))

  // Scroll Aware Header
  const scrollPosition = useSharedValue(0)
  const [listHeaderHeight, setListHeaderHeight] = useState(0)
  const [nonStickyHeaderHeight, setNonStickyHeaderHeight] = useState(0)

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

  const networkChipRef = useRef<BottomSheetRefType>(null)
  const tokenBottomSheetRef = useRef<BottomSheetRefType>(null)
  const learnMoreBottomSheetRef = useRef<BottomSheetRefType>(null)

  // The NetworkMultiSelectBottomSheet and TokenBottomSheet must be rendered at this level in order to be in
  // front of the bottom tabs navigator when they render. So, we need to manage the state of the filters here and pass them down
  // This is not ideal, and we should be wary of how this affects the performance of the home tabs since it renders
  // on all of them, not just the Earn tab.
  const chips = useFilterChips()
  const [filters, setFilters] = useState(chips)
  const activeFilters = useMemo(() => filters.filter((filter) => filter.isSelected), [filters])
  const networkChip = useMemo(
    () => filters.find((chip): chip is NetworkFilterChip<TokenBalance> => isNetworkChip(chip)),
    [filters]
  )
  const tokens = [...new Set(pools.flatMap((pool) => pool.tokens))]

  const tokensInfo = useMemo(() => {
    return tokens
      .map((token) => allTokens[token.tokenId])
      .filter((token): token is TokenBalance => !!token)
  }, [allTokens])

  const tokenList = useMemo(() => {
    return tokensInfo.filter((token) => {
      // Exclude the token if it does not match the active filters
      if (
        !activeFilters.every((filter) => {
          if (isNetworkChip(filter)) {
            return filter.filterFn(token, filter.selectedNetworkIds)
          }
          if (isTokenSelectChip(filter)) {
            return filter.filterFn(token, filter.selectedTokenId)
          }
          return filter.filterFn(token)
        })
      ) {
        return false
      }

      return true
    })
  }, [tokensInfo, activeFilters])

  const handleToggleFilterChip = (chip: FilterChip<TokenBalance>) => {
    if (isNetworkChip(chip)) {
      return networkChipRef.current?.snapToIndex(0)
    }
    return tokenBottomSheetRef.current?.snapToIndex(0)
  }

  // These function params mimic the params of the setSelectedNetworkIds function in
  // const [selectedNetworkIds, setSelectedNetworkIds] = useState<NetworkId[]>([])
  // This custom function is used to keep the same shared state between the network filter and the other filters
  // which made the rest of the code more readable and maintainable
  const setSelectedNetworkIds = (arg: NetworkId[] | ((networkIds: NetworkId[]) => NetworkId[])) => {
    setFilters((prev) => {
      return prev.map((chip) => {
        if (isNetworkChip(chip)) {
          const selectedNetworkIds = typeof arg === 'function' ? arg(chip.selectedNetworkIds) : arg
          return {
            ...chip,
            selectedNetworkIds,
            isSelected: selectedNetworkIds.length !== chip.allNetworkIds.length,
          }
        }
        return {
          ...chip,
          isSelected: false,
        }
      })
    })
  }

  const onTokenPressed = (token: TokenBalance) => {
    setFilters((prev) => {
      return prev.map((chip) => {
        if (isTokenSelectChip(chip)) {
          return {
            ...chip,
            selectedTokenId: token.tokenId,
            isSelected: true,
          }
        }
        return {
          ...chip,
          isSelected: false,
        }
      })
    })
    tokenBottomSheetRef.current?.close()
  }

  const handleMeasureListHeadereHeight = (event: LayoutChangeEvent) => {
    setListHeaderHeight(event.nativeEvent.layout.height)
  }

  const handleScroll = useAnimatedScrollHandler((event) => {
    scrollPosition.value = event.contentOffset.y
  })

  const handleMeasureNonStickyHeaderHeight = (event: LayoutChangeEvent) => {
    setNonStickyHeaderHeight(event.nativeEvent.layout.height)
  }

  useScrollAwareHeader({
    navigation,
    title: t('earnFlow.home.title'),
    scrollPosition,
    startFadeInPosition: nonStickyHeaderHeight - HEADER_OPACITY_ANIMATION_START_OFFSET,
    animationDistance: HEADER_OPACITY_ANIMATION_DISTANCE,
  })

  const handleChangeActiveView = (selectedTab: EarnTabType) => {
    navigation.setParams({ activeEarnTab: selectedTab })
  }

  const displayPools = useMemo(() => {
    return pools.filter((pool) => {
      const depositTokenInfo = allTokens[pool.dataProps.depositTokenId]
      const isMyPool = new BigNumber(pool.balance).gt(0) && !!depositTokenInfo
      return activeTab === EarnTabType.MyPools ? isMyPool : !isMyPool
    })
  }, [pools, allTokens, activeTab])

  const onPressLearnMore = () => {
    AppAnalytics.track(EarnEvents.earn_home_learn_more_press)
    learnMoreBottomSheetRef.current?.snapToIndex(0)
  }

  return (
    <>
      <Animated.View testID="EarnScreen" style={styles.container}>
        <Animated.View
          style={[styles.listHeaderContainer, animatedListHeaderStyles]}
          onLayout={handleMeasureListHeadereHeight}
        >
          <View
            style={[styles.nonStickyHeaderContainer]}
            onLayout={handleMeasureNonStickyHeaderHeight}
          >
            <View style={styles.headerRow}>
              <Text style={styles.title}>{t('earnFlow.home.title')}</Text>
              <FilterChipsCarousel
                chips={filters}
                onSelectChip={handleToggleFilterChip}
                forwardedRef={filterChipsCarouselRef}
                style={styles.filterChipsCarouselContainer}
                contentContainerStyle={styles.contentContainerStyle}
                scrollEnabled={false}
              />
            </View>

            <EarnTabBar activeTab={activeTab} onChange={handleChangeActiveView} />
          </View>
        </Animated.View>
        <PoolList
          handleScroll={handleScroll}
          listHeaderHeight={listHeaderHeight}
          paddingBottom={insets.bottom}
          displayPools={displayPools.filter((pool) =>
            pool.tokens.some((token) =>
              tokenList.map((token) => token.tokenId).includes(token.tokenId)
            )
          )}
          onPressLearnMore={onPressLearnMore}
        />
      </Animated.View>
      <LearnMoreBottomSheet learnMoreBottomSheetRef={learnMoreBottomSheetRef} />
      {networkChip && (
        <NetworkMultiSelectBottomSheet
          allNetworkIds={networkChip.allNetworkIds}
          setSelectedNetworkIds={setSelectedNetworkIds}
          selectedNetworkIds={networkChip.selectedNetworkIds}
          forwardedRef={networkChipRef}
        />
      )}
      <TokenBottomSheet
        forwardedRef={tokenBottomSheetRef}
        snapPoints={['90%']}
        tokens={tokensInfo}
        onTokenSelected={onTokenPressed}
        title={t('sendEnterAmountScreen.selectToken')}
        origin={TokenPickerOrigin.Earn}
        filterChips={[]}
      />
    </>
  )
}

function LearnMoreBottomSheet({
  learnMoreBottomSheetRef,
}: {
  learnMoreBottomSheetRef: React.RefObject<BottomSheetRefType>
}) {
  const { t } = useTranslation()

  return (
    <BottomSheet
      forwardedRef={learnMoreBottomSheetRef}
      title={t('earnFlow.home.learnMoreBottomSheet.bottomSheetTitle')}
      testId={'Earn/Home/LearnMoreBottomSheet'}
      titleStyle={styles.learnMoreTitle}
    >
      <Text style={styles.learnMoreSubTitle}>
        {t('earnFlow.home.learnMoreBottomSheet.apySubtitle')}
      </Text>
      <Text style={styles.learnMoreDescription}>
        {t('earnFlow.home.learnMoreBottomSheet.apyDescription')}
      </Text>
      <Text style={styles.learnMoreSubTitle}>
        {t('earnFlow.home.learnMoreBottomSheet.tvlSubtitle')}
      </Text>
      <Text style={styles.learnMoreDescription}>
        {t('earnFlow.home.learnMoreBottomSheet.tvlDescription')}
      </Text>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    ...typeScale.titleMedium,
    color: Colors.black,
  },
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
    gap: Spacing.Thick24,
    flexDirection: 'column',
  },
  headerRow: {
    flexDirection: 'row',
  },
  filterChipsCarouselContainer: {
    flexDirection: 'row',
  },
  contentContainerStyle: {
    justifyContent: 'flex-end',
  },
  learnMoreTitle: {
    ...typeScale.titleSmall,
    colors: Colors.black,
  },
  learnMoreSubTitle: {
    ...typeScale.labelSemiBoldSmall,
    colors: Colors.black,
    marginBottom: Spacing.Tiny4,
  },
  learnMoreDescription: {
    ...typeScale.bodySmall,
    colors: Colors.black,
    marginBottom: Spacing.Thick24,
  },
})

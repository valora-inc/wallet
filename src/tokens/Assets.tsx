import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react'
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
import { useDispatch } from 'react-redux'
import { AssetsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { AssetsTokenBalance } from 'src/components/TokenBalance'
import Touchable from 'src/components/Touchable'
import ImageErrorIcon from 'src/icons/ImageErrorIcon'
import { useDollarsToLocalAmount } from 'src/localCurrency/hooks'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import useScrollAwareHeader from 'src/navigator/ScrollAwareHeader'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import NftMedia from 'src/nfts/NftMedia'
import NftsLoadError from 'src/nfts/NftsLoadError'
import {
  nftsErrorSelector,
  nftsLoadingSelector,
  nftsWithMetadataSelector,
} from 'src/nfts/selectors'
import { fetchNfts } from 'src/nfts/slice'
import { NftOrigin, NftWithNetworkId } from 'src/nfts/types'
import {
  positionsSelector,
  positionsWithClaimableRewardsSelector,
  totalPositionsBalanceUsdSelector,
} from 'src/positions/selectors'
import { Position } from 'src/positions/types'
import useSelector from 'src/redux/useSelector'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { vibrateInformative } from 'src/styles/hapticFeedback'
import { Shadow, Spacing, getShadowStyle } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { PositionItem } from 'src/tokens/AssetItem'
import { TokenBalanceItem } from 'src/tokens/TokenBalanceItem'
import { useTokenPricesAreStale, useTotalTokenBalance } from 'src/tokens/hooks'
import { tokensWithNonZeroBalanceAndShowZeroBalanceSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { getSupportedNetworkIdsForTokenBalances, getTokenAnalyticsProps } from 'src/tokens/utils'

const DEVICE_WIDTH_BREAKPOINT = 340
const NUM_OF_NFTS_PER_ROW = 2

const nftImageSize =
  (variables.width - Spacing.Thick24 * 2 - Spacing.Regular16 * (NUM_OF_NFTS_PER_ROW - 1)) /
  NUM_OF_NFTS_PER_ROW

type Props = NativeStackScreenProps<StackParamList, Screens.Assets>
interface SectionData {
  appName?: string
}

const AnimatedSectionList =
  Animated.createAnimatedComponent<
    SectionListProps<TokenBalance | Position | NftWithNetworkId[], SectionData>
  >(SectionList)

const assetIsPosition = (asset: Position | TokenBalance | NftWithNetworkId[]): asset is Position =>
  'type' in asset && (asset.type === 'app-token' || asset.type === 'contract-position')

/**
 * Helper function to group an array into chunks of size n
 * Used with Nfts to group them for use in the section list
 */
const groupArrayByN = (arr: any[], n: number) => {
  return arr.reduce((result, item, index) => {
    if (index % n === 0) {
      result.push([item])
    } else {
      result[Math.floor(index / n)].push(item)
    }
    return result
  }, [])
}

export enum AssetTabType {
  Tokens = 0,
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
  const dispatch = useDispatch()

  const activeTab = route.params?.activeTab ?? AssetTabType.Tokens

  const supportedNetworkIds = getSupportedNetworkIdsForTokenBalances()
  const tokens = useSelector((state) =>
    tokensWithNonZeroBalanceAndShowZeroBalanceSelector(state, supportedNetworkIds)
  )

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

  // NFT Selectors
  const nftsError = useSelector(nftsErrorSelector)
  const nftsLoading = useSelector(nftsLoadingSelector)
  const nfts = useSelector(nftsWithMetadataSelector)
  // Group nfts for use in the section list
  const nftsGrouped = groupArrayByN(nfts, NUM_OF_NFTS_PER_ROW)

  useEffect(() => {
    dispatch(fetchNfts())
  }, [])

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

  const positionSections = useMemo(() => {
    const positionsByDapp = new Map<string, Position[]>()
    positions.forEach((position) => {
      if (positionsByDapp.has(position.appName)) {
        positionsByDapp.get(position.appName)?.push(position)
      } else {
        positionsByDapp.set(position.appName, [position])
      }
    })

    const sections: SectionListData<TokenBalance | Position | NftWithNetworkId[], SectionData>[] =
      []
    positionsByDapp.forEach((positions, appName) => {
      sections.push({
        data: positions,
        appName,
      })
    })
    return sections
  }, [positions])

  const sections =
    activeTab === AssetTabType.Tokens
      ? [{ data: tokens }]
      : activeTab === AssetTabType.Positions
        ? positionSections
        : nfts.length
          ? [{ data: nftsGrouped }]
          : []

  const renderSectionHeader = ({
    section,
  }: {
    section: SectionListData<TokenBalance | Position | NftWithNetworkId[], SectionData>
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

  const keyExtractor = (item: TokenBalance | Position | NftWithNetworkId[], index: number) => {
    if (assetIsPosition(item)) {
      // Ideally we wouldn't need the index here, but we need to differentiate
      // between positions with the same address (e.g. Uniswap V3 pool NFTs)
      // We may want to consider adding a unique identifier to the position type.
      return `${activeTab}-${item.appId}-${item.network}-${item.address}-${index}`
    } else if ('balance' in item) {
      return `${activeTab}-${item.tokenId}`
    } else {
      return `${activeTab}-${item[0]!.networkId}-${item[0]!.contractAddress}-${item[0]!.tokenId}`
    }
  }

  const NftItem = ({ item }: { item: NftWithNetworkId }) => {
    return (
      <View testID="NftItem" style={styles.nftsTouchableContainer}>
        <Touchable
          borderless={false}
          onPress={() =>
            navigate(Screens.NftsInfoCarousel, { nfts: [item], networkId: item.networkId })
          }
          style={styles.nftsTouchableIcon}
        >
          <NftMedia
            nft={item}
            testID="NftGallery/NftImage"
            width={nftImageSize}
            height={nftImageSize}
            ErrorComponent={
              <View style={styles.nftsErrorView}>
                <ImageErrorIcon />
                {item.metadata?.name && (
                  <Text numberOfLines={2} style={styles.nftsNoMetadataText}>
                    {item.metadata.name}
                  </Text>
                )}
              </View>
            }
            origin={NftOrigin.Assets}
            borderRadius={Spacing.Regular16}
            mediaType="image"
          />
        </Touchable>
      </View>
    )
  }

  const NftGroup = ({ item }: { item: NftWithNetworkId[] }) => {
    return (
      <View style={styles.nftsPairingContainer}>
        {item.map((nft, index) => (
          <NftItem key={index} item={nft} />
        ))}
      </View>
    )
  }

  const renderAssetItem = ({
    item,
    index,
  }: {
    item: TokenBalance | Position | NftWithNetworkId[]
    index: number
  }) => {
    if (assetIsPosition(item)) {
      return <PositionItem position={item} />
    } else if ('balance' in item) {
      return (
        <TokenBalanceItem
          token={item}
          onPress={() => {
            navigate(Screens.TokenDetails, { tokenId: item.tokenId })
            ValoraAnalytics.track(AssetsEvents.tap_asset, {
              ...getTokenAnalyticsProps(item),
              title: item.symbol,
              description: item.name,
              assetType: 'token',
            })
          }}
        />
      )
    } else {
      return <NftGroup item={item} />
    }
  }

  const renderEmptyState = () => {
    switch (activeTab) {
      case AssetTabType.Tokens:
      case AssetTabType.Positions:
        return null
      case AssetTabType.Collectibles:
        if (nftsError) return <NftsLoadError testID="Assets/NftsLoadError" />
        else if (nftsLoading) return null
        else
          return (
            <View
              testID="Assets/NoNfts"
              style={[{ marginTop: listHeaderHeight }, styles.noNftsTextContainer]}
            >
              <Text style={styles.noNftsText}>{t('nftGallery.noNfts')}</Text>
            </View>
          )
    }
  }

  const tabBarItems = useMemo(() => {
    const items = [t('assets.tabBar.tokens'), t('assets.tabBar.collectibles')]
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

      <AnimatedSectionList
        contentContainerStyle={[
          {
            paddingBottom: insets.bottom,
            opacity: listHeaderHeight > 0 ? 1 : 0,
          },
          activeTab === AssetTabType.Collectibles &&
            !nftsError &&
            nfts.length > 0 &&
            styles.nftsContentContainer,
        ]}
        // ensure header is above the scrollbar on ios overscroll
        scrollIndicatorInsets={{ top: listHeaderHeight }}
        // @ts-ignore can't get the SectionList to accept a union type :(
        sections={sections}
        renderItem={renderAssetItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={keyExtractor}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ItemSeparatorComponent={() =>
          activeTab === AssetTabType.Collectibles ? (
            <View style={{ height: Spacing.Regular16 }} />
          ) : null
        }
        ListHeaderComponent={<View style={{ height: listHeaderHeight }} />}
        ListEmptyComponent={renderEmptyState}
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
    items.length > 2 && variables.width < DEVICE_WIDTH_BREAKPOINT
      ? Spacing.Smallest8
      : Spacing.Regular16

  return (
    <View style={[styles.tabBarContainer, { gap }]} testID="Assets/TabBar">
      {items.map((value, index) => (
        <Touchable
          testID="Assets/TabBarItem"
          key={value}
          onPress={handleSelectOption(value, index)}
          style={styles.tabBarTouchable}
        >
          <Text
            style={[index === selectedIndex ? styles.tabBarItemSelected : styles.tabBarItem]}
            numberOfLines={1}
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
    backgroundColor: Colors.white,
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
    backgroundColor: Colors.white,
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
  tabBarTouchable: {
    flexShrink: 1,
  },
  tabBarItem: {
    ...typeScale.bodyMedium,
    color: Colors.gray4,
  },
  tabBarItemSelected: {
    ...typeScale.labelMedium,
    color: Colors.black,
  },
  topBarTextButton: {
    ...typeScale.bodyMedium,
    paddingRight: Spacing.Smallest8,
  },
  nftsPairingContainer: {
    flexDirection: 'row',
    gap: Spacing.Regular16,
  },
  nftsContentContainer: {
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.Thick24,
  },
  nftsErrorView: {
    width: nftImageSize,
    height: nftImageSize,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray2,
    borderRadius: Spacing.Regular16,
  },
  nftsNoMetadataText: {
    ...typeScale.labelSmall,
    textAlign: 'center',
  },
  nftsTouchableContainer: {
    overflow: 'hidden',
    borderRadius: Spacing.Regular16,
  },
  nftsTouchableIcon: {
    borderRadius: Spacing.Regular16,
  },
  noNftsText: {
    ...typeScale.bodySmall,
    color: Colors.gray3,
    textAlign: 'center',
  },
  noNftsTextContainer: {
    paddingHorizontal: Spacing.Thick24,
  },
})

export default AssetsScreen

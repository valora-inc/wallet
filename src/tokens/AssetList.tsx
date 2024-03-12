import React, { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  SectionList,
  SectionListData,
  SectionListProps,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AssetsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Touchable from 'src/components/Touchable'
import CircledIcon from 'src/icons/CircledIcon'
import ImageErrorIcon from 'src/icons/ImageErrorIcon'
import Add from 'src/icons/quick-actions/Add'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import NftMedia from 'src/nfts/NftMedia'
import NftsLoadError from 'src/nfts/NftsLoadError'
import {
  nftsErrorSelector,
  nftsLoadingSelector,
  nftsWithMetadataSelector,
} from 'src/nfts/selectors'
import { fetchNfts } from 'src/nfts/slice'
import { NftOrigin, NftWithNetworkId } from 'src/nfts/types'
import { positionsSelector } from 'src/positions/selectors'
import { Position } from 'src/positions/types'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { PositionItem } from 'src/tokens/PositionItem'
import { TokenBalanceItem } from 'src/tokens/TokenBalanceItem'
import { sortedTokensWithBalanceOrShowZeroBalanceSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { AssetTabType } from 'src/tokens/types'
import { getSupportedNetworkIdsForTokenBalances, getTokenAnalyticsProps } from 'src/tokens/utils'

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

const NUM_OF_NFTS_PER_ROW = 2

const nftImageSize =
  (variables.width - Spacing.Thick24 * 2 - Spacing.Regular16 * (NUM_OF_NFTS_PER_ROW - 1)) /
  NUM_OF_NFTS_PER_ROW

export default function AssetList({
  activeTab,
  listHeaderHeight,
  handleScroll,
  isWalletTab,
}: {
  activeTab: AssetTabType
  listHeaderHeight: number
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  // temporary parameter while we build the tab navigator, should be cleaned up
  // when we remove the drawer
  isWalletTab?: boolean
}) {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  const supportedNetworkIds = getSupportedNetworkIdsForTokenBalances()
  const tokens = useSelector((state) =>
    sortedTokensWithBalanceOrShowZeroBalanceSelector(state, supportedNetworkIds)
  )

  const positions = useSelector(positionsSelector)
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

  // NFT Selectors
  const nftsError = useSelector(nftsErrorSelector)
  const nftsLoading = useSelector(nftsLoadingSelector)
  const nfts = useSelector(nftsWithMetadataSelector)
  // Group nfts for use in the section list
  const nftsGrouped = groupArrayByN(nfts, NUM_OF_NFTS_PER_ROW)

  useEffect(() => {
    dispatch(fetchNfts())
  }, [])

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

  const showImportTokenFooter =
    isWalletTab &&
    activeTab === AssetTabType.Tokens &&
    getFeatureGate(StatsigFeatureGates.SHOW_IMPORT_TOKENS_FLOW)

  return (
    <AnimatedSectionList
      contentContainerStyle={[
        {
          paddingBottom: isWalletTab ? 0 : insets.bottom,
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
      ListFooterComponent={showImportTokenFooter ? <ImportTokensItem /> : null}
    />
  )
}

function ImportTokensItem() {
  const { t } = useTranslation()
  return (
    <Touchable
      testID="AssetList/ImportTokens"
      onPress={() => {
        ValoraAnalytics.track(AssetsEvents.import_token_screen_open)
        navigate(Screens.TokenImport)
      }}
    >
      <View style={styles.importTokenContainer}>
        <CircledIcon radius={32} backgroundColor={Colors.successLight}>
          <Add color={Colors.successDark} />
        </CircledIcon>
        <Text style={styles.importTokenText}>{t('assets.importTokens')}</Text>
      </View>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  positionSectionHeaderContainer: {
    padding: Spacing.Thick24,
    paddingTop: Spacing.Regular16,
  },
  positionSectionHeaderText: {
    ...typeScale.labelXXSmall,
    color: Colors.gray5,
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
  importTokenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: Spacing.Thick24,
    marginVertical: Spacing.Thick24,
    gap: Spacing.Small12,
  },
  importTokenText: {
    ...typeScale.labelMedium,
    color: Colors.black,
  },
})

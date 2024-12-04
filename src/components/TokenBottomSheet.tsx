import {
  BottomSheetFlatList,
  BottomSheetFlatListMethods,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet'
import { debounce } from 'lodash'
import React, { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TextStyle, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { TokenBottomSheetEvents } from 'src/analytics/Events'
import { BottomSheetModalRefType } from 'src/components/BottomSheet'
import BottomSheetBase from 'src/components/BottomSheetBase'
import FilterChipsCarousel, {
  FilterChip,
  NetworkFilterChip,
  isNetworkChip,
} from 'src/components/FilterChipsCarousel'
import KeyboardSpacer from 'src/components/KeyboardSpacer'
import SearchInput from 'src/components/SearchInput'
import NetworkMultiSelectBottomSheet from 'src/components/multiSelect/NetworkMultiSelectBottomSheet'
import InfoIcon from 'src/icons/InfoIcon'
import { NETWORK_NAMES } from 'src/shared/conts'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { TokenBalanceItem } from 'src/tokens/TokenBalanceItem'
import { TokenBalance } from 'src/tokens/slice'
import { NetworkId } from 'src/transactions/types'

export enum TokenPickerOrigin {
  Send = 'Send',
  SwapFrom = 'Swap/From',
  SwapTo = 'Swap/To',
  CashIn = 'CashIn',
  CashOut = 'CashOut',
  Spend = 'Spend',
  Earn = 'Earn',
}

export const DEBOUNCE_WAIT_TIME = 200

export type TokenBottomSheetProps = {
  origin: TokenPickerOrigin
  onTokenSelected: (token: TokenBalance, tokenPositionInList: number) => void
  title: string
  titleStyle?: TextStyle
  searchEnabled?: boolean
  snapPoints?: (string | number)[]
  tokens: TokenBalance[]
  TokenOptionComponent?: React.ComponentType<TokenOptionProps>
  showPriceUsdUnavailableWarning?: boolean
  filterChips?: FilterChip<TokenBalance>[]
  areSwapTokensShuffled?: boolean
  wrapWithModalProvider?: boolean
} & (
  | { isScreen: true; forwardedRef?: undefined }
  | { forwardedRef: RefObject<BottomSheetModalRefType>; isScreen?: false }
)

interface TokenOptionProps {
  tokenInfo: TokenBalance
  onPress: () => void
  index: number
  showPriceUsdUnavailableWarning?: boolean
}

function NoResults({
  testID = 'TokenBottomSheet/NoResult',
  searchTerm,
  activeFilters,
}: {
  testID?: string
  searchTerm: string
  activeFilters: FilterChip<TokenBalance>[]
}) {
  const { t } = useTranslation()

  const activeFilterNames = activeFilters.map((activeFilter) => {
    if (!isNetworkChip(activeFilter)) {
      return `"${activeFilter.name}"`
    }

    // use the network name as the filter name to give more information,
    // rather than the filter name itself (which is "network")
    return activeFilter.selectedNetworkIds
      .map(
        (selectedNetworkId) =>
          `"${t('tokenBottomSheet.filters.network', {
            networkName: NETWORK_NAMES[selectedNetworkId],
          })}"`
      )
      .join(', ')
  })
  const noResultsText =
    activeFilterNames.length > 0 && searchTerm.length > 0
      ? 'tokenBottomSheet.noFilterSearchResults'
      : activeFilterNames.length > 0
        ? 'tokenBottomSheet.noFilterResults'
        : 'tokenBottomSheet.noSearchResults'

  return (
    <View testID={testID} style={styles.noResultsContainer}>
      <View style={styles.iconContainer}>
        <InfoIcon color={Colors.infoDark} />
      </View>
      <Text style={styles.noResultsText}>
        {t(noResultsText, { searchTerm: searchTerm, filterNames: activeFilterNames.join(', ') })}
      </Text>
    </View>
  )
}

function TokenBottomSheet({
  forwardedRef,
  snapPoints,
  origin,
  onTokenSelected,
  tokens,
  searchEnabled,
  title,
  titleStyle,
  showPriceUsdUnavailableWarning,
  filterChips = [],
  areSwapTokensShuffled,
  isScreen,
  wrapWithModalProvider = true,
}: TokenBottomSheetProps) {
  const insets = useSafeAreaInsets()

  const filterChipsCarouselRef = useRef<ScrollView>(null)
  const tokenListRef = useRef<BottomSheetFlatListMethods>(null)
  const [headerHeight, setHeaderHeight] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState(filterChips)
  const activeFilters = useMemo(() => filters.filter((filter) => filter.isSelected), [filters])

  const { t } = useTranslation()

  const networkChipRef = useRef<BottomSheetModalRefType>(null)
  const networkChip = useMemo(
    () => filters.find((chip): chip is NetworkFilterChip<TokenBalance> => isNetworkChip(chip)),
    [filters]
  )

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
        return chip
      })
    })
  }

  const handleToggleFilterChip = (toggledChip: FilterChip<TokenBalance>) => {
    if (isNetworkChip(toggledChip)) {
      networkChipRef.current?.snapToIndex(0)
    } else {
      AppAnalytics.track(TokenBottomSheetEvents.toggle_tokens_filter, {
        filterId: toggledChip.id,
        isRemoving: filters.find((chip) => chip.id === toggledChip.id)?.isSelected ?? false,
        isPreSelected: filterChips.find((chip) => chip.id === toggledChip.id)?.isSelected ?? false,
      })
      setFilters((prev) => {
        return prev.map((chip) => {
          if (chip.id === toggledChip.id) {
            return { ...chip, isSelected: !chip.isSelected }
          }
          return chip
        })
      })
    }
  }

  const onTokenPressed = (token: TokenBalance, index: number) => () => {
    AppAnalytics.track(TokenBottomSheetEvents.token_selected, {
      origin,
      tokenAddress: token.address,
      tokenId: token.tokenId,
      networkId: token.networkId,
      usedSearchTerm: searchTerm.length > 0,
      selectedFilters: activeFilters.map((filter) => filter.id),
      areSwapTokensShuffled,
      tokenPositionInList: index,
    })
    onTokenSelected(token, index)
  }

  const sendAnalytics = useCallback(
    debounce((searchInput: string) => {
      AppAnalytics.track(TokenBottomSheetEvents.search_token, {
        origin,
        searchInput,
      })
    }, DEBOUNCE_WAIT_TIME),
    []
  )

  const tokenList = useMemo(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase()

    return tokens.filter((token) => {
      // Exclude the token if it does not match the active filters
      if (
        !activeFilters.every((filter) => {
          if (isNetworkChip(filter)) {
            return filter.filterFn(token, filter.selectedNetworkIds)
          }
          return filter.filterFn(token)
        })
      ) {
        return false
      }

      // Exclude the token if it does not match the search term
      if (
        searchTerm &&
        !(
          token.symbol.toLowerCase().includes(lowercasedSearchTerm) ||
          token.name.toLowerCase().includes(lowercasedSearchTerm)
        )
      ) {
        return false
      }

      return true
    })
  }, [searchTerm, tokens, activeFilters])

  useEffect(() => {
    // Scroll to top when the token list changes (e.g. when there are new
    // filters and search terms applied)
    if (tokenList.length > 0) {
      tokenListRef.current?.scrollToOffset({ offset: 0, animated: true })
    }
  }, [tokenList])

  const handleMeasureHeader = (event: { nativeEvent: { layout: { height: number } } }) => {
    setHeaderHeight(event.nativeEvent.layout.height)
  }

  // This component implements a sticky header using an absolutely positioned
  // component on top of a blank container of the same height in the
  // ListHeaderComponent of the Flatlist. Unfortunately the out of the box
  // sticky header implementation of FlatList does not work so well with the
  // scroll methods inside dynamically sized bottom sheets and it was observed
  // that the header would be stuck to the wrong position between sheet reopens.
  // See https://valora-app.slack.com/archives/C04B61SJ6DS/p1707757919681089
  const content = (
    // Note: ideally we wouldn't need this wrapper view,
    // it's here for testing purposes with the testID
    // wrapping both the FlatList and the sticky header
    // TODO: check if we can remove this wrapper view now that dynamic sizing seems more robust
    <View style={styles.container} testID="TokenBottomSheet">
      <BottomSheetFlatList
        ref={tokenListRef}
        data={tokenList}
        keyExtractor={(item) => item.tokenId}
        contentContainerStyle={{
          paddingBottom: insets.bottom,
          // fill full height if there are filter chips, otherwise the bottom
          // sheet height changes as tokens are filtered
          flexGrow: filterChips.length ? 1 : undefined,
        }}
        scrollIndicatorInsets={{ top: headerHeight }}
        renderItem={({ item, index }) => {
          return (
            <TokenBalanceItem
              token={item}
              balanceUsdErrorFallback={t('tokenDetails.priceUnavailable') ?? undefined}
              onPress={onTokenPressed(item, index)}
              containerStyle={styles.tokenBalanceItemContainer}
              showPriceUsdUnavailableWarning={showPriceUsdUnavailableWarning}
              testIdPrefix={'BottomSheet'}
            />
          )
        }}
        ListHeaderComponent={<View style={{ height: headerHeight }} />}
        ListEmptyComponent={() => {
          if (searchEnabled || filterChips.length > 0) {
            return <NoResults searchTerm={searchTerm} activeFilters={activeFilters} />
          }
          return null
        }}
      />
      <KeyboardSpacer />
      <View style={styles.headerContainer} onLayout={handleMeasureHeader}>
        <Text style={[styles.title, titleStyle]}>{title}</Text>
        {searchEnabled && (
          <SearchInput
            placeholder={t('tokenBottomSheet.searchAssets') ?? undefined}
            value={searchTerm}
            onChangeText={(text) => {
              setSearchTerm(text)
              sendAnalytics(text)
            }}
            style={styles.searchInput}
            returnKeyType={'search'}
            // disable autoCorrect and spellCheck since the search terms here
            // are token names which autoCorrect would get in the way of. This
            // combination also hides the keyboard suggestions bar from the top
            // of the iOS keyboard, preserving screen real estate.
            autoCorrect={false}
            spellCheck={false}
          />
        )}
        {filterChips.length > 0 && (
          <FilterChipsCarousel
            chips={filters}
            onSelectChip={handleToggleFilterChip}
            style={styles.filterChipsCarouselContainer}
            forwardedRef={filterChipsCarouselRef}
            scrollEnabled={false}
          />
        )}
      </View>
    </View>
  )

  return (
    <>
      {isScreen ? (
        // Don't wrap the content in a BottomSheetBase when used as a screen
        // since the bottom sheet navigator already provides the necessary wrapping
        content
      ) : wrapWithModalProvider ? (
        <BottomSheetModalProvider>
          <BottomSheetBase forwardedRef={forwardedRef} snapPoints={snapPoints}>
            {content}
          </BottomSheetBase>
        </BottomSheetModalProvider>
      ) : (
        <BottomSheetBase forwardedRef={forwardedRef} snapPoints={snapPoints}>
          {content}
        </BottomSheetBase>
      )}
      {networkChip && (
        <BottomSheetModalProvider>
          <NetworkMultiSelectBottomSheet
            allNetworkIds={networkChip.allNetworkIds}
            setSelectedNetworkIds={setSelectedNetworkIds}
            selectedNetworkIds={networkChip.selectedNetworkIds}
            forwardedRef={networkChipRef}
            onSelect={(selectedNetworkIds: NetworkId[]) => {
              AppAnalytics.track(TokenBottomSheetEvents.network_filter_updated, {
                selectedNetworkIds,
                origin,
              })
            }}
          />
        </BottomSheetModalProvider>
      )}
    </>
  )
}

TokenBottomSheet.navigationOptions = {}

const styles = StyleSheet.create({
  // Important: care must be taken when changing the styles of the container
  // It could most likely break the dynamic sizing of the bottom sheet
  // so avoid adding padding/margin to it, or min/max height
  container: {
    flex: 1,
  },
  searchInput: {
    marginTop: Spacing.Regular16,
  },
  iconContainer: {
    marginRight: Spacing.Small12,
  },
  noResultsText: {
    ...typeScale.labelSmall,
    flex: 1,
  },
  noResultsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.Regular16,
  },
  tokenBalanceItemContainer: {
    marginHorizontal: Spacing.Thick24,
  },
  filterChipsCarouselContainer: {
    paddingTop: Spacing.Thick24,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    padding: Spacing.Thick24,
    backgroundColor: Colors.white,
    width: '100%',
  },
  title: {
    ...typeScale.titleSmall,
  },
})

export default TokenBottomSheet

import { BottomSheetFlatList, BottomSheetFlatListMethods } from '@gorhom/bottom-sheet'
import { BottomSheetFlatListProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetScrollable/types'
import { debounce } from 'lodash'
import React, { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatListProps, StyleSheet, Text, TextStyle, View } from 'react-native'
import { FlatList, ScrollView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TokenBottomSheetEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { BottomSheetRefType } from 'src/components/BottomSheet'
import BottomSheetBase from 'src/components/BottomSheetBase'
import FilterChipsCarousel, {
  FilterChip,
  NetworkFilterChip,
  isNetworkChip,
} from 'src/components/FilterChipsCarousel'
import SearchInput from 'src/components/SearchInput'
import NetworkMultiSelectBottomSheet from 'src/components/multiSelect/NetworkMultiSelectBottomSheet'
import InfoIcon from 'src/icons/InfoIcon'
import colors, { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
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
} & (
  | { isScreen: true; forwardedRef?: undefined }
  | { forwardedRef: RefObject<BottomSheetRefType>; isScreen?: false }
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

  const activeFilterNames = activeFilters.map((filter) => `"${filter.name}"`)
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
}: TokenBottomSheetProps) {
  const insets = useSafeAreaInsets()

  const filterChipsCarouselRef = useRef<ScrollView>(null)
  const tokenListBottomSheetFlatListRef = useRef<BottomSheetFlatListMethods>(null)
  const tokenListFlatListRef = useRef<FlatList>(null)
  const tokenListRef = isScreen ? tokenListFlatListRef : tokenListBottomSheetFlatListRef
  const [headerHeight, setHeaderHeight] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState(filterChips)
  const activeFilters = useMemo(() => filters.filter((filter) => filter.isSelected), [filters])

  const { t } = useTranslation()

  const networkChipRef = useRef<BottomSheetRefType>(null)
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
      ValoraAnalytics.track(TokenBottomSheetEvents.toggle_tokens_filter, {
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
    ValoraAnalytics.track(TokenBottomSheetEvents.token_selected, {
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
      ValoraAnalytics.track(TokenBottomSheetEvents.search_token, {
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

  // same issue as BottomSheetScrollView, BottomSheetFlatList does not scroll
  // correctly when used in a screen. See comment in
  // src/components/BottomSheetScrollView for more details
  const FlatListComponent = isScreen
    ? (props: FlatListProps<TokenBalance>) => <FlatList ref={tokenListFlatListRef} {...props} />
    : (props: BottomSheetFlatListProps<TokenBalance>) => (
        <BottomSheetFlatList ref={tokenListBottomSheetFlatListRef} {...props} />
      )

  // This component implements a sticky header using an absolutely positioned
  // component on top of a blank container of the same height in the
  // ListHeaderComponent of the Flatlist. Unfortunately the out of the box
  // sticky header implementation of FlatList does not work so well with the
  // scroll methods inside dynamically sized bottom sheets and it was observed
  // that the header would be stuck to the wrong position between sheet reopens.
  // See https://valora-app.slack.com/archives/C04B61SJ6DS/p1707757919681089
  const content = (
    <>
      <FlatListComponent
        data={tokenList}
        keyExtractor={(item) => item.tokenId}
        contentContainerStyle={[styles.tokenListContainer, { paddingBottom: insets.bottom }]}
        scrollIndicatorInsets={{ top: headerHeight }}
        renderItem={({ item, index }) => {
          return (
            <TokenBalanceItem
              token={item}
              balanceUsdErrorFallback={t('tokenDetails.priceUnavailable') ?? undefined}
              onPress={onTokenPressed(item, index)}
              containerStyle={styles.tokenBalanceItemContainer}
              showPriceUsdUnavailableWarning={showPriceUsdUnavailableWarning}
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
            primaryColor={colors.successDark}
            secondaryColor={colors.successLight}
            style={styles.filterChipsCarouselContainer}
            forwardedRef={filterChipsCarouselRef}
            scrollEnabled={false}
          />
        )}
      </View>
    </>
  )

  return (
    <>
      {isScreen ? (
        <View
          // use fixed height if there are filter chips, otherwise the bottom
          // sheet height changes as tokens as filtered
          style={filterChips.length ? styles.screenContainerFixed : styles.screenContainer}
          testID="TokenBottomSheet"
        >
          {content}
        </View>
      ) : (
        <BottomSheetBase forwardedRef={forwardedRef} snapPoints={snapPoints}>
          <View style={styles.container} testID="TokenBottomSheet">
            {content}
          </View>
        </BottomSheetBase>
      )}
      {networkChip && (
        <NetworkMultiSelectBottomSheet
          allNetworkIds={networkChip.allNetworkIds}
          setSelectedNetworkIds={setSelectedNetworkIds}
          selectedNetworkIds={networkChip.selectedNetworkIds}
          forwardedRef={networkChipRef}
          onClose={() => {
            ValoraAnalytics.track(TokenBottomSheetEvents.network_filter_updated, {
              selectedNetworkIds: networkChip.selectedNetworkIds,
              origin,
            })
            networkChipRef.current?.close()
          }}
        />
      )}
    </>
  )
}

TokenBottomSheet.navigationOptions = {}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    maxHeight: variables.height * 0.9,
  },
  screenContainerFixed: {
    height: variables.height * 0.9,
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
    marginHorizontal: 0,
  },
  filterChipsCarouselContainer: {
    paddingTop: Spacing.Thick24,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    padding: Spacing.Thick24,
    backgroundColor: colors.white,
    width: '100%',
  },
  tokenListContainer: {
    paddingHorizontal: Spacing.Thick24,
  },
  title: {
    ...typeScale.titleSmall,
  },
})

export default TokenBottomSheet

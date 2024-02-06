import { debounce } from 'lodash'
import React, { RefObject, useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TextStyle, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { SendEvents, TokenBottomSheetEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import FilterChipsCarousel, { FilterChip } from 'src/components/FilterChipsCarousel'
import SearchInput from 'src/components/SearchInput'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenIcon, { IconSize } from 'src/components/TokenIcon'
import Touchable from 'src/components/Touchable'
import InfoIcon from 'src/icons/InfoIcon'
import colors, { Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { TokenBalanceItem } from 'src/tokens/TokenBalanceItem'
import { TokenBalance } from 'src/tokens/slice'

export enum TokenPickerOrigin {
  Send = 'Send',
  SendConfirmation = 'SendConfirmation',
  Exchange = 'Exchange',
  Swap = 'Swap',
}

export const DEBOUCE_WAIT_TIME = 200

export interface TokenBottomSheetProps<T extends TokenBalance> {
  forwardedRef: RefObject<BottomSheetRefType>
  origin: TokenPickerOrigin
  onTokenSelected: (token: T) => void
  title: string
  titleStyle?: TextStyle
  searchEnabled?: boolean
  snapPoints?: (string | number)[]
  tokens: T[]
  TokenOptionComponent?: React.ComponentType<TokenOptionProps>
  showPriceUsdUnavailableWarning?: boolean
  filterChips?: FilterChip<TokenBalance>[]
}

interface TokenOptionProps {
  tokenInfo: TokenBalance
  onPress: () => void
  index: number
  showPriceUsdUnavailableWarning?: boolean
}

/**
 * @deprecated new bottom sheets should use TokenBalanceItemOption
 */
function TokenOption({ tokenInfo, onPress, index }: TokenOptionProps) {
  return (
    <>
      {index > 0 && <View style={styles.separator} />}
      <Touchable onPress={onPress} testID={`${tokenInfo.symbol}Touchable`}>
        <View style={styles.tokenOptionContainer}>
          <TokenIcon token={tokenInfo} viewStyle={styles.tokenImage} size={IconSize.LARGE} />
          <View style={styles.tokenNameContainer}>
            <Text style={styles.localBalance}>{tokenInfo.symbol}</Text>
            <Text style={styles.currencyBalance}>{tokenInfo.name}</Text>
          </View>
          <View style={styles.tokenBalanceContainer}>
            <TokenDisplay
              style={styles.localBalance}
              amount={tokenInfo.balance}
              tokenId={tokenInfo.tokenId}
              showLocalAmount={true}
              testID={`Local${tokenInfo.symbol}Balance`}
            />
            <TokenDisplay
              style={styles.currencyBalance}
              amount={tokenInfo.balance}
              tokenId={tokenInfo.tokenId}
              showLocalAmount={false}
              testID={`${tokenInfo.symbol}Balance`}
            />
          </View>
        </View>
      </Touchable>
    </>
  )
}

export function TokenBalanceItemOption({
  tokenInfo,
  onPress,
  showPriceUsdUnavailableWarning,
}: TokenOptionProps) {
  const { t } = useTranslation()
  return (
    <TokenBalanceItem
      token={tokenInfo}
      balanceUsdErrorFallback={t('tokenDetails.priceUnavailable') ?? undefined}
      onPress={onPress}
      containerStyle={styles.tokenBalanceItemContainer}
      showPriceUsdUnavailableWarning={showPriceUsdUnavailableWarning}
    />
  )
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

function TokenBottomSheet<T extends TokenBalance>({
  forwardedRef,
  snapPoints,
  origin,
  onTokenSelected,
  tokens,
  searchEnabled,
  title,
  titleStyle,
  TokenOptionComponent = TokenOption,
  showPriceUsdUnavailableWarning,
  filterChips = [],
}: TokenBottomSheetProps<T>) {
  const filterChipsCarouselRef = useRef<ScrollView>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState(filterChips)
  const activeFilters = useMemo(() => filters.filter((filter) => filter.isSelected), [filters])

  const { t } = useTranslation()

  const handleToggleFilterChip = (toggledChip: FilterChip<TokenBalance>) => {
    setFilters((prev) => {
      return prev.map((chip) => {
        if (chip.id === toggledChip.id) {
          return { ...chip, isSelected: !chip.isSelected }
        }
        return chip
      })
    })
  }

  const onTokenPressed = (token: T) => () => {
    ValoraAnalytics.track(SendEvents.token_selected, {
      origin,
      tokenAddress: token.address,
      tokenId: token.tokenId,
      networkId: token.networkId,
    })
    onTokenSelected(token)
  }

  const sendAnalytics = useCallback(
    debounce((searchInput: string) => {
      ValoraAnalytics.track(TokenBottomSheetEvents.search_token, {
        origin,
        searchInput,
      })
    }, DEBOUCE_WAIT_TIME),
    []
  )

  const tokenList = useMemo(() => {
    const activeFilterFns = activeFilters.map((filter) => filter.filterFn)

    return tokens.filter((token) => {
      const matchesFilters =
        activeFilterFns.length > 0 ? activeFilterFns.some((filterFn) => filterFn(token)) : true

      const matchesSearch =
        searchTerm.length > 0
          ? token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
            token.name.toLowerCase().includes(searchTerm.toLowerCase())
          : true

      return matchesFilters && matchesSearch
    })
  }, [searchTerm, tokens, filters])

  const handleOpen = () => {
    setFilters(filterChips)
  }

  const handleClose = () => {
    setSearchTerm('')
    filterChipsCarouselRef.current?.scrollTo({ x: 0 })
  }

  return (
    <BottomSheet
      forwardedRef={forwardedRef}
      snapPoints={snapPoints}
      title={title}
      titleStyle={titleStyle}
      stickyTitle={searchEnabled}
      stickyHeaderComponent={
        <>
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
            />
          )}
        </>
      }
      onOpen={handleOpen}
      onClose={handleClose}
      testId="TokenBottomSheet"
    >
      {tokenList.length == 0 ? (
        searchEnabled || filterChips.length > 0 ? (
          <NoResults searchTerm={searchTerm} activeFilters={activeFilters} />
        ) : null
      ) : (
        tokenList.map((tokenInfo, index) => {
          return (
            // Duplicate keys could happen with token.address
            <React.Fragment key={`token-${tokenInfo.tokenId ?? index}`}>
              <TokenOptionComponent
                tokenInfo={tokenInfo}
                onPress={onTokenPressed(tokenInfo)}
                index={index}
                showPriceUsdUnavailableWarning={showPriceUsdUnavailableWarning}
              />
            </React.Fragment>
          )
        })
      )}
    </BottomSheet>
  )
}

TokenBottomSheet.navigationOptions = {}

const styles = StyleSheet.create({
  tokenOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.Regular16,
  },
  tokenImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.Small12,
  },
  tokenNameContainer: {
    flex: 3,
    alignItems: 'flex-start',
    flexShrink: 1,
  },
  tokenBalanceContainer: {
    flex: 2,
    flexShrink: 1,
    alignItems: 'flex-end',
  },
  localBalance: {
    flexShrink: 1,
    ...fontStyles.regular,
  },
  currencyBalance: {
    flexShrink: 1,
    ...fontStyles.small,
    color: colors.gray4,
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: colors.gray2,
  },
  searchInput: {
    marginTop: Spacing.Regular16,
  },
  iconContainer: {
    marginRight: Spacing.Small12,
  },
  noResultsText: {
    ...fontStyles.regular500,
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
})

export default TokenBottomSheet

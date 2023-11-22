import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  RefreshControl,
  ScrollView,
  SectionList,
  SectionListProps,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import Animated from 'react-native-reanimated'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { DappExplorerEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { BottomSheetRefType } from 'src/components/BottomSheet'
import QrScanButton from 'src/components/QrScanButton'
import SearchInput from 'src/components/SearchInput'
import {
  dappsCategoriesAlphabeticalSelector,
  dappsListErrorSelector,
  dappsListLoadingSelector,
  dappsMinimalDisclaimerEnabledSelector,
  favoriteDappsWithCategoryNamesSelector,
  nonFavoriteDappsWithCategoryNamesSelector,
} from 'src/dapps/selectors'
import { fetchDappsList } from 'src/dapps/slice'
import { ActiveDapp, Dapp, DappSection, DappV2WithCategoryNames } from 'src/dapps/types'
import DappCard from 'src/dappsExplorer/DappCard'
import { DappFeaturedActions } from 'src/dappsExplorer/DappFeaturedActions'
import DappFilterChip from 'src/dappsExplorer/DappFilterChip'
import { DappRankingsBottomSheet } from 'src/dappsExplorer/DappRankingsBottomSheet'
import FavoriteDappsSection from 'src/dappsExplorer/FavoriteDappsSection'
import NoResults from 'src/dappsExplorer/NoResults'
import { searchDappList } from 'src/dappsExplorer/searchDappList'
import useDappFavoritedToast from 'src/dappsExplorer/useDappFavoritedToast'
import useOpenDapp from 'src/dappsExplorer/useOpenDapp'
import { currentLanguageSelector } from 'src/i18n/selectors'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { styles as headerStyles } from 'src/navigator/Headers'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

const AnimatedSectionList =
  Animated.createAnimatedComponent<SectionListProps<Dapp, SectionData>>(SectionList)

interface SectionData {
  data: DappV2WithCategoryNames[]
  category: string
}

export function DAppsExplorerScreenSearchFilter() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  const sectionListRef = useRef<SectionList>(null)
  const scrollPosition = useRef(new Animated.Value(0)).current
  const horizontalScrollView = useRef<ScrollView>(null)
  const dappRankingsBottomSheetRef = useRef<BottomSheetRefType>(null)

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollPosition } } }])
  const dispatch = useDispatch()
  const loading = useSelector(dappsListLoadingSelector)
  const error = useSelector(dappsListErrorSelector)
  const categories = useSelector(dappsCategoriesAlphabeticalSelector)
  const dappsMinimalDisclaimerEnabled = useSelector(dappsMinimalDisclaimerEnabledSelector)
  const language = useSelector(currentLanguageSelector)
  const nonFavoriteDappsWithCategoryNames = useSelector(nonFavoriteDappsWithCategoryNamesSelector)
  const favoriteDappsWithCategoryNames = useSelector(favoriteDappsWithCategoryNamesSelector)
  const [selectedFilter, setSelectedFilter] = useState('all')

  // Some state lifted up from all and favorite sections
  const [searchTerm, setSearchTerm] = useState('')
  const [favoriteResultsEmpty, setFavoriteResultsEmpty] = useState(false)
  const [allResultEmpty, setAllResultEmpty] = useState(false)

  // Hide favorites when there are no favorites or no favorites matching the search term
  useEffect(() => {
    if (searchTerm === '') {
      const emptyFavorites =
        selectedFilter === 'all'
          ? favoriteDappsWithCategoryNames.length === 0
          : favoriteDappsWithCategoryNames.filter((dapp) =>
              dapp.categories.includes(selectedFilter)
            ).length === 0
      setFavoriteResultsEmpty(!!emptyFavorites)
    } else {
      const filteredFavorites =
        selectedFilter === 'all'
          ? favoriteDappsWithCategoryNames
          : favoriteDappsWithCategoryNames.filter((dapp) =>
              dapp.categories.includes(selectedFilter)
            )
      setFavoriteResultsEmpty(searchDappList(filteredFavorites, searchTerm).length === 0)
    }
  }, [favoriteDappsWithCategoryNames.length, searchTerm, selectedFilter])

  const { onSelectDapp, ConfirmOpenDappBottomSheet } = useOpenDapp()
  const { onFavoriteDapp, DappFavoritedToast } = useDappFavoritedToast(sectionListRef)

  const removeFilter = () => {
    ValoraAnalytics.track(DappExplorerEvents.dapp_filter, { id: selectedFilter, remove: true })
    setSelectedFilter('all')
    horizontalScrollView.current?.scrollTo({ x: 0, animated: true })
  }

  const filterPress = (filterId: string) => {
    selectedFilter === filterId ? setSelectedFilter('all') : setSelectedFilter(filterId)
  }

  const handleShowDappRankings = () => {
    ValoraAnalytics.track(DappExplorerEvents.dapp_rankings_open)
    dappRankingsBottomSheetRef.current?.snapToIndex(0)
  }

  useEffect(() => {
    dispatch(fetchDappsList())
    ValoraAnalytics.track(DappExplorerEvents.dapp_screen_open)
  }, [])

  const onPressDapp = (dapp: ActiveDapp, index: number) => {
    onSelectDapp(dapp, {
      position: 1 + index,
      activeFilter: selectedFilter,
      activeSearchTerm: searchTerm,
    })
  }

  const selectedFilterName = useMemo(() => {
    const selectedCategory = categories.find((category) => category.id === selectedFilter)
    return selectedCategory?.name ?? t('dappsScreen.allDapps')
  }, [selectedFilter])

  const allSectionResults: SectionData[] = useMemo(() => {
    const allResultsParsed = parseResultsIntoAll(
      nonFavoriteDappsWithCategoryNames,
      searchTerm,
      selectedFilter
    )
    setAllResultEmpty(allResultsParsed.length === 0)
    return allResultsParsed
  }, [nonFavoriteDappsWithCategoryNames, searchTerm, selectedFilter])

  const emptyListComponent = useMemo(() => {
    return (
      <>
        {allResultEmpty && favoriteResultsEmpty && (
          <Text style={styles.sectionTitle}>
            {t('dappsScreen.favoriteDappsAndAll').toLocaleUpperCase(language ?? 'en-US')}
          </Text>
        )}
        <NoResults
          filterId={selectedFilter}
          filterName={selectedFilterName}
          removeFilter={removeFilter}
          searchTerm={searchTerm}
          testID="DAppsExplorerScreen/NoResults"
        />
      </>
    )
  }, [allResultEmpty, favoriteResultsEmpty, searchTerm])

  return (
    <SafeAreaView testID="DAppsExplorerScreen" style={styles.safeAreaContainer} edges={['top']}>
      <DrawerTopBar
        rightElement={<QrScanButton testID={'DAppsExplorerScreen/QRScanButton'} />}
        middleElement={<Text style={headerStyles.headerTitle}>{t('dappsScreen.title')}</Text>}
        scrollPosition={scrollPosition}
      />

      <>
        {!loading && error && (
          <View style={styles.centerContainer}>
            <Text style={fontStyles.regular}>{t('dappsScreen.errorMessage')}</Text>
          </View>
        )}
        {categories.length && (
          <AnimatedSectionList
            refreshControl={
              <RefreshControl
                tintColor={colors.primary}
                colors={[colors.primary]}
                style={styles.refreshControl}
                refreshing={loading}
                onRefresh={() => dispatch(fetchDappsList())}
              />
            }
            // TODO: resolve type error
            // @ts-expect-error
            ref={sectionListRef}
            ListFooterComponent={
              <>
                {dappsMinimalDisclaimerEnabled ? (
                  <Text style={styles.disclaimer}>{t('dappsDisclaimerAllDapps')}</Text>
                ) : null}
              </>
            }
            ListHeaderComponent={
              <>
                <DappFeaturedActions onPressShowDappRankings={handleShowDappRankings} />
                <SearchInput
                  onChangeText={(text) => {
                    setSearchTerm(text)
                  }}
                  value={searchTerm}
                  multiline={false}
                  placeholderTextColor={colors.gray4}
                  underlineColorAndroid="transparent"
                  placeholder={t('dappsScreen.searchPlaceHolder') ?? undefined}
                  showClearButton={true}
                  allowFontScaling={false}
                />
                {/* Dapps Filtering*/}
                <View style={styles.dappFilterView}>
                  <ScrollView
                    horizontal={true}
                    // Expand the scrollview to the edges of the screen
                    style={styles.dappFilterScrollView}
                    contentContainerStyle={styles.dappsFilteringScrollViewContentContainer}
                    showsHorizontalScrollIndicator={false}
                    ref={horizontalScrollView}
                  >
                    {/* Category Filter Chips */}
                    {categories.map((category, idx) => {
                      return (
                        <DappFilterChip
                          filterId={category.id}
                          filterName={category.name}
                          isSelected={selectedFilter === category.id}
                          onPress={filterPress}
                          key={category.id}
                          style={idx === 0 ? styles.dappFilterChipFirst : undefined}
                        />
                      )
                    })}
                  </ScrollView>
                </View>
                <>
                  {/* If no matching dapps in all section and favorite section display favoriteDappsAndAll*/}
                  {!favoriteResultsEmpty && (
                    <>
                      <Text style={styles.sectionTitle}>
                        {allResultEmpty && favoriteResultsEmpty
                          ? t('dappsScreen.favoriteDappsAndAll').toLocaleUpperCase(
                              language ?? 'en-US'
                            )
                          : t('dappsScreen.favoriteDapps').toLocaleUpperCase(language ?? 'en-US')}
                      </Text>
                      <FavoriteDappsSection
                        onPressDapp={onPressDapp}
                        filterId={selectedFilter}
                        searchTerm={searchTerm}
                      />
                    </>
                  )}
                  {/* If all dapp section isn't empty or favoriteResults isn't empty display all section header */}
                  {(!allResultEmpty || !favoriteResultsEmpty) && (
                    <Text style={styles.sectionTitle}>
                      {t('dappsScreen.allDapps').toLocaleUpperCase(language ?? 'en-US')}
                    </Text>
                  )}
                </>
              </>
            }
            style={styles.sectionList}
            contentContainerStyle={[
              styles.sectionListContentContainer,
              { paddingBottom: Math.max(insets.bottom, Spacing.Regular16) },
            ]}
            // Workaround iOS setting an incorrect automatic inset at the top
            scrollIndicatorInsets={{ top: 0.01 }}
            scrollEventThrottle={16}
            onScroll={onScroll}
            sections={allSectionResults}
            renderItem={({ item: dapp, index }) => (
              <DappCard
                dapp={dapp}
                onPressDapp={() => onPressDapp({ ...dapp, openedFrom: DappSection.All }, index)}
                onFavoriteDapp={onFavoriteDapp}
              />
            )}
            keyExtractor={(dapp) => dapp.id}
            stickySectionHeadersEnabled={false}
            testID="DAppsExplorerScreen/DappsList"
            ListEmptyComponent={emptyListComponent}
            ListFooterComponentStyle={styles.listFooterComponent}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="on-drag"
          />
        )}
      </>
      {ConfirmOpenDappBottomSheet}
      {DappFavoritedToast}
      <DappRankingsBottomSheet
        forwardedRef={dappRankingsBottomSheetRef}
        onPressDapp={onPressDapp}
      />
    </SafeAreaView>
  )
}

function parseResultsIntoAll(
  nonFavoriteDapps: DappV2WithCategoryNames[],
  searchTerm: string,
  filterId: string
) {
  // Dapps in the all section are all the non favorite dapps that match the filter
  const dappsMatchingFilter =
    filterId === 'all'
      ? nonFavoriteDapps
      : nonFavoriteDapps.filter(
          (dapp: Dapp) => dapp.categories && dapp.categories.includes(filterId)
        )
  // If there are no dapps matching the filter return an empty array
  if (dappsMatchingFilter.length === 0) return []
  // If there is no search term return the dapps matching the category filter
  if (searchTerm === '') {
    return [
      {
        data: dappsMatchingFilter,
        category: 'all',
      },
    ]
  } else {
    // Score and sort the dapps matching the category filter
    const results = searchDappList(dappsMatchingFilter, searchTerm) as DappV2WithCategoryNames[]
    // If there are no dapps matching search term return an empty array
    if (results.length === 0) return []
    return [
      {
        data: results,
        category: 'all',
      },
    ]
  }
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  dappFilterView: {
    paddingTop: Spacing.Regular16,
  },
  dappFilterScrollView: {
    marginHorizontal: -Spacing.Thick24,
  },
  dappsFilteringScrollViewContentContainer: {
    paddingHorizontal: Spacing.Thick24,
  },
  dappFilterChipFirst: {
    marginLeft: 0,
  },
  sectionListContentContainer: {
    padding: Spacing.Thick24,
    flexGrow: 1,
  },
  refreshControl: {
    backgroundColor: colors.white,
  },
  sectionList: {
    flex: 1,
  },
  sectionTitle: {
    ...fontStyles.label,
    color: colors.gray4,
    marginTop: Spacing.Large32,
  },
  disclaimer: {
    ...fontStyles.xsmall,
    color: colors.gray4,
    textAlign: 'center',
    marginTop: Spacing.Large32,
    marginBottom: Spacing.Regular16,
  },
  listFooterComponent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
})

export default DAppsExplorerScreenSearchFilter

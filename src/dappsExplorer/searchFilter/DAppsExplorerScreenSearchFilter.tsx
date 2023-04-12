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
import SearchInput from 'src/components/SearchInput'
import {
  dappsCategoriesAlphabeticalSelector,
  dappsListErrorSelector,
  dappsListLoadingSelector,
  dappsMinimalDisclaimerEnabledSelector,
  nonFavoriteDappsWithCategoryNamesSelector
} from 'src/dapps/selectors'
import { fetchDappsList } from 'src/dapps/slice'
import { DappSection, DappV2, DappV2WithCategoryNames } from 'src/dapps/types'
import DappCard from 'src/dappsExplorer/DappCard'
import DappFilterChip from 'src/dappsExplorer/DappFilterChip'
import { searchDappList } from 'src/dappsExplorer/searchDappList'
import FavoriteDappsSection from 'src/dappsExplorer/searchFilter/FavoriteDappsSection'
import NoResults from 'src/dappsExplorer/searchFilter/NoResults'
import useDappFavoritedToast from 'src/dappsExplorer/useDappFavoritedToast'
import useDappInfoBottomSheet from 'src/dappsExplorer/useDappInfoBottomSheet'
import useOpenDapp from 'src/dappsExplorer/useOpenDapp'
import { currentLanguageSelector } from 'src/i18n/selectors'
import Help from 'src/icons/Help'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

const AnimatedSectionList =
  Animated.createAnimatedComponent<SectionListProps<DappV2, SectionData>>(SectionList)

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

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollPosition } } }])
  const dispatch = useDispatch()
  const loading = useSelector(dappsListLoadingSelector)
  const error = useSelector(dappsListErrorSelector)
  const categories = useSelector(dappsCategoriesAlphabeticalSelector)
  const dappsMinimalDisclaimerEnabled = useSelector(dappsMinimalDisclaimerEnabledSelector)
  const language = useSelector(currentLanguageSelector)
  const nonFavoriteDappsWithCategoryNames = useSelector(nonFavoriteDappsWithCategoryNamesSelector)
  const [selectedFilter, setSelectedFilter] = useState('all')

  // Some state lifted up from all and favorite sections
  const [searchTerm, setSearchTerm] = useState('')
  const [favoriteResultsEmpty, setFavoriteResultsEmpty] = useState(false)
  const [allResultEmpty, setAllResultEmpty] = useState(false)

  const { onSelectDapp, ConfirmOpenDappBottomSheet } = useOpenDapp()
  const { onFavoriteDapp, DappFavoritedToast } = useDappFavoritedToast(sectionListRef)
  const { openSheet, DappInfoBottomSheet } = useDappInfoBottomSheet()

  const removeFilter = () => {
    ValoraAnalytics.track(DappExplorerEvents.dapp_filter, { id: selectedFilter, remove: true })
    setSelectedFilter('all')
    horizontalScrollView.current?.scrollTo({ x: 0, animated: true })
  }

  const filterPress = (filterId: string) => {
    selectedFilter === filterId ? setSelectedFilter('all') : setSelectedFilter(filterId)
  }

  useEffect(() => {
    dispatch(fetchDappsList())
    ValoraAnalytics.track(DappExplorerEvents.dapp_screen_open)
  }, [])

  const selectedFilterName = useMemo(() => {
    const selectedCategory = categories.find((category) => category.id === selectedFilter)
    return selectedCategory?.name ?? t('dappsScreen.allDapps')
  }, [selectedFilter])

  const allSectionResults: SectionData[] = useMemo(() => {
    const allResultsParsed = parseResultsIntoAll(
      nonFavoriteDappsWithCategoryNames,
      searchTerm,
      selectedFilter,
    )
    if (allResultsParsed.length === 0) {
      setAllResultEmpty(true)
    } else {
      setAllResultEmpty(false)
    }
    return allResultsParsed
  }, [nonFavoriteDappsWithCategoryNames, searchTerm, selectedFilter])

  const emptyListComponent = useMemo(() => {
    if (allResultEmpty && favoriteResultsEmpty) return null
    return (
      <NoResults
        filterId={selectedFilter}
        filterName={selectedFilterName}
        removeFilter={removeFilter}
        searchTerm={searchTerm}
        testID="DAppsExplorerScreenSearchFilter/NoResults"
      />
    )
  }, [allResultEmpty, favoriteResultsEmpty, searchTerm])

  return (
    <SafeAreaView
      testID="DAppsExplorerScreenSearchFilter"
      style={styles.safeAreaContainer}
      edges={['top']}
    >
      <DrawerTopBar
        rightElement={
          <TopBarIconButton
            testID="DAppsExplorerScreenSearchFilter/HelpIcon"
            icon={<Help color={colors.onboardingGreen} />}
            onPress={openSheet}
          />
        }
        scrollPosition={scrollPosition}
      />
      {ConfirmOpenDappBottomSheet}
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
                tintColor={colors.greenBrand}
                colors={[colors.greenBrand]}
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
                <DescriptionView
                  title={t('dappsScreen.title')}
                  message={t('dappsScreen.message')}
                />
                <SearchInput
                  onChangeText={(text) => {
                    setSearchTerm(text)
                  }}
                  value={searchTerm}
                  multiline={false}
                  placeholderTextColor={colors.gray4}
                  underlineColorAndroid="transparent"
                  placeholder={t('dappsScreen.searchPlaceHolder')}
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
                    bounces={false}
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
                  {allResultEmpty && favoriteResultsEmpty ? (
                    <Text style={styles.sectionTitle}>
                      {t('dappsScreen.favoriteDappsAndAll').toLocaleUpperCase(language ?? 'en-US')}
                    </Text>
                  ) : (
                    <Text style={styles.sectionTitle}>
                      {t('dappsScreen.favoriteDapps').toLocaleUpperCase(language ?? 'en-US')}
                    </Text>
                  )}
                  <FavoriteDappsSection
                    onPressDapp={onSelectDapp}
                    filterId={selectedFilter}
                    filterName={selectedFilterName}
                    removeFilter={removeFilter}
                    searchTerm={searchTerm}
                    onShowSearchResult={setFavoriteResultsEmpty}
                  />
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
            renderItem={({ item: dapp }) => (
              <DappCard
                dapp={dapp}
                section={DappSection.All}
                onPressDapp={onSelectDapp}
                onFavoriteDapp={onFavoriteDapp}
              />
            )}
            keyExtractor={(dapp) => dapp.id}
            stickySectionHeadersEnabled={false}
            testID="DAppsExplorerScreenSearchFilter/DappsList"
            ListEmptyComponent={emptyListComponent}
            ListFooterComponentStyle={styles.listFooterComponent}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="on-drag"
          />
        )}
      </>
      {DappFavoritedToast}
      {DappInfoBottomSheet}
    </SafeAreaView>
  )
}

function DescriptionView({ message, title }: { message: string; title: string }) {
  return (
    <View style={styles.descriptionView}>
      <Text style={styles.pageHeaderText}>{title}</Text>
      <Text style={styles.pageHeaderSubText}>{message}</Text>
    </View>
  )
}

function parseResultsIntoAll(
  nonFavoriteDapps: DappV2WithCategoryNames[],
  searchTerm: string,
  filterId: string,
) {
  // Dapps in the all section are all the non favorite dapps that match the filter
  const dappsMatchingFilter =
    filterId === 'all'
      ? nonFavoriteDapps
      : nonFavoriteDapps.filter(
        (dapp: DappV2) =>
          dapp.categories &&
          dapp.categories.includes(filterId)
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
    backgroundColor: colors.light,
  },
  sectionList: {
    flex: 1,
  },
  sectionTitle: {
    ...fontStyles.label,
    color: colors.gray4,
    marginTop: Spacing.Large32,
  },
  pageHeaderText: {
    ...fontStyles.h1,
  },
  pageHeaderSubText: {
    ...fontStyles.regular,
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
  descriptionView: {
    paddingBottom: Spacing.Regular16,
  },
})

export default DAppsExplorerScreenSearchFilter

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshControl, SectionList, SectionListProps, StyleSheet, Text, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import Animated from 'react-native-reanimated'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { DappExplorerEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { BottomSheetRefType } from 'src/components/BottomSheet'
import FilterChipsCarousel, { FilterChip } from 'src/components/FilterChipsCarousel'
import QrScanButton from 'src/components/QrScanButton'
import SearchInput from 'src/components/SearchInput'
import {
  dappsCategoriesAlphabeticalSelector,
  dappsListErrorSelector,
  dappsListLoadingSelector,
  favoriteDappsWithCategoryNamesSelector,
  nonFavoriteDappsWithCategoryNamesSelector,
} from 'src/dapps/selectors'
import { fetchDappsList } from 'src/dapps/slice'
import { ActiveDapp, Dapp, DappSection, DappWithCategoryNames } from 'src/dapps/types'
import DappCard from 'src/dappsExplorer/DappCard'
import { DappFeaturedActions } from 'src/dappsExplorer/DappFeaturedActions'
import { DappRankingsBottomSheet } from 'src/dappsExplorer/DappRankingsBottomSheet'
import NoResults from 'src/dappsExplorer/NoResults'
import { searchDappList } from 'src/dappsExplorer/searchDappList'
import useDappFavoritedToast from 'src/dappsExplorer/useDappFavoritedToast'
import useOpenDapp from 'src/dappsExplorer/useOpenDapp'
import { currentLanguageSelector } from 'src/i18n/selectors'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { styles as headerStyles } from 'src/navigator/Headers'
import { useDispatch, useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

const AnimatedSectionList =
  Animated.createAnimatedComponent<SectionListProps<Dapp, SectionData>>(SectionList)

interface SectionData {
  data: DappWithCategoryNames[]
  sectionName: string
  dappSection: DappSection
  testID: string
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
  const language = useSelector(currentLanguageSelector)
  const nonFavoriteDappsWithCategoryNames = useSelector(nonFavoriteDappsWithCategoryNamesSelector)
  const favoriteDappsWithCategoryNames = useSelector(favoriteDappsWithCategoryNamesSelector)

  const [filterChips, setFilterChips] = useState<FilterChip<DappWithCategoryNames>[]>(() =>
    categories.map((category) => ({
      id: category.id,
      name: category.name,
      filterFn: (dapp: DappWithCategoryNames) => dapp.categories.includes(category.id),
      isSelected: false,
    }))
  )
  const selectedFilter = useMemo(
    () => filterChips.find((filter) => filter.isSelected),
    [filterChips]
  )

  const [searchTerm, setSearchTerm] = useState('')

  const { onSelectDapp } = useOpenDapp()
  const { onFavoriteDapp, DappFavoritedToast } = useDappFavoritedToast(sectionListRef)

  const removeFilter = (filter: FilterChip<DappWithCategoryNames>) => {
    ValoraAnalytics.track(DappExplorerEvents.dapp_filter, {
      filterId: filter.id,
      remove: true,
    })
    setFilterChips((prev) => prev.map((filter) => ({ ...filter, isSelected: false })))
    horizontalScrollView.current?.scrollTo({ x: 0, animated: true })
  }

  const handleToggleFilterChip = (filter: FilterChip<DappWithCategoryNames>) => {
    ValoraAnalytics.track(DappExplorerEvents.dapp_filter, {
      filterId: filter.id,
      remove: selectedFilter?.id === filter.id,
    })

    setFilterChips((prev) =>
      prev.map((prevFilter) => {
        return {
          ...prevFilter,
          isSelected: prevFilter.id === filter.id ? !prevFilter.isSelected : false,
        }
      })
    )
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
      activeFilter: selectedFilter?.id ?? 'all',
      activeSearchTerm: searchTerm,
    })
  }

  const sections: SectionData[] = useMemo(() => {
    const dappsMatchingFilter = selectedFilter
      ? nonFavoriteDappsWithCategoryNames.filter((dapp) => selectedFilter.filterFn(dapp))
      : nonFavoriteDappsWithCategoryNames
    const dappsMatchingFilterAndSearch = searchTerm
      ? searchDappList(dappsMatchingFilter, searchTerm)
      : dappsMatchingFilter

    const favouriteDappsMatchingFilter = selectedFilter
      ? favoriteDappsWithCategoryNames.filter((dapp) => selectedFilter.filterFn(dapp))
      : favoriteDappsWithCategoryNames
    const favouriteDappsMatchingFilterAndSearch = searchTerm
      ? searchDappList(favouriteDappsMatchingFilter, searchTerm)
      : favouriteDappsMatchingFilter

    const noMatchingResults =
      dappsMatchingFilterAndSearch.length === 0 &&
      favouriteDappsMatchingFilterAndSearch.length === 0

    return [
      ...(favouriteDappsMatchingFilterAndSearch.length > 0
        ? [
            {
              data: favouriteDappsMatchingFilterAndSearch,
              sectionName: t('dappsScreen.favoriteDapps').toLocaleUpperCase(language ?? 'en-US'),
              dappSection: DappSection.FavoritesDappScreen,
              testID: 'DAppsExplorerScreen/FavoritesSection',
            },
          ]
        : []),
      {
        data: dappsMatchingFilterAndSearch,
        sectionName: (noMatchingResults
          ? t('dappsScreen.favoriteDappsAndAll')
          : t('dappsScreen.allDapps')
        ).toLocaleUpperCase(language ?? 'en-US'),
        dappSection: DappSection.All,
        testID: 'DAppsExplorerScreen/AllSection',
      },
    ]
  }, [
    nonFavoriteDappsWithCategoryNames,
    favoriteDappsWithCategoryNames,
    searchTerm,
    selectedFilter,
  ])

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
              <Text style={styles.disclaimer}>{t('dappsDisclaimerAllDapps')}</Text>
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
                <FilterChipsCarousel
                  chips={filterChips}
                  onSelectChip={handleToggleFilterChip}
                  primaryColor={colors.infoDark}
                  secondaryColor={colors.infoLight}
                  style={styles.dappFilterView}
                  forwardedRef={horizontalScrollView}
                />
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
            sections={sections}
            renderItem={({ item: dapp, index, section }) => {
              return (
                <DappCard
                  dapp={dapp}
                  onPressDapp={() =>
                    onPressDapp({ ...dapp, openedFrom: section.dappSection }, index)
                  }
                  onFavoriteDapp={onFavoriteDapp}
                  testID={`${section.testID}/DappCard`}
                />
              )
            }}
            renderSectionFooter={({ section }) => {
              if (section.data.length === 0) {
                return (
                  <NoResults
                    selectedFilter={selectedFilter}
                    removeFilter={removeFilter}
                    searchTerm={searchTerm}
                    testID={`${section.testID}/NoResults`}
                  />
                )
              }

              return null
            }}
            renderSectionHeader={({ section: { sectionName, testID } }) => {
              return (
                <Text testID={`${testID}/Title`} style={styles.sectionTitle}>
                  {sectionName}
                </Text>
              )
            }}
            keyExtractor={(dapp) => dapp.id}
            stickySectionHeadersEnabled={false}
            testID="DAppsExplorerScreen/DappsList"
            ListFooterComponentStyle={styles.listFooterComponent}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="on-drag"
          />
        )}
      </>
      {DappFavoritedToast}
      <DappRankingsBottomSheet
        forwardedRef={dappRankingsBottomSheetRef}
        onPressDapp={onPressDapp}
      />
    </SafeAreaView>
  )
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

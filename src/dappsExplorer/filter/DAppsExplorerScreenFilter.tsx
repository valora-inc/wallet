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
import {
  dappFavoritesEnabledSelector,
  dappsCategoriesAlphabeticalSelector,
  dappsListErrorSelector,
  dappsListLoadingSelector,
  dappsMinimalDisclaimerEnabledSelector,
  dappsV2ListSelector,
  favoriteDappIdsSelector,
} from 'src/dapps/selectors'
import { fetchDappsList } from 'src/dapps/slice'
import { DappSection, DappV1, DappV2 } from 'src/dapps/types'
import DappCard from 'src/dappsExplorer/DappCard'
import DappFilterChip from 'src/dappsExplorer/DappFilterChip'
import FavoriteDappsSection from 'src/dappsExplorer/filter/FavoriteDappsSection'
import { NoResults } from 'src/dappsExplorer/filter/NoResults'
import useDappFavoritedToast from 'src/dappsExplorer/useDappFavoritedToast'
import useDappInfoBottomSheet from 'src/dappsExplorer/useDappInfoBottomSheet'
import useOpenDapp from 'src/dappsExplorer/useOpenDapp'
import { currentLanguageSelector } from 'src/i18n/selectors'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import HeaderButtons from 'src/dappsExplorer/HeaderButtons'

const AnimatedSectionList =
  Animated.createAnimatedComponent<SectionListProps<DappV2, SectionData>>(SectionList)

interface SectionData {
  data: DappV2[]
  category: string
}

export function DAppsExplorerScreenFilter() {
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
  const dappFavoritesEnabled = useSelector(dappFavoritesEnabledSelector)
  const dappsMinimalDisclaimerEnabled = useSelector(dappsMinimalDisclaimerEnabledSelector)
  const dappList = useSelector(dappsV2ListSelector)
  const language = useSelector(currentLanguageSelector)
  const favoriteDappsById = useSelector(favoriteDappIdsSelector)
  const [selectedFilter, setSelectedFilter] = useState('all')

  const selectedFilterName = useMemo(() => {
    const selectedCategory = categories.find((category) => category.id === selectedFilter)
    return selectedCategory?.name ?? t('dappsScreen.allDapps')
  }, [selectedFilter])

  const { onSelectDapp, ConfirmOpenDappBottomSheet } = useOpenDapp()
  const { onFavoriteDapp, DappFavoritedToast } = useDappFavoritedToast(sectionListRef)
  const { openSheet, DappInfoBottomSheet } = useDappInfoBottomSheet()

  useEffect(() => {
    dispatch(fetchDappsList())
    ValoraAnalytics.track(DappExplorerEvents.dapp_screen_open)
  }, [])

  const removeFilter = () => {
    ValoraAnalytics.track(DappExplorerEvents.dapp_filter, { id: selectedFilter, remove: true })
    setSelectedFilter('all')
    horizontalScrollView.current?.scrollTo({ x: 0, animated: true })
  }

  const filterPress = (filterId: string) => {
    selectedFilter === filterId ? setSelectedFilter('all') : setSelectedFilter(filterId)
  }

  return (
    <SafeAreaView
      testID="DAppsExplorerScreenFilter"
      style={styles.safeAreaContainer}
      edges={['top']}
    >
      <DrawerTopBar
        rightElement={
          <HeaderButtons
            onPressHelp={openSheet}
            helpIconColor={colors.onboardingGreen}
            testID={'DAppsExplorerScreenFilter/HeaderButtons'}
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
            // @ts-ignore TODO: resolve type error
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
                {dappFavoritesEnabled && (
                  <>
                    <Text style={styles.sectionTitle}>
                      {t('dappsScreen.favoriteDapps').toLocaleUpperCase(language ?? 'en-US')}
                    </Text>
                    <FavoriteDappsSection
                      filterId={selectedFilter}
                      filterName={selectedFilterName}
                      removeFilter={removeFilter}
                      onPressDapp={onSelectDapp}
                    />
                    <Text style={styles.sectionTitle}>
                      {selectedFilterName.toLocaleUpperCase(language ?? 'en-US')}
                    </Text>
                  </>
                )}
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
            sections={parseResultsIntoAll(dappList, selectedFilter, favoriteDappsById)}
            renderItem={({ item: dapp }) => (
              <DappCard
                dapp={dapp}
                section={DappSection.All}
                onPressDapp={onSelectDapp}
                onFavoriteDapp={onFavoriteDapp}
              />
            )}
            keyExtractor={(dapp: DappV1 | DappV2) => dapp.id}
            stickySectionHeadersEnabled={false}
            testID="DAppsExplorerScreenFilter/DappsList"
            ListEmptyComponent={
              <NoResults
                filterName={selectedFilterName}
                removeFilter={removeFilter}
                testID="DAppsExplorerScreenFilter"
              />
            }
            ListFooterComponentStyle={styles.ListFooterComponent}
          />
        )}
      </>

      {DappFavoritedToast}
      {DappInfoBottomSheet}
    </SafeAreaView>
  )
}

function parseResultsIntoAll(
  dappList: DappV2[],
  filterId: string,
  favoriteDappsById: string[]
): SectionData[] {
  // Prevent favorite dapps from showing up in the all dapps section
  const data =
    filterId === 'all'
      ? dappList.filter((dapp) => !favoriteDappsById.includes(dapp.id))
      : dappList.filter(
          (dapp) =>
            !favoriteDappsById.includes(dapp.id) &&
            dapp.categories &&
            dapp.categories.includes(filterId)
        )
  // Return empty array if no results
  if (data.length === 0) return []
  // Else return dapps in all section
  return [
    {
      data,
      category: filterId,
    },
  ]
}

function DescriptionView({ message, title }: { message: string; title: string }) {
  return (
    <View>
      <Text style={styles.pageHeaderText}>{title}</Text>
      <Text style={styles.pageHeaderSubText}>{message}</Text>
    </View>
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
    paddingTop: Spacing.Thick24,
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
    ...fontStyles.small,
    color: colors.gray5,
    textAlign: 'center',
    marginTop: Spacing.Large32,
    marginBottom: Spacing.Regular16,
  },
  ListFooterComponent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
})

export default DAppsExplorerScreenFilter

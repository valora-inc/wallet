import React, { useEffect, useRef, useState } from 'react'
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
import Touchable from 'src/components/Touchable'
import {
  CategoryWithDapps,
  dappFavoritesEnabledSelector,
  dappsCategoriesSelector,
  dappsListErrorSelector,
  dappsListLoadingSelector,
  dappsListSelector,
  dappsMinimalDisclaimerEnabledSelector,
  favoriteDappIdsSelector,
} from 'src/dapps/selectors'
import { fetchDappsList } from 'src/dapps/slice'
import { Dapp, DappFilter, DappSection } from 'src/dapps/types'
import DappCard from 'src/dappsExplorer/DappCard'
import FavoriteDappsSection from 'src/dappsExplorer/FavoriteDappsSection'
import { NoResults } from 'src/dappsExplorer/NoResults'
import useDappFavoritedToast from 'src/dappsExplorer/useDappFavoritedToast'
import useDappInfoBottomSheet from 'src/dappsExplorer/useDappInfoBottomSheet'
import useOpenDapp from 'src/dappsExplorer/useOpenDapp'
import Help from 'src/icons/Help'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

const AnimatedSectionList =
  Animated.createAnimatedComponent<SectionListProps<Dapp, SectionData>>(SectionList)

interface SectionData {
  data: Dapp[]
  category: CategoryWithDapps
}

interface DappFilterChip {
  chipFilter: DappFilter
  selectedFilter: DappFilter
  setFilter: (filter: DappFilter) => void
  lastChip: boolean
}

export function DAppsExplorerScreenV2() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  const sectionListRef = useRef<SectionList>(null)
  const scrollPosition = useRef(new Animated.Value(0)).current

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollPosition } } }])
  const dispatch = useDispatch()
  const loading = useSelector(dappsListLoadingSelector)
  const error = useSelector(dappsListErrorSelector)
  const categories = useSelector(dappsCategoriesSelector)
  const dappFavoritesEnabled = useSelector(dappFavoritesEnabledSelector)
  const dappsMinimalDisclaimerEnabled = useSelector(dappsMinimalDisclaimerEnabledSelector)
  const dappList = useSelector(dappsListSelector)
  const favoriteDappsById = useSelector(favoriteDappIdsSelector)
  const [selectedFilter, setSelectedFilter] = useState({
    id: 'all',
    name: t('dappsScreen.allDapps'),
  })

  const { onSelectDapp, ConfirmOpenDappBottomSheet } = useOpenDapp()
  const { onFavoriteDapp, DappFavoritedToast } = useDappFavoritedToast(sectionListRef)
  const { openSheet, DappInfoBottomSheet } = useDappInfoBottomSheet()

  // Sorted Shallow copy of categories to keep alphabetical order in multiple languages
  const sortedCategories = categories.slice(0).sort((a, b) => a.name.localeCompare(b.name))
  // TODO: exclude lend-borrow-earn category from the list

  useEffect(() => {
    dispatch(fetchDappsList())
    ValoraAnalytics.track(DappExplorerEvents.dapp_screen_open)
  }, [])

  return (
    <SafeAreaView style={styles.safeAreaContainer} edges={['top']}>
      <DrawerTopBar
        rightElement={
          <TopBarIconButton
            testID="DAppsExplorerScreen/HelpIcon"
            icon={<Help color={colors.greenUIDark} />}
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
        {sortedCategories.length && (
          <AnimatedSectionList
            refreshControl={
              <RefreshControl
                tintColor={colors.greenBrand}
                colors={[colors.greenBrand]}
                style={{ backgroundColor: colors.light }}
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
                <View style={{ paddingTop: Spacing.Thick24 }}>
                  <ScrollView
                    horizontal={true}
                    // Expand the scrollview to the edges of the screen
                    style={{ marginHorizontal: -Spacing.Thick24 }}
                    showsHorizontalScrollIndicator={false}
                    bounces={false}
                  >
                    {/* All Dapps Filter */}
                    <DappFilterChip
                      chipFilter={{ id: 'all', name: t('dappsScreen.allDapps') }}
                      selectedFilter={selectedFilter}
                      setFilter={setSelectedFilter}
                      lastChip={false}
                    />
                    {/* Category Filter Chips */}
                    {sortedCategories.map((category, idx) => {
                      return (
                        <DappFilterChip
                          chipFilter={{ id: category.id, name: category.name }}
                          selectedFilter={selectedFilter}
                          setFilter={setSelectedFilter}
                          lastChip={idx === sortedCategories.length - 1}
                        />
                      )
                    })}
                  </ScrollView>
                </View>
                {dappFavoritesEnabled && (
                  <>
                    <Text style={styles.sectionTitle}>{t('dappsScreen.favoriteDappsUpper')}</Text>
                    <FavoriteDappsSection
                      filter={selectedFilter}
                      removeFilter={() =>
                        setSelectedFilter({ id: 'all', name: t('dappsScreen.allDapps') })
                      }
                      onPressDapp={onSelectDapp}
                    />
                  </>
                )}

                {dappFavoritesEnabled && (
                  <Text style={styles.sectionTitle}>{t('dappsScreen.allDappsUpper')}</Text>
                )}
              </>
            }
            style={styles.sectionList}
            contentContainerStyle={{
              padding: Spacing.Thick24,
              paddingBottom: Math.max(insets.bottom, Spacing.Regular16),
              flexGrow: 1,
            }}
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
            keyExtractor={(dapp: Dapp) => dapp.id}
            stickySectionHeadersEnabled={false}
            testID="DAppExplorerScreenV2/DappsList"
            ListEmptyComponent={
              <NoResults
                filter={selectedFilter}
                removeFilter={() =>
                  setSelectedFilter({ id: 'all', name: t('dappsScreen.allDapps') })
                }
              />
            }
            ListFooterComponentStyle={{ flex: 1, justifyContent: 'flex-end' }}
          />
        )}
      </>

      {DappFavoritedToast}
      {DappInfoBottomSheet}
    </SafeAreaView>
  )
}

function parseResultsIntoAll(
  dappList: any,
  filter: DappFilter,
  favoriteDappsById: string[]
): SectionData[] {
  // Prevent favorite dapps from showing up in the all dapps section
  const data =
    filter.id === 'all'
      ? dappList.filter((dapp: Dapp) => !favoriteDappsById.includes(dapp.id))
      : dappList.filter(
          (dapp: Dapp) =>
            !favoriteDappsById.includes(dapp.id) &&
            dapp.categories &&
            dapp.categories.includes(filter.id)
        )
  // Return empty array if no results
  if (data.length === 0) return []
  // Else return dapps in all section
  return [
    {
      data,
      category: 'all' as unknown as CategoryWithDapps,
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

function DappFilterChip({ chipFilter, selectedFilter, setFilter, lastChip }: DappFilterChip) {
  return (
    <View
      style={[
        styles.filterChipContainer,
        // Filter chips color based on selected filter
        chipFilter.id === selectedFilter.id
          ? { backgroundColor: colors.blue }
          : { backgroundColor: colors.lightBlue },
        // First Chip has slightly different margins
        chipFilter.id === 'all'
          ? { marginLeft: Spacing.Regular16 }
          : { marginLeft: Spacing.Smallest8 },
        // Last Chip has slightly different right margin
        lastChip && { marginRight: Spacing.Regular16 },
      ]}
      testID={`DAppsExplorerScreenV2/FilterChip/${chipFilter.id}`}
    >
      <Touchable
        onPress={() => {
          setFilter(chipFilter)
        }}
        style={styles.filterChip}
      >
        <Text
          style={[
            styles.filterChipText,
            chipFilter.id === selectedFilter.id
              ? { color: colors.lightBlue }
              : { color: colors.blue },
          ]}
        >
          {chipFilter.name}
        </Text>
      </Touchable>
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
  filterChipContainer: {
    overflow: 'hidden',
    borderRadius: 94,
    flex: 1,
  },
  filterChip: {
    minHeight: 32,
    minWidth: 42,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.Regular16,
  },
  filterChipText: {
    ...fontStyles.small,
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
})

export default DAppsExplorerScreenV2

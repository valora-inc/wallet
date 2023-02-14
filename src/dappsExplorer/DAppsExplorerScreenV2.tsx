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
                    style={{ marginHorizontal: -Spacing.Thick24 }}
                    showsHorizontalScrollIndicator={false}
                    bounces={false}
                  >
                    {/* All Dapps Filter */}
                    <Touchable
                      onPress={() => {
                        setSelectedFilter({ id: 'all', name: t('dappsScreen.allDapps') })
                      }}
                      style={[
                        selectedFilter.id === 'all'
                          ? { backgroundColor: colors.blue }
                          : { backgroundColor: colors.lightBlue },
                        styles.filterChip,
                        { marginLeft: Spacing.Regular16 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedFilter.id === 'all'
                            ? { color: colors.lightBlue }
                            : { color: colors.blue },
                        ]}
                      >
                        {t('dappsScreen.allDapps')}
                      </Text>
                    </Touchable>
                    {/* Category Filter Chips */}
                    {sortedCategories.map((category, idx) => {
                      return (
                        <Touchable
                          onPress={() => {
                            setSelectedFilter({ id: category.id, name: category.name })
                          }}
                          // Inline styles for margin dependent on index and selected filter chip
                          style={[
                            idx === categories.length - 1 && { marginRight: Spacing.Regular16 },
                            selectedFilter.id === category.id
                              ? { backgroundColor: colors.blue }
                              : { backgroundColor: colors.lightBlue },
                            styles.filterChip,
                            { marginLeft: Spacing.Smallest8 },
                          ]}
                        >
                          <Text
                            style={[
                              styles.filterChipText,
                              selectedFilter.id === category.id
                                ? { color: colors.lightBlue }
                                : { color: colors.blue },
                            ]}
                          >
                            {category.name}
                          </Text>
                        </Touchable>
                      )
                    })}
                  </ScrollView>
                </View>
                {dappFavoritesEnabled && (
                  <>
                    <Text style={styles.sectionTitle}>{t('dappsScreen.favoriteDapps')}</Text>
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
                  <Text style={styles.sectionTitle}>{t('dappsScreen.allDapps')}</Text>
                )}
              </>
            }
            style={styles.sectionList}
            contentContainerStyle={{
              padding: Spacing.Thick24,
              paddingBottom: Math.max(insets.bottom, Spacing.Regular16),
            }}
            // Workaround iOS setting an incorrect automatic inset at the top
            scrollIndicatorInsets={{ top: 0.01 }}
            scrollEventThrottle={16}
            onScroll={onScroll}
            sections={parseResultsIntoAll(dappList, selectedFilter)}
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
          />
        )}
      </>

      {DappFavoritedToast}
      {DappInfoBottomSheet}
    </SafeAreaView>
  )
}

function parseResultsIntoAll(dappList: any, filter: DappFilter): SectionData[] {
  // Prevent favorite dapps from showing up in the all dapps section
  const favoriteDappsById = useSelector(favoriteDappIdsSelector)
  const data =
    filter.id === 'all'
      ? dappList.filter((dapp: Dapp) => !favoriteDappsById.includes(dapp.id))
      : dappList.filter(
          (dapp: Dapp) =>
            !favoriteDappsById.includes(dapp.id) &&
            dapp.categories &&
            dapp.categories.includes(filter.id)
        )
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

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  descriptionContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  // Padding values honor figma designs
  categoryTextContainer: {
    borderRadius: 100,
    paddingHorizontal: 11,
    paddingVertical: 4,
  },
  categoryText: {
    ...fontStyles.sectionHeader,
    fontSize: 13,
  },
  descriptionText: {
    ...fontStyles.h1,
    flex: 1,
  },
  descriptionImage: {
    height: 106,
    width: 94,
    marginLeft: Spacing.Smallest8,
  },
  filterSection: {
    marginTop: Spacing.Thick24,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 94,
    minHeight: 32,
    minWidth: 42,
    alignItems: 'center',
  },
  filterChipText: {
    ...fontStyles.extraSmall,
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

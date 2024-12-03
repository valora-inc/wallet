import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LayoutChangeEvent,
  RefreshControl,
  SectionList,
  SectionListProps,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { DappExplorerEvents } from 'src/analytics/Events'
import FilterChipsCarousel, { BooleanFilterChip } from 'src/components/FilterChipsCarousel'
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
import NoResults from 'src/dappsExplorer/NoResults'
import { searchDappList } from 'src/dappsExplorer/searchDappList'
import useDappFavoritedToast from 'src/dappsExplorer/useDappFavoritedToast'
import useOpenDapp from 'src/dappsExplorer/useOpenDapp'
import { currentLanguageSelector } from 'src/i18n/selectors'
import { Screens } from 'src/navigator/Screens'
import useScrollAwareHeader from 'src/navigator/ScrollAwareHeader'
import { StackParamList } from 'src/navigator/types'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

const AnimatedSectionList =
  Animated.createAnimatedComponent<SectionListProps<Dapp, SectionData>>(SectionList)
interface SectionData {
  data: DappWithCategoryNames[]
  sectionName: string
  dappSection: DappSection
  testID: string
}

type Props = NativeStackScreenProps<StackParamList, Screens.DappsScreen>

function DappsScreen({ navigation }: Props) {
  const { t } = useTranslation()

  const insets = useSafeAreaInsets()

  const sectionListRef = useRef<SectionList>(null)
  const horizontalScrollView = useRef<ScrollView>(null)

  const dispatch = useDispatch()
  const loading = useSelector(dappsListLoadingSelector)
  const error = useSelector(dappsListErrorSelector)
  const categories = useSelector(dappsCategoriesAlphabeticalSelector)
  const language = useSelector(currentLanguageSelector)
  const nonFavoriteDappsWithCategoryNames = useSelector(nonFavoriteDappsWithCategoryNamesSelector)
  const favoriteDappsWithCategoryNames = useSelector(favoriteDappsWithCategoryNamesSelector)

  const [filterChips, setFilterChips] = useState<BooleanFilterChip<DappWithCategoryNames>[]>(() =>
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

  const showUKCompliantVariant = getFeatureGate(StatsigFeatureGates.SHOW_UK_COMPLIANT_VARIANT)

  const removeFilter = (filter: BooleanFilterChip<DappWithCategoryNames>) => {
    AppAnalytics.track(DappExplorerEvents.dapp_filter, {
      filterId: filter.id,
      remove: true,
    })
    setFilterChips((prev) => prev.map((filter) => ({ ...filter, isSelected: false })))
    horizontalScrollView.current?.scrollTo({ x: 0, animated: true })
  }

  const handleToggleFilterChip = (filter: BooleanFilterChip<DappWithCategoryNames>) => {
    AppAnalytics.track(DappExplorerEvents.dapp_filter, {
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

  useEffect(() => {
    dispatch(fetchDappsList())
    AppAnalytics.track(DappExplorerEvents.dapp_screen_open)
  }, [])

  const onPressDapp = (dapp: ActiveDapp, index: number) => {
    onSelectDapp(dapp, {
      position: 1 + index,
      activeFilter: selectedFilter?.id ?? 'all',
      activeSearchTerm: searchTerm,
      fromScreen: Screens.DappsScreen,
    })
  }

  // Scroll Aware Header
  const scrollPosition = useSharedValue(0)
  const [titleHeight, setTitleHeight] = useState(0)

  const handleMeasureTitleHeight = (event: LayoutChangeEvent) => {
    setTitleHeight(event.nativeEvent.layout.height)
  }

  const handleScroll = useAnimatedScrollHandler((event) => {
    scrollPosition.value = event.contentOffset.y
  })

  useScrollAwareHeader({
    navigation,
    title: t('dappsScreen.exploreDapps'),
    scrollPosition,
    startFadeInPosition: titleHeight - titleHeight * 0.33,
    animationDistance: titleHeight * 0.33,
  })

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
              testID: 'DappsScreen/FavoritesSection',
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
        testID: 'DappsScreen/AllSection',
      },
    ]
  }, [
    nonFavoriteDappsWithCategoryNames,
    favoriteDappsWithCategoryNames,
    searchTerm,
    selectedFilter,
  ])

  return (
    <SafeAreaView testID="DappsScreen" style={styles.safeAreaContainer} edges={[]}>
      <>
        {!loading && !!error && (
          <View style={styles.centerContainer}>
            <Text style={typeScale.bodyMedium}>{t('dappsScreen.errorMessage')}</Text>
          </View>
        )}
        {!!categories.length && (
          <AnimatedSectionList
            refreshControl={
              <RefreshControl
                tintColor={Colors.accent}
                colors={[Colors.accent]}
                style={styles.refreshControl}
                refreshing={loading}
                onRefresh={() => dispatch(fetchDappsList())}
              />
            }
            // TODO: resolve type error
            // @ts-expect-error
            ref={sectionListRef}
            ListFooterComponent={
              <Text style={[styles.disclaimer, { textAlign: 'center' }]}>
                {t('dappsDisclaimerAllDapps')}
              </Text>
            }
            ListHeaderComponent={
              <>
                <View style={styles.titleContainer}>
                  <Text onLayout={handleMeasureTitleHeight} style={styles.title}>
                    {t('dappsScreen.exploreDapps')}
                  </Text>
                  {showUKCompliantVariant && (
                    <Text style={styles.disclaimer}>{t('dappsScreen.disclaimer_UK')}</Text>
                  )}
                </View>

                <DappFeaturedActions />
                <SearchInput
                  onChangeText={(text) => {
                    setSearchTerm(text)
                  }}
                  value={searchTerm}
                  multiline={false}
                  placeholderTextColor={Colors.gray4}
                  underlineColorAndroid="transparent"
                  placeholder={t('dappsScreen.searchPlaceHolder') ?? undefined}
                  showClearButton={true}
                  allowFontScaling={false}
                />
                <FilterChipsCarousel
                  chips={filterChips}
                  onSelectChip={handleToggleFilterChip}
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
            onScroll={handleScroll}
            sections={sections}
            renderItem={({ item: dapp, index, section }) => {
              return (
                <DappCard
                  dapp={dapp}
                  onPressDapp={() =>
                    onPressDapp({ ...dapp, openedFrom: section.dappSection }, index)
                  }
                  onFavoriteDapp={onFavoriteDapp}
                  showBorder={true}
                  testID={`${section.testID}/DappCard`}
                  cardStyle={styles.dappCard}
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
            testID="DappsScreen/DappsList"
            ListFooterComponentStyle={styles.listFooterComponent}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="on-drag"
          />
        )}
      </>
      {DappFavoritedToast}
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
    paddingTop: 0,
    flexGrow: 1,
  },
  refreshControl: {
    backgroundColor: Colors.white,
  },
  sectionList: {
    flex: 1,
  },
  sectionTitle: {
    ...typeScale.labelSemiBoldSmall,
    color: Colors.gray4,
    marginTop: Spacing.Large32,
  },
  disclaimer: {
    ...typeScale.bodyXSmall,
    color: Colors.gray4,
  },
  listFooterComponent: {
    marginTop: Spacing.Large32,
    marginBottom: Spacing.Regular16,
  },
  title: {
    ...typeScale.titleMedium,
    color: Colors.black,
  },
  titleContainer: {
    marginBottom: Spacing.Thick24,
    gap: Spacing.Tiny4,
  },
  dappCard: {
    marginTop: Spacing.Regular16,
  },
})

export default DappsScreen

import { debounce } from 'lodash'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshControl, SectionList, SectionListProps, StyleSheet, Text, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { DappExplorerEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import SearchInput from 'src/components/SearchInput'
import {
  dappFavoritesEnabledSelector,
  dappListWithCategoryNamesSelector,
  dappsCategoriesAlphabeticalSelector,
  dappsListErrorSelector,
  dappsListLoadingSelector,
  dappsListSelector,
  dappsMinimalDisclaimerEnabledSelector,
  favoriteDappIdsSelector,
} from 'src/dapps/selectors'
import { fetchDappsList } from 'src/dapps/slice'
import { DappSection, DappV2, DappV2WithCategoryNames } from 'src/dapps/types'
import DappCard from 'src/dappsExplorer/DappCard'
import FavoriteDappsSection from 'src/dappsExplorer/search/FavoriteDappsSection'
import NoResultsSearch from 'src/dappsExplorer/search/NoResults'
import useDappFavoritedToast from 'src/dappsExplorer/useDappFavoritedToast'
import useDappInfoBottomSheet from 'src/dappsExplorer/useDappInfoBottomSheet'
import useOpenDapp from 'src/dappsExplorer/useOpenDapp'
import { calculateSearchScore } from 'src/dappsExplorer/utils'
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

export function DAppsExplorerScreenSearch() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  const sectionListRef = useRef<SectionList>(null)
  const scrollPosition = useRef(new Animated.Value(0)).current

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollPosition } } }])
  const dispatch = useDispatch()
  const loading = useSelector(dappsListLoadingSelector)
  const error = useSelector(dappsListErrorSelector)
  const categories = useSelector(dappsCategoriesAlphabeticalSelector)
  const dappFavoritesEnabled = useSelector(dappFavoritesEnabledSelector)
  const dappsMinimalDisclaimerEnabled = useSelector(dappsMinimalDisclaimerEnabledSelector)
  const dappList = useSelector(dappsListSelector)
  const dappListWithCategoryNames = useSelector(dappListWithCategoryNamesSelector)
  const language = useSelector(currentLanguageSelector)
  const favoriteDappsById = useSelector(favoriteDappIdsSelector)

  // Some state lifted up from all and favorite sections
  const [searchTerm, setSearchTerm] = useState('')
  const [favoriteResultsEmpty, setFavoriteResultsEmpty] = useState(false)
  const [allResultEmpty, setAllResultEmpty] = useState(false)

  const { onSelectDapp, ConfirmOpenDappBottomSheet } = useOpenDapp()
  const { onFavoriteDapp, DappFavoritedToast } = useDappFavoritedToast(sectionListRef)
  const { openSheet, DappInfoBottomSheet } = useDappInfoBottomSheet()

  // Search term debounced to minimize incomplete searches in analytics events
  const debounceSearch = useCallback(
    debounce((searchTerm: string) => {
      if (searchTerm) {
        ValoraAnalytics.track(DappExplorerEvents.dapp_search, {
          searchTerm,
        })
      }
    }, 1000),
    []
  )

  useEffect(() => {
    dispatch(fetchDappsList())
    ValoraAnalytics.track(DappExplorerEvents.dapp_screen_open)
  }, [])

  const allSectionResults: SectionData[] = React.useMemo(() => {
    const allResultsParsed = parseResultsIntoAll(
      dappListWithCategoryNames,
      searchTerm,
      favoriteDappsById
    )
    if (allResultsParsed.length === 0) {
      setAllResultEmpty(true)
    } else {
      setAllResultEmpty(false)
    }
    return allResultsParsed
  }, [dappList, searchTerm, favoriteDappsById])

  const emptyListComponent = React.useMemo(() => {
    if (allResultEmpty && favoriteResultsEmpty) return null
    return <NoResultsSearch searchTerm={searchTerm} testID="DAppsExplorerScreenSearch" />
  }, [allResultEmpty, favoriteResultsEmpty])

  return (
    <SafeAreaView
      testID="DAppsExplorerScreenSearch"
      style={styles.safeAreaContainer}
      edges={['top']}
    >
      <DrawerTopBar
        rightElement={
          <TopBarIconButton
            testID="DAppsExplorerScreenSearch/HelpIcon"
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
                <SearchInput
                  onChangeText={(text) => {
                    setSearchTerm(text)
                    debounceSearch(text)
                  }}
                  value={searchTerm}
                  multiline={false}
                  placeholderTextColor={colors.gray4}
                  underlineColorAndroid="transparent"
                  placeholder={t('dappsScreen.searchPlaceHolder')}
                  showClearButton={true}
                  allowFontScaling={false}
                />
                {dappFavoritesEnabled && (
                  <>
                    {/* If no matching dapps in all section and favorite section display favoriteDappsAndAll*/}
                    {allResultEmpty && favoriteResultsEmpty ? (
                      <Text style={styles.sectionTitle}>
                        {t('dappsScreen.favoriteDappsAndAll').toLocaleUpperCase(
                          language ?? 'en-US'
                        )}
                      </Text>
                    ) : (
                      <Text style={styles.sectionTitle}>
                        {t('dappsScreen.favoriteDapps').toLocaleUpperCase(language ?? 'en-US')}
                      </Text>
                    )}
                    <FavoriteDappsSection
                      onPressDapp={onSelectDapp}
                      searchTerm={searchTerm}
                      setFavoriteResultsEmpty={setFavoriteResultsEmpty}
                    />
                    {/* If all dapp section isn't empty or favoriteResults isn't empty display add section header */}
                    {(!allResultEmpty || !favoriteResultsEmpty) && (
                      <Text style={styles.sectionTitle}>
                        {t('dappsScreen.allDapps').toLocaleUpperCase(language ?? 'en-US')}
                      </Text>
                    )}
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
            testID="DAppsExplorerScreenSearch/DappsList"
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
  dappList: DappV2WithCategoryNames[],
  searchTerm: string,
  favoriteDappsById: string[]
) {
  // If there is no search query, return the non favorite dapps in the all section
  const nonFavoriteDapps = dappList.filter((dapp) => !favoriteDappsById.includes(dapp.id))
  if (searchTerm === '') {
    return [
      {
        data: nonFavoriteDapps,
        category: 'all',
      },
    ]
  }

  // Filter out dapps that don't match the search query
  const nonFavoriteDappsMatchingSearch = nonFavoriteDapps.filter((dapp) =>
    calculateSearchScore(dapp, searchTerm)
  )

  // If there are no dapps matching the search query, return an empty array to be handled by section list
  if (nonFavoriteDappsMatchingSearch.length === 0) return []

  // Sort these dapps by their search score - could be faster with counting sort
  nonFavoriteDappsMatchingSearch.sort(
    (a, b) => calculateSearchScore(b, searchTerm) - calculateSearchScore(a, searchTerm)
  )

  // Otherwise, return the dapps matching the search query ordered descending by their search score
  return [
    {
      data: nonFavoriteDappsMatchingSearch,
      category: 'all',
    },
  ]
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
    color: colors.gray5,
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

export default DAppsExplorerScreenSearch

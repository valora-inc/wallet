import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Image,
  RefreshControl,
  SectionList,
  SectionListData,
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
  CategoryWithDapps,
  dappCategoriesSelector,
  dappFavoritesEnabledSelector,
  dappsListErrorSelector,
  dappsListLoadingSelector,
  dappsMinimalDisclaimerEnabledSelector,
  featuredDappSelector,
} from 'src/dapps/selectors'
import { fetchDappsList } from 'src/dapps/slice'
import { DappSection, DappV1, isDappV2 } from 'src/dapps/types'
import DappCard from 'src/dappsExplorer/DappCard'
import FavoriteDappsSection from 'src/dappsExplorer/FavoriteDappsSectionLegacy'
import FeaturedDappCard from 'src/dappsExplorer/FeaturedDappCard'
import useDappFavoritedToast from 'src/dappsExplorer/useDappFavoritedToast'
import useDappInfoBottomSheet from 'src/dappsExplorer/useDappInfoBottomSheet'
import useOpenDapp from 'src/dappsExplorer/useOpenDapp'
import Help from 'src/icons/Help'
import { dappListLogo } from 'src/images/Images'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { styles as headerStyles } from 'src/navigator/Headers'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

const AnimatedSectionList =
  Animated.createAnimatedComponent<SectionListProps<DappV1, SectionData>>(SectionList)

const SECTION_HEADER_MARGIN_TOP = 32

interface SectionData {
  data: DappV1[]
  category: CategoryWithDapps
}

export function DAppsExplorerScreenLegacy() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  const sectionListRef = useRef<SectionList>(null)
  const scrollPosition = useRef(new Animated.Value(0)).current

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollPosition } } }])
  const dispatch = useDispatch()
  const featuredDapp = useSelector(featuredDappSelector)
  const loading = useSelector(dappsListLoadingSelector)
  const error = useSelector(dappsListErrorSelector)
  const categories = useSelector(dappCategoriesSelector)
  const dappFavoritesEnabled = useSelector(dappFavoritesEnabledSelector)
  const dappsMinimalDisclaimerEnabled = useSelector(dappsMinimalDisclaimerEnabledSelector)

  const { onSelectDapp, ConfirmOpenDappBottomSheet } = useOpenDapp()
  const { onFavoriteDapp, DappFavoritedToast } = useDappFavoritedToast(sectionListRef)
  const { openSheet, DappInfoBottomSheet } = useDappInfoBottomSheet()

  useEffect(() => {
    dispatch(fetchDappsList())
    ValoraAnalytics.track(DappExplorerEvents.dapp_screen_open)
  }, [])

  useEffect(() => {
    // Type guard to ensure that the featured dapp is a DappV1
    if (featuredDapp && !isDappV2(featuredDapp)) {
      ValoraAnalytics.track(DappExplorerEvents.dapp_impression, {
        categoryId: featuredDapp.categoryId,
        dappId: featuredDapp.id,
        dappName: featuredDapp.name,
        section: DappSection.Featured,
      })
    }
  }, [featuredDapp])

  return (
    <SafeAreaView
      testID="DAppsExplorerScreenLegacy"
      style={styles.safeAreaContainer}
      edges={['top']}
    >
      <DrawerTopBar
        middleElement={<Text style={headerStyles.headerTitle}>{t('dappsScreen.title')}</Text>}
        rightElement={
          <TopBarIconButton
            testID="DAppsExplorerScreenLegacy/HelpIcon"
            icon={<Help />}
            onPress={openSheet}
          />
        }
        scrollPosition={scrollPosition}
      />
      {ConfirmOpenDappBottomSheet}

      <>
        {!loading && !categories && error && (
          <View style={styles.centerContainer}>
            <Text style={fontStyles.regular}>{t('dappsScreen.errorMessage')}</Text>
          </View>
        )}
        {categories && (
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
                <DescriptionView message={t('dappsScreen.message')} />
                {featuredDapp && (
                  <>
                    <Text style={styles.sectionTitle}>{t('dappsScreen.featuredDapp')}</Text>
                    <FeaturedDappCard dapp={featuredDapp} onPressDapp={onSelectDapp} />
                  </>
                )}

                {dappFavoritesEnabled && (
                  <>
                    <Text style={styles.sectionTitle}>{t('dappsScreen.favoriteDapps')}</Text>
                    <FavoriteDappsSection onPressDapp={onSelectDapp} />
                  </>
                )}

                {(featuredDapp || dappFavoritesEnabled) && (
                  <Text style={styles.sectionTitle}>{t('dappsScreen.allDapps')}</Text>
                )}
              </>
            }
            style={styles.sectionList}
            contentContainerStyle={[
              styles.sectionListContentContainer,
              { paddingBottom: Math.max(insets.bottom, Spacing.Regular16) }
            ]}
            // Workaround iOS setting an incorrect automatic inset at the top
            scrollIndicatorInsets={{ top: 0.01 }}
            scrollEventThrottle={16}
            onScroll={onScroll}
            sections={parseResultIntoSections(categories)}
            renderItem={({ item: dapp }) => (
              <DappCard
                dapp={dapp}
                section={DappSection.All}
                onPressDapp={onSelectDapp}
                onFavoriteDapp={onFavoriteDapp}
              />
            )}
            keyExtractor={(dapp: DappV1) => `${dapp.categoryId}-${dapp.id}`}
            stickySectionHeadersEnabled={false}
            renderSectionHeader={({
              section,
            }: {
              section: SectionListData<DappV1, SectionData>
            }) => <CategoryHeader category={section.category} />}
            testID="DAppsExplorerScreenLegacy/DappsList"
          />
        )}
      </>

      {DappFavoritedToast}
      {DappInfoBottomSheet}
    </SafeAreaView>
  )
}

function parseResultIntoSections(categoriesWithDapps: CategoryWithDapps[]): SectionData[] {
  // @ts-expect-error should only be used with DappV1
  return categoriesWithDapps.map((category) => ({
    data: category.dapps,
    category: category,
  }))
}

function DescriptionView({ message }: { message: string }) {
  return (
    <View style={styles.descriptionContainer}>
      <Text style={styles.descriptionText}>{message}</Text>
      <View style={styles.descriptionImage}>
        <Image source={dappListLogo} resizeMode="contain" />
      </View>
    </View>
  )
}

function CategoryHeader({ category }: { category: CategoryWithDapps }) {
  return (
    <View style={styles.categoryContainer}>
      <View style={[styles.categoryTextContainer, { backgroundColor: category.backgroundColor }]}>
        <Text style={[styles.categoryText, { color: category.fontColor }]}>{category.name}</Text>
      </View>
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
  categoryContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    flex: 1,
    flexDirection: 'column',
    marginTop: SECTION_HEADER_MARGIN_TOP,
  },
  sectionListContentContainer: {
    padding: Spacing.Thick24,
  },
  refreshControl: {
    backgroundColor: colors.light,
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
  sectionList: {
    flex: 1,
  },
  sectionTitle: {
    ...fontStyles.label,
    color: colors.gray4,
    marginTop: Spacing.Large32,
  },
  disclaimer: {
    ...fontStyles.small,
    color: colors.gray5,
    textAlign: 'center',
    marginTop: Spacing.Large32,
    marginBottom: Spacing.Regular16,
  },
})

export default DAppsExplorerScreenLegacy

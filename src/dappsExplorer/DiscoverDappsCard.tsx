import React, { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionList, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DappExplorerEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import TextButton from 'src/components/TextButton'
import { favoriteDappsSelector, mostPopularDappsSelector } from 'src/dapps/selectors'
import { fetchDappsList } from 'src/dapps/slice'
import { ActiveDapp, Dapp, DappSection } from 'src/dapps/types'
import DappCard from 'src/dappsExplorer/DappCard'
import useOpenDapp from 'src/dappsExplorer/useOpenDapp'
import { currentLanguageSelector } from 'src/i18n/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface SectionData {
  data: Dapp[]
  sectionName: string
  dappSection: DappSection
  testID: string
}

const MAX_DAPPS = 5

function DiscoverDappsCard() {
  const { t } = useTranslation()

  const insets = useSafeAreaInsets()

  const sectionListRef = useRef<SectionList>(null)

  const language = useSelector(currentLanguageSelector)
  const dispatch = useDispatch()
  const favoriteDapps = useSelector(favoriteDappsSelector)
  const mostPopularDapps = useSelector(mostPopularDappsSelector)

  const { onSelectDapp } = useOpenDapp()

  useEffect(() => {
    dispatch(fetchDappsList())
    ValoraAnalytics.track(DappExplorerEvents.dapp_screen_open)
  }, [])

  const onPressDapp = (dapp: ActiveDapp, index: number) => {
    onSelectDapp(dapp, {
      position: 1 + index,
      fromScreen: Screens.TabDiscover,
    })
  }

  const sections: SectionData[] = useMemo(() => {
    const favoriteDappIds = favoriteDapps.map((dapp) => dapp.id)
    let mostPopularSection: SectionData[] = []
    if (favoriteDapps.length <= 2) {
      mostPopularSection = [
        {
          data: mostPopularDapps
            .filter((dapp) => !favoriteDappIds.includes(dapp.id))
            .slice(0, MAX_DAPPS - favoriteDapps.length),
          sectionName: t('dappsScreen.mostPopularDapps'),
          dappSection: DappSection.MostPopular,
          testID: 'DiscoverDappsCard/MostPopularSection',
        },
      ]
    }
    const favoritesSection =
      favoriteDapps.length > 0
        ? [
            {
              data: favoriteDapps.slice(0, MAX_DAPPS),
              sectionName: t('dappsScreen.favoriteDapps'),
              dappSection: DappSection.FavoritesDappScreen,
              testID: 'DiscoverDappsCard/FavoritesSection',
            },
          ]
        : []

    return [...favoritesSection, ...mostPopularSection]
  }, [favoriteDapps, mostPopularDapps])

  const onPressExploreAll = () => {
    ValoraAnalytics.track(DappExplorerEvents.dapp_explore_all)
    navigate(Screens.DappsScreen)
  }

  if (!sections.length) return null

  return (
    <View testID="DiscoverDappsCard" style={styles.container}>
      <SectionList
        ref={sectionListRef}
        scrollEnabled={false}
        ListHeaderComponent={<Text style={styles.title}>{t('dappsScreen.exploreDapps')}</Text>}
        ListFooterComponent={
          <TextButton style={styles.footer} onPress={onPressExploreAll}>
            {t('dappsScreen.exploreAll')}
          </TextButton>
        }
        sections={sections}
        renderItem={({ item: dapp, index, section }) => {
          return (
            <DappCard
              dapp={dapp}
              onPressDapp={() => onPressDapp({ ...dapp, openedFrom: section.dappSection }, index)}
              testID={`${section.testID}/DappCard`}
              cardContentContainerStyle={styles.dappCardContentContainer}
            />
          )
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
        testID="DAppsExplorerScreen/DiscoverDappsCard"
        ListFooterComponentStyle={styles.listFooterComponent}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.Regular16,
    borderColor: Colors.gray2,
    borderWidth: 1,
    borderRadius: Spacing.Smallest8,
  },
  sectionTitle: {
    ...typeScale.labelXSmall,
    color: Colors.gray4,
    marginTop: Spacing.Smallest8,
  },
  listFooterComponent: {
    flex: 1,
    alignSelf: 'center',
  },
  footer: {
    ...typeScale.labelSemiBoldXSmall,
    flex: 1,
    color: Colors.primary,
  },
  title: {
    ...typeScale.labelSemiBoldMedium,
    color: Colors.black,
    marginBottom: Spacing.Smallest8,
  },
  dappCardContentContainer: {
    padding: 0,
    paddingVertical: Spacing.Regular16,
  },
})

export default DiscoverDappsCard

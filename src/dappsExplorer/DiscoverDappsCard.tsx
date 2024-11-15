import React, { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionList, StyleSheet, Text, View } from 'react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { DappExplorerEvents } from 'src/analytics/Events'
import Touchable from 'src/components/Touchable'
import { favoriteDappsSelector, mostPopularDappsSelector } from 'src/dapps/selectors'
import { fetchDappsList } from 'src/dapps/slice'
import { ActiveDapp, Dapp, DappSection } from 'src/dapps/types'
import DappCard from 'src/dappsExplorer/DappCard'
import useOpenDapp from 'src/dappsExplorer/useOpenDapp'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import Colors from 'src/styles/colors'
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

  const sectionListRef = useRef<SectionList>(null)

  const dispatch = useDispatch()
  const favoriteDapps = useSelector(favoriteDappsSelector)
  const mostPopularDapps = useSelector(mostPopularDappsSelector)

  const { onSelectDapp } = useOpenDapp()

  const showUKCompliantVariant = getFeatureGate(StatsigFeatureGates.SHOW_UK_COMPLIANT_VARIANT)

  useEffect(() => {
    dispatch(fetchDappsList())
    AppAnalytics.track(DappExplorerEvents.dapp_screen_open)
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
          sectionName: t('dappsScreen.mostPopularDapps', {
            context: showUKCompliantVariant ? 'UK' : '',
          }),
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
    AppAnalytics.track(DappExplorerEvents.dapp_explore_all)
    navigate(Screens.DappsScreen)
  }

  if (!sections.length) return null

  return (
    <Touchable onPress={onPressExploreAll} borderRadius={8} shouldRenderRippleAbove>
      <View testID="DiscoverDappsCard" style={styles.container}>
        <SectionList
          ref={sectionListRef}
          scrollEnabled={false}
          ListHeaderComponent={
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{t('dappsScreen.exploreDapps')}</Text>
              {showUKCompliantVariant && (
                <Text style={styles.disclaimer}>{t('dappsScreen.disclaimer_UK')}</Text>
              )}
            </View>
          }
          ListFooterComponent={
            <View>
              <Text style={styles.footer}>{t('dappsScreen.exploreAll')}</Text>
            </View>
          }
          sections={sections}
          renderItem={({ item: dapp, index, section }) => {
            return (
              <DappCard
                dapp={dapp}
                onPressDapp={() => onPressDapp({ ...dapp, openedFrom: section.dappSection }, index)}
                disableFavoriting={true}
                testID={`${section.testID}/DappCard`}
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
    </Touchable>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.Regular16,
    borderColor: Colors.gray2,
    borderWidth: 1,
    borderRadius: 8,
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
    color: Colors.accent,
  },
  title: {
    ...typeScale.labelSemiBoldMedium,
    color: Colors.black,
  },
  titleContainer: {
    marginBottom: Spacing.Smallest8,
    gap: Spacing.Tiny4,
  },
  disclaimer: {
    ...typeScale.bodyXSmall,
    color: Colors.gray3,
  },
})

export default DiscoverDappsCard

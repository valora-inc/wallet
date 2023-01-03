import { debounce, range } from 'lodash'
import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSelector } from 'react-redux'
import { DappExplorerEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Card from 'src/components/Card'
import Touchable from 'src/components/Touchable'
import {
  dappFavoritesEnabledSelector,
  favoriteDappsSelector,
  maxNumRecentDappsSelector,
  recentDappsSelector,
} from 'src/dapps/selectors'
import { ActiveDapp, DappSection } from 'src/dapps/types'
import ArrowRight from 'src/icons/ArrowRight'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Shadow, Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'

interface Props {
  onSelectDapp(dapp: ActiveDapp): void
}

const DAPP_ICON_SIZE = 32
const DAPP_WIDTH = 104
const SCROLL_DEBOUNCE_TIME = 300 // milliseconds
const windowWidth = Dimensions.get('window').width

const useDappsCarouselDapps = () => {
  const { t } = useTranslation()
  const maxNumRecentDapps = useSelector(maxNumRecentDappsSelector)
  const dappFavoritesEnabled = useSelector(dappFavoritesEnabledSelector)
  const recentlyUsedDapps = useSelector(recentDappsSelector)
  const favoritedDapps = useSelector(favoriteDappsSelector)

  if (dappFavoritesEnabled && favoritedDapps.length > 0) {
    return {
      dapps: favoritedDapps,
      section: DappSection.FavoritesHomeScreen,
      title: t('favoritedDapps'),
      testID: 'FavoritedDapps',
    }
  }

  if (maxNumRecentDapps > 0 && recentlyUsedDapps.length > 0) {
    return {
      dapps: recentlyUsedDapps,
      section: DappSection.RecentlyUsed,
      title: t('recentlyUsedDapps'),
      testID: 'RecentlyUsedDapps',
    }
  }

  return {
    dapps: [],
    // the following values don't matter since nothing will be rendered
    section: DappSection.All,
    title: '',
    testID: '',
  }
}

function DappsCarousel({ onSelectDapp }: Props) {
  const { t } = useTranslation()

  const { dapps, section, title, testID } = useDappsCarouselDapps()

  const lastViewedDapp = useRef(-1)

  useEffect(() => {
    if (dapps.length > 0) {
      trackDappsImpressionForScrollPosition(0)
    }
  }, [])

  const trackDappsImpressionForScrollPosition = debounce((horizontalContentOffset: number) => {
    const numDappsVisible = Math.min(
      Math.floor((windowWidth + horizontalContentOffset) / DAPP_WIDTH),
      dapps.length
    )

    if (numDappsVisible > lastViewedDapp.current + 1) {
      // ensure single analytics event for each dapp impression, so that
      // duplicate events are not sent if user scrolls back to the beginning
      range(lastViewedDapp.current + 1, numDappsVisible).forEach((dappIndex) => {
        const dapp = dapps[dappIndex]
        ValoraAnalytics.track(DappExplorerEvents.dapp_impression, {
          categoryId: dapp.categoryId,
          dappId: dapp.id,
          dappName: dapp.name,
          horizontalPosition: dappIndex,
          section,
        })
      })

      lastViewedDapp.current = numDappsVisible - 1
    }
  }, SCROLL_DEBOUNCE_TIME)

  const onPressAllDapps = () => {
    ValoraAnalytics.track(DappExplorerEvents.dapp_view_all, { section })
    navigate(Screens.DAppsExplorerScreen)
  }

  const handleScroll = (event: { nativeEvent: NativeScrollEvent }) => {
    trackDappsImpressionForScrollPosition(event.nativeEvent.contentOffset.x)
  }

  if (!dapps.length) {
    return null
  }

  return (
    <View style={styles.body} testID={`${testID}/Container`}>
      <Text style={styles.title}>{title}</Text>

      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContainer}
        testID={`${testID}/ScrollContainer`}
        onScroll={handleScroll}
        scrollEventThrottle={50}
      >
        {dapps.map((dapp) => (
          <Card style={styles.card} rounded={true} shadow={Shadow.SoftLight} key={dapp.id}>
            <Touchable
              onPress={() => onSelectDapp({ ...dapp, openedFrom: section })}
              style={styles.touchable}
              testID={`${testID}/Dapp`}
            >
              <>
                <Image
                  source={{ uri: dapp.iconUrl }}
                  style={styles.icon}
                  resizeMode="cover"
                  testID={`${testID}/Icon`}
                />
                <Text
                  style={styles.dappName}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  testID="RecentDapp-name"
                >
                  {dapp.name}
                </Text>
              </>
            </Touchable>
          </Card>
        ))}

        <Card style={[styles.card, { marginRight: 0 }]} rounded={true} shadow={Shadow.SoftLight}>
          <Touchable style={styles.touchable} onPress={onPressAllDapps}>
            <>
              <View style={[styles.icon, styles.viewAllIcon]}>
                <ArrowRight />
              </View>
              <Text style={styles.dappName} numberOfLines={1} ellipsizeMode="tail">
                {t('allDapps')}
              </Text>
            </>
          </Touchable>
        </Card>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  body: {
    maxWidth: variables.width,
    width: variables.width,
    paddingTop: Spacing.Regular16,
    paddingBottom: Spacing.Smallest8,
  },
  carouselContainer: {
    padding: Spacing.Regular16,
  },
  title: {
    ...fontStyles.sectionHeader,
    color: Colors.gray4,
    paddingHorizontal: Spacing.Regular16,
  },
  card: {
    width: DAPP_WIDTH,
    marginRight: Spacing.Regular16,
    padding: 0,
  },
  touchable: {
    alignItems: 'center',
    padding: Spacing.Regular16,
  },
  dappName: {
    ...fontStyles.small,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
  },
  icon: {
    height: DAPP_ICON_SIZE,
    width: DAPP_ICON_SIZE,
    borderRadius: 100,
    marginBottom: Spacing.Smallest8,
  },
  viewAllIcon: {
    backgroundColor: Colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default DappsCarousel

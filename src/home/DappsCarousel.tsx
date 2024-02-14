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
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'

interface Props {
  onSelectDapp(dapp: ActiveDapp): void
}

const DAPP_ICON_SIZE = 32
const DAPP_WIDTH = 88
const SCROLL_DEBOUNCE_TIME = 300 // milliseconds
const windowWidth = Dimensions.get('window').width

const useDappsCarouselDapps = () => {
  const { t } = useTranslation()
  const recentlyUsedDapps = useSelector(recentDappsSelector)
  const favoritedDapps = useSelector(favoriteDappsSelector)

  if (favoritedDapps.length > 0) {
    return {
      dapps: favoritedDapps,
      section: DappSection.FavoritesHomeScreen,
      title: t('favoritedDapps'),
      testID: 'FavoritedDapps',
    }
  }

  if (recentlyUsedDapps.length > 0) {
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
  const maxNumDisplayedDapps = useSelector(maxNumRecentDappsSelector)
  const { dapps, section, title, testID } = useDappsCarouselDapps()

  const lastViewedDapp = useRef(-1)

  const shouldShowCarousel = maxNumDisplayedDapps > 0 && dapps.length > 0

  useEffect(() => {
    if (shouldShowCarousel) {
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
        const eventProperties = {
          categories: dapp.categories,
          dappId: dapp.id,
          dappName: dapp.name,
          horizontalPosition: dappIndex,
          section,
        }
        ValoraAnalytics.track(DappExplorerEvents.dapp_impression, eventProperties)
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

  if (!shouldShowCarousel) {
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
        {dapps.slice(0, maxNumDisplayedDapps).map((dapp) => (
          <Card style={styles.card} rounded={true} shadow={null} key={dapp.id}>
            <Touchable
              onPress={() => onSelectDapp({ ...dapp, openedFrom: section })}
              style={styles.touchable}
              testID={`${testID}/Dapp`}
              borderRadius={8}
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
                  testID={`${testID}/Name`}
                >
                  {dapp.name}
                </Text>
              </>
            </Touchable>
          </Card>
        ))}

        <Card style={[styles.card, { marginRight: 0 }]} rounded={true} shadow={null}>
          <Touchable style={styles.touchable} borderRadius={8} onPress={onPressAllDapps}>
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
    paddingVertical: Spacing.Regular16,
    paddingHorizontal: Spacing.Smallest8,
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
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default DappsCarousel

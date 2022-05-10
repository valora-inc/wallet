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
import { DappExplorerEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ActiveDapp, DappSection } from 'src/app/reducers'
import { recentDappsSelector } from 'src/app/selectors'
import Touchable from 'src/components/Touchable'
import ProgressArrow from 'src/icons/ProgressArrow'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import useSelector from 'src/redux/useSelector'
import { Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'

interface Props {
  onSelectDapp(dapp: ActiveDapp): void
}

const DAPP_ICON_SIZE = 68
const DAPP_WIDTH = 100
const SCROLL_DEBOUNCE_TIME = 300 // milliseconds
const windowWidth = Dimensions.get('window').width

function RecentlyUsedDapps({ onSelectDapp }: Props) {
  const recentlyUsedDapps = useSelector(recentDappsSelector)
  const { t } = useTranslation()

  const lastViewedDapp = useRef(-1)

  useEffect(() => {
    if (recentlyUsedDapps.length) {
      trackDappsImpressionForScrollPosition(0)
    }
  }, [])

  const trackDappsImpressionForScrollPosition = debounce((horizontalContentOffset: number) => {
    const numDappsVisible = Math.min(
      Math.floor((windowWidth + horizontalContentOffset) / DAPP_WIDTH),
      recentlyUsedDapps.length
    )

    if (numDappsVisible > lastViewedDapp.current + 1) {
      // ensure single analytics event for each dapp impression, so that
      // duplicate events are not sent if user scrolls back to the beginning
      range(lastViewedDapp.current + 1, numDappsVisible).forEach((dappIndex) => {
        const dapp = recentlyUsedDapps[dappIndex]
        ValoraAnalytics.track(DappExplorerEvents.dapp_impression, {
          categoryId: dapp.categoryId,
          dappId: dapp.id,
          dappName: dapp.name,
          horizontalPosition: dappIndex,
          section: DappSection.RecentlyUsed,
        })
      })

      lastViewedDapp.current = numDappsVisible - 1
    }
  }, SCROLL_DEBOUNCE_TIME)

  const onPressAllDapps = () => {
    ValoraAnalytics.track(DappExplorerEvents.dapp_view_all)
    navigate(Screens.DAppsExplorerScreen)
  }

  const handleScroll = (event: { nativeEvent: NativeScrollEvent }) => {
    trackDappsImpressionForScrollPosition(event.nativeEvent.contentOffset.x)
  }

  if (!recentlyUsedDapps.length) {
    return null
  }

  return (
    <View style={styles.body} testID="RecentlyUsedDappsContainer">
      <View style={[styles.titleContainer, styles.row]}>
        <Text style={styles.title}>{t('recentlyUsedDapps')}</Text>
        <Touchable style={styles.row} onPress={onPressAllDapps} testID="AllDapps">
          <>
            <Text style={styles.allDapps}>{t('allDapps')}</Text>
            <ProgressArrow color={Colors.greenUI} />
          </>
        </Touchable>
      </View>

      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        testID="RecentlyUsedDapps/ScrollContainer"
        onScroll={handleScroll}
        scrollEventThrottle={50}
      >
        {recentlyUsedDapps.map((recentlyUsedDapp) => (
          <Touchable
            key={recentlyUsedDapp.id}
            onPress={() =>
              onSelectDapp({ ...recentlyUsedDapp, openedFrom: DappSection.RecentlyUsed })
            }
            style={styles.dappContainer}
            testID="RecentDapp"
          >
            <>
              <Image
                source={{ uri: recentlyUsedDapp.iconUrl }}
                style={styles.icon}
                resizeMode="cover"
                testID="RecentDapp-icon"
              />
              <Text style={styles.dappName} numberOfLines={1} ellipsizeMode="tail">
                {recentlyUsedDapp.name}
              </Text>
            </>
          </Touchable>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  body: {
    maxWidth: variables.width,
    width: variables.width,
    paddingTop: Spacing.Regular16,
    paddingBottom: Spacing.Thick24,
  },
  titleContainer: {
    paddingHorizontal: Spacing.Regular16,
    paddingBottom: Spacing.Regular16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...fontStyles.sectionHeader,
    color: Colors.gray4,
  },
  allDapps: {
    ...fontStyles.label,
    color: Colors.greenUI,
    marginRight: Spacing.Smallest8,
  },
  dappContainer: {
    alignItems: 'center',
    width: DAPP_WIDTH,
  },
  dappName: {
    ...fontStyles.small,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
    maxWidth: DAPP_ICON_SIZE,
  },
  icon: {
    height: DAPP_ICON_SIZE,
    width: DAPP_ICON_SIZE,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.gray2,
    marginBottom: Spacing.Small12,
  },
})

export default RecentlyUsedDapps

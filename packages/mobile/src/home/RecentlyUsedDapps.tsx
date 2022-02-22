import { Colors } from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { Spacing } from '@celo/react-components/styles/styles'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Image,
  NativeScrollEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { recentDappsSelector } from 'src/app/selectors'
import ProgressArrow from 'src/icons/ProgressArrow'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import useSelector from 'src/redux/useSelector'

function RecentlyUsedDapps() {
  const recentlyUsedDapps = useSelector(recentDappsSelector)
  const [currentIndex, setCurrentIndex] = useState(0)
  const { t } = useTranslation()

  const handleScroll = (event: { nativeEvent: NativeScrollEvent }) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / variables.width)
    if (nextIndex === currentIndex) {
      return
    }

    setCurrentIndex(nextIndex)
  }

  const onPressAllDapps = () => {
    navigate(Screens.DAppsExplorerScreen)
  }

  if (!recentlyUsedDapps.length) {
    return null
  }

  return (
    <View style={styles.body}>
      <View style={[styles.titleContainer, styles.row]}>
        <Text style={styles.title}>{t('recentlyUsedDapps')}</Text>
        <TouchableOpacity style={styles.row} onPress={onPressAllDapps} testID="AllDapps">
          <Text style={styles.allDapps}>{t('allDapps')}</Text>
          <ProgressArrow height={10} color={Colors.greenUI} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        testID="RecentlyUsedDapps/ScrollContainer"
      >
        {recentlyUsedDapps.map((recentlyUsedDapp, index) => (
          <View key={recentlyUsedDapp.id} style={styles.dappContainer}>
            <View style={[styles.dappLogoContainer, index === 0 ? { marginLeft: 0 } : undefined]}>
              <Image
                source={{ uri: recentlyUsedDapp.iconUrl }}
                style={styles.icon}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.dappName} numberOfLines={1} ellipsizeMode="tail">
              {recentlyUsedDapp.name}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const DAPP_LOGO_SIZE = 44

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
  arrow: {
    paddingLeft: Spacing.Smallest8,
  },
  dappContainer: {
    alignItems: 'center',
    marginHorizontal: Spacing.Small12,
  },
  dappLogoContainer: {
    padding: Spacing.Small12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.gray2,
    marginBottom: Spacing.Small12,
  },
  dappName: {
    ...fontStyles.small,
    textAlign: 'center',
  },
  icon: {
    height: DAPP_LOGO_SIZE,
    width: DAPP_LOGO_SIZE,
  },
})

export default RecentlyUsedDapps

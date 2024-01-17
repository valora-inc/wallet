import React, { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import QrScanButton from 'src/components/QrScanButton'
import NotificationBell from 'src/home/NotificationBell'
import Trophy from 'src/icons/browse/exploreDapps/Trophy'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

export function BrowseScreen() {
  const { t } = useTranslation()
  const scrollPosition = useRef(new Animated.Value(0)).current
  const showNotificationCenter = getFeatureGate(StatsigFeatureGates.SHOW_NOTIFICATION_CENTER)

  const topRightElements = (
    <View style={styles.topRightElementsContainer}>
      <QrScanButton testID={'WalletHome/QRScanButton'} style={styles.topRightElement} />
      {showNotificationCenter && (
        <NotificationBell testID={'WalletHome/NotificationBell'} style={styles.topRightElement} />
      )}
    </View>
  )

  const ExploreDappsSection = () => {
    return (
      <View testID={`BrowseScreen/ExploreDappsSection`} style={styles.exploreDappsSection}>
        <Trophy />
        <View style={styles.exploreDappsHeader}>
          <Text style={styles.exploreDappsTitle}>{t('browseScreen.exploreDappsTitle')}</Text>
          <Text style={styles.exploreDappsSubtitle}>{t('browseScreen.exploreDappsSubtitle')}</Text>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView testID="BrowseScreen" style={styles.safeAreaContainer} edges={['top']}>
      <DrawerTopBar scrollPosition={scrollPosition} rightElement={topRightElements} />

      <Text style={styles.title}>{t('browseScreen.title')}</Text>
      <ExploreDappsSection />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  topRightElementsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topRightElement: {
    marginLeft: Spacing.Regular16,
  },
  title: {
    ...typeScale.titleMedium,
    margin: Spacing.Regular16,
  },
  exploreDappsSection: {
    padding: Spacing.Regular16,
    margin: Spacing.Regular16,
    borderWidth: 1,
    borderColor: colors.gray2,
    borderRadius: Spacing.Small12,
    alignItems: 'center',
  },
  exploreDappsHeader: {
    marginHorizontal: Spacing.Large32,
    rowGap: Spacing.Tiny4,
  },
  exploreDappsTitle: {
    ...typeScale.labelSemiBoldMedium,
    color: colors.black,
    textAlign: 'center',
  },
  exploreDappsSubtitle: {
    ...typeScale.bodyXSmall,
    color: colors.gray4,
    textAlign: 'center',
  },
})

export default BrowseScreen

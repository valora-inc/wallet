import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native'
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import { DappFeaturedActions } from 'src/dappsExplorer/DappFeaturedActions'
import DiscoverDappsCard from 'src/dappsExplorer/DiscoverDappsCard'
import EarnActivePools from 'src/earn/EarnActivePools'
import EarnEntrypoint from 'src/earn/EarnEntrypoint'
import { Screens } from 'src/navigator/Screens'
import useScrollAwareHeader from 'src/navigator/ScrollAwareHeader'
import { StackParamList } from 'src/navigator/types'
import PointsDiscoverCard from 'src/points/PointsDiscoverCard'
import { earnPositionsSelector } from 'src/positions/selectors'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

type Props = NativeStackScreenProps<StackParamList, Screens.TabDiscover>

function TabDiscover({ navigation }: Props) {
  const { t } = useTranslation()

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
    title: t('bottomTabsNavigator.discover.title'),
    scrollPosition,
    startFadeInPosition: titleHeight * 0.67,
    animationDistance: titleHeight * 0.33,
  })

  const pools = useSelector(earnPositionsSelector)
  const poolsSupplied = useMemo(
    () => pools.filter((pool) => new BigNumber(pool.balance).gt(0)).length,
    [pools]
  )

  return (
    <Animated.ScrollView
      testID="DiscoverScrollView"
      scrollEventThrottle={16}
      onScroll={handleScroll}
    >
      <SafeAreaView testID="DAppsExplorerScreen" style={styles.safeAreaContainer} edges={[]}>
        <View style={styles.contentContainer}>
          <Text style={styles.title} onLayout={handleMeasureTitleHeight}>
            {t('bottomTabsNavigator.discover.title')}
          </Text>
          <DappFeaturedActions />
          <PointsDiscoverCard />
          {poolsSupplied > 0 ? <EarnActivePools /> : <EarnEntrypoint />}
          <DiscoverDappsCard />
        </View>
      </SafeAreaView>
    </Animated.ScrollView>
  )
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.Thick24,
    paddingBottom: Spacing.Thick24,
  },
  title: {
    ...typeScale.titleMedium,
    color: Colors.black,
    paddingVertical: Spacing.Thick24,
  },
})

export default TabDiscover

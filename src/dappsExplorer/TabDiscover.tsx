import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { useSharedValue } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { DappExplorerEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { BottomSheetRefType } from 'src/components/BottomSheet'
import { DappFeaturedActions } from 'src/dappsExplorer/DappFeaturedActions'
import { EarnCardDiscover } from 'src/earn/EarnCard'
import { Screens } from 'src/navigator/Screens'
import useScrollAwareHeader from 'src/navigator/ScrollAwareHeader'
import { StackParamList } from 'src/navigator/types'
import PointsDiscoverCard from 'src/points/PointsDiscoverCard'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import networkConfig from 'src/web3/networkConfig'
import DiscoverDappsCard from 'src/dappsExplorer/DiscoverDappsCard'

type Props = NativeStackScreenProps<StackParamList, Screens.TabDiscover>

function TabDiscover({ navigation }: Props) {
  const { t } = useTranslation()

  const dappRankingsBottomSheetRef = useRef<BottomSheetRefType>(null)

  const handleShowDappRankings = () => {
    ValoraAnalytics.track(DappExplorerEvents.dapp_rankings_open)
    dappRankingsBottomSheetRef.current?.snapToIndex(0)
  }

  // Scroll Aware Header
  const scrollPosition = useSharedValue(0)
  const [titleHeight] = useState(0)

  useScrollAwareHeader({
    navigation,
    title: t('bottomTabsNavigator.discover.title'),
    scrollPosition,
    startFadeInPosition: titleHeight - titleHeight * 0.33,
    animationDistance: titleHeight * 0.33,
  })

  return (
    <ScrollView testID={'DappsExplorerScrollView'}>
      <SafeAreaView testID="DAppsExplorerScreen" style={styles.safeAreaContainer} edges={[]}>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>{t('bottomTabsNavigator.discover.title')}</Text>
          <DappFeaturedActions onPressShowDappRankings={handleShowDappRankings} />
          <PointsDiscoverCard />
          <EarnCardDiscover
            poolTokenId={networkConfig.aaveArbUsdcTokenId}
            depositTokenId={networkConfig.arbUsdcTokenId}
          />
          <DiscoverDappsCard />
        </View>
      </SafeAreaView>
    </ScrollView>
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

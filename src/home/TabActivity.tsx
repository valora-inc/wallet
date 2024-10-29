import { NativeStackScreenProps } from '@react-navigation/native-stack'
import _ from 'lodash'
import React, { useEffect } from 'react'
import { RefreshControl, RefreshControlProps, SectionList } from 'react-native'
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppState } from 'src/app/actions'
import { appStateSelector } from 'src/app/selectors'
import { refreshAllBalances } from 'src/home/actions'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { useDispatch, useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'
import TransactionFeed from 'src/transactions/feed/TransactionFeed'

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList)

type Props = NativeStackScreenProps<StackParamList, Screens.TabActivity>

function TabActivity(_props: Props) {
  const appState = useSelector(appStateSelector)
  const isLoading = useSelector((state) => state.home.loading)

  const insets = useSafeAreaInsets()

  const dispatch = useDispatch()

  // Scroll Aware Header
  const scrollPosition = useSharedValue(0)

  const handleScroll = useAnimatedScrollHandler((event) => {
    scrollPosition.value = event.contentOffset.y
  })

  useEffect(() => {
    if (appState === AppState.Active) {
      dispatch(refreshAllBalances())
    }
  }, [])

  const onRefresh = async () => {
    dispatch(refreshAllBalances())
  }

  const keyExtractor = (_item: any, index: number) => {
    return index.toString()
  }

  const refresh: React.ReactElement<RefreshControlProps> = (
    <RefreshControl refreshing={isLoading} onRefresh={onRefresh} colors={[colors.primary]} />
  ) as React.ReactElement<RefreshControlProps>

  const transactionFeedSection = {
    data: [{}],
    renderItem: () => <TransactionFeed key={'TransactionList'} />,
  }

  const sections = [transactionFeedSection]

  return (
    <SafeAreaView testID="WalletHome" edges={[]}>
      <AnimatedSectionList
        // Workaround iOS setting an incorrect automatic inset at the top
        scrollIndicatorInsets={{ top: 0.01 }}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        refreshControl={refresh}
        onRefresh={onRefresh}
        refreshing={isLoading}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
        sections={sections}
        keyExtractor={keyExtractor}
        testID="WalletHome/SectionList"
      />
    </SafeAreaView>
  )
}

export default TabActivity

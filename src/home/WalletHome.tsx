import { useIsFocused } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import _ from 'lodash'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LayoutChangeEvent,
  RefreshControl,
  RefreshControlProps,
  SectionList,
  StyleSheet,
  Text,
} from 'react-native'
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { showMessage } from 'src/alert/actions'
import { AppState } from 'src/app/actions'
import {
  appStateSelector,
  phoneNumberVerifiedSelector,
  showNotificationSpotlightSelector,
} from 'src/app/selectors'
import { ALERT_BANNER_DURATION, DEFAULT_TESTNET, SHOW_TESTNET_BANNER } from 'src/config'
import ActionsCarousel from 'src/home/ActionsCarousel'
import NotificationBox from 'src/home/NotificationBox'
import { refreshAllBalances, visitHome } from 'src/home/actions'
import NftCelebration from 'src/home/celebration/NftCelebration'
import NftReward from 'src/home/celebration/NftReward'
import { showNftCelebrationSelector, showNftRewardSelector } from 'src/home/selectors'
import { importContacts } from 'src/identity/actions'
import { Screens } from 'src/navigator/Screens'
import useScrollAwareHeader from 'src/navigator/ScrollAwareHeader'
import { StackParamList } from 'src/navigator/types'
import { trackPointsEvent } from 'src/points/slice'
import { phoneRecipientCacheSelector } from 'src/recipients/reducer'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { initializeSentryUserContext } from 'src/sentry/actions'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import TransactionFeed from 'src/transactions/feed/TransactionFeed'
import { hasGrantedContactsPermission } from 'src/utils/contacts'

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList)

type Props = NativeStackScreenProps<StackParamList, Screens.TabHome>

function WalletHome({ navigation }: Props) {
  const { t } = useTranslation()

  const appState = useSelector(appStateSelector)
  const isLoading = useSelector((state) => state.home.loading)
  const recipientCache = useSelector(phoneRecipientCacheSelector)
  const isNumberVerified = useSelector(phoneNumberVerifiedSelector)
  const showNotificationSpotlight = useSelector(showNotificationSpotlightSelector)

  const insets = useSafeAreaInsets()

  const dispatch = useDispatch()

  const isFocused = useIsFocused()
  const canShowNftCelebration = useSelector(showNftCelebrationSelector)
  const showNftCelebration = canShowNftCelebration && isFocused && !showNotificationSpotlight
  const canShowNftReward = useSelector(showNftRewardSelector)
  const showNftReward = canShowNftReward && isFocused && !showNotificationSpotlight

  useEffect(() => {
    dispatch(visitHome())
  }, [])

  const showTestnetBanner = () => {
    dispatch(
      showMessage(
        t('testnetAlert.1', { testnet: _.startCase(DEFAULT_TESTNET) }),
        ALERT_BANNER_DURATION,
        null,
        null,
        t('testnetAlert.0', { testnet: _.startCase(DEFAULT_TESTNET) })
      )
    )
  }

  // Scroll Aware Header
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
    title: t('bottomTabsNavigator.home.title'),
    scrollPosition,
    startFadeInPosition: titleHeight - titleHeight * 0.33,
    animationDistance: titleHeight * 0.33,
  })

  const tryImportContacts = async () => {
    // Skip if contacts have already been imported or the user hasn't verified their phone number.
    if (Object.keys(recipientCache).length || !isNumberVerified) {
      return
    }

    const contactPermissionStatusGranted = await hasGrantedContactsPermission()
    if (contactPermissionStatusGranted) {
      dispatch(importContacts())
    }
  }

  useEffect(() => {
    // TODO find a better home for this, its unrelated to wallet home
    dispatch(initializeSentryUserContext())
    if (SHOW_TESTNET_BANNER) {
      showTestnetBanner()
    }

    // Waiting 1/2 sec before triggering to allow
    // rest of feed to load unencumbered
    setTimeout(tryImportContacts, 500)

    dispatch(trackPointsEvent({ activityId: 'create-wallet' }))
  }, [])

  useEffect(() => {
    if (appState === AppState.Active) {
      dispatch(refreshAllBalances())
    }
  }, [appState])

  const onRefresh = async () => {
    dispatch(refreshAllBalances())
  }

  const keyExtractor = (_item: any, index: number) => {
    return index.toString()
  }

  const refresh: React.ReactElement<RefreshControlProps> = (
    <RefreshControl refreshing={isLoading} onRefresh={onRefresh} colors={[colors.primary]} />
  ) as React.ReactElement<RefreshControlProps>

  const homeTabTitleSection = {
    data: [{}],
    renderItem: () => (
      <Text onLayout={handleMeasureTitleHeight} style={styles.homeTabTitle}>
        {t('bottomTabsNavigator.home.title')}
      </Text>
    ),
  }

  const notificationBoxSection = {
    data: [{}],
    renderItem: () => (
      <NotificationBox
        key={'NotificationBox'}
        // Only show high priority notifications marked for the home screen
        showOnlyHomeScreenNotifications={true}
      />
    ),
  }
  const actionsCarouselSection = {
    data: [{}],
    renderItem: () => <ActionsCarousel key={'ActionsCarousel'} />,
  }

  const transactionFeedSection = {
    data: [{}],
    renderItem: () => <TransactionFeed key={'TransactionList'} />,
  }

  const sections = [
    homeTabTitleSection,
    actionsCarouselSection,
    notificationBoxSection,
    transactionFeedSection,
  ]

  return (
    <SafeAreaView testID="WalletHome" style={styles.container} edges={[]}>
      <AnimatedSectionList
        // Workaround iOS setting an incorrect automatic inset at the top
        scrollIndicatorInsets={{ top: 0.01 }}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        refreshControl={refresh}
        onRefresh={onRefresh}
        refreshing={isLoading}
        style={styles.container}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
        sections={sections}
        keyExtractor={keyExtractor}
        testID="WalletHome/SectionList"
      />
      {showNftCelebration && <NftCelebration />}
      {showNftReward && <NftReward />}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  homeTabTitle: {
    ...typeScale.titleMedium,
    color: colors.black,
    marginHorizontal: Spacing.Regular16,
    marginTop: Spacing.Regular16,
    marginBottom: Spacing.Large32,
  },
})

export default WalletHome

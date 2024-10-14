import { useIsFocused } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import _ from 'lodash'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, RefreshControl, RefreshControlProps, StyleSheet } from 'react-native'
import Animated from 'react-native-reanimated'
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
import { StackParamList } from 'src/navigator/types'
import { phoneRecipientCacheSelector } from 'src/recipients/reducer'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { initializeSentryUserContext } from 'src/sentry/actions'
import colors from 'src/styles/colors'
import TransactionFeedV2 from 'src/transactions/feed/TransactionFeedV2'
import { hasGrantedContactsPermission } from 'src/utils/contacts'

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)

type Props = NativeStackScreenProps<StackParamList, Screens.TabHome>

function TabHome(_props: Props) {
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

  const flatListSections = [
    {
      key: 'ActionsCarousel',
      component: <ActionsCarousel />,
    },
    {
      key: 'NotificationBox',
      component: <NotificationBox showOnlyHomeScreenNotifications={true} />,
    },
    { key: 'TransactionFeed', component: <TransactionFeedV2 /> },
  ]

  const renderItem = ({ item }: { item: any }) => item.component

  return (
    <SafeAreaView testID="WalletHome" style={styles.container} edges={[]}>
      <AnimatedFlatList
        // Workaround iOS setting an incorrect automatic inset at the top
        scrollIndicatorInsets={{ top: 0.01 }}
        scrollEventThrottle={16}
        refreshControl={refresh}
        onRefresh={onRefresh}
        refreshing={isLoading}
        style={styles.container}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
        data={flatListSections}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        testID="WalletHome/FlatList"
        // To remove the sticky header entirely remove stickyHeaderIndices & stickyHeaderHiddenOnScroll
        stickyHeaderIndices={[0]}
        stickyHeaderHiddenOnScroll={true}
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
})

export default TabHome

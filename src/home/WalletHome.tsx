import _ from 'lodash'
import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshControl, RefreshControlProps, SectionList, StyleSheet, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { showMessage } from 'src/alert/actions'
import { AppState } from 'src/app/actions'
import {
  appStateSelector,
  phoneNumberVerifiedSelector,
  showNotificationSpotlightSelector,
} from 'src/app/selectors'
import BetaTag from 'src/components/BetaTag'
import QrScanButton from 'src/components/QrScanButton'
import { HomeTokenBalance } from 'src/components/TokenBalance'
import {
  ALERT_BANNER_DURATION,
  CELO_TRANSACTION_MIN_AMOUNT,
  DEFAULT_TESTNET,
  SHOW_TESTNET_BANNER,
  STABLE_TRANSACTION_MIN_AMOUNT,
} from 'src/config'
import useOpenDapp from 'src/dappsExplorer/useOpenDapp'
import { refreshAllBalances, visitHome } from 'src/home/actions'
import ActionsCarousel from 'src/home/ActionsCarousel'
import CashInBottomSheet from 'src/home/CashInBottomSheet'
import DappsCarousel from 'src/home/DappsCarousel'
import NotificationBell from 'src/home/NotificationBell'
import NotificationBellSpotlight from 'src/home/NotificationBellSpotlight'
import NotificationBox from 'src/home/NotificationBox'
import { importContacts } from 'src/identity/actions'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { phoneRecipientCacheSelector } from 'src/recipients/reducer'
import useSelector from 'src/redux/useSelector'
import { initializeSentryUserContext } from 'src/sentry/actions'
import { getExperimentParams, getFeatureGate } from 'src/statsig'
import { ExperimentConfigs } from 'src/statsig/constants'
import { StatsigExperiments, StatsigFeatureGates } from 'src/statsig/types'
import colors from 'src/styles/colors'
import { Spacing } from 'src/styles/styles'
import { celoAddressSelector, coreTokensSelector } from 'src/tokens/selectors'
import TransactionFeed from 'src/transactions/feed/TransactionFeed'
import { userInSanctionedCountrySelector } from 'src/utils/countryFeatures'
import { checkContactsPermission } from 'src/utils/permissions'

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList)

function WalletHome() {
  const { t } = useTranslation()

  const appState = useSelector(appStateSelector)
  const isLoading = useSelector((state) => state.home.loading)
  const recipientCache = useSelector(phoneRecipientCacheSelector)
  const isNumberVerified = useSelector(phoneNumberVerifiedSelector)
  const coreTokenBalances = useSelector(coreTokensSelector)
  const celoAddress = useSelector(celoAddressSelector)
  const userInSanctionedCountry = useSelector(userInSanctionedCountrySelector)
  const canShowNotificationSpotlight = useSelector(showNotificationSpotlightSelector)

  const insets = useSafeAreaInsets()
  const scrollPosition = useRef(new Animated.Value(0)).current
  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollPosition } } }])

  const dispatch = useDispatch()

  const { onSelectDapp } = useOpenDapp()

  const showNotificationCenter = getFeatureGate(StatsigFeatureGates.SHOW_NOTIFICATION_CENTER)
  const showNotificationSpotlight = showNotificationCenter && canShowNotificationSpotlight

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

    const hasGivenContactPermission = await checkContactsPermission()
    if (hasGivenContactPermission) {
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

  const shouldShowCashInBottomSheet = () => {
    if (showNotificationSpotlight) {
      return false
    }

    // If user is in a sanctioned country do not show the cash in bottom sheet
    if (userInSanctionedCountry) {
      return false
    }
    // If there are no core tokens then we are either still loading or loading failed.
    if (!coreTokenBalances.length) {
      return false
    }
    const hasStable = !!coreTokenBalances.find(
      (token) => token.balance.gte(STABLE_TRANSACTION_MIN_AMOUNT) && token.address !== celoAddress
    )

    const hasCelo =
      coreTokenBalances
        .find((token) => token.address === celoAddress)
        ?.balance.isGreaterThan(CELO_TRANSACTION_MIN_AMOUNT) ?? false
    const isAccountBalanceZero = hasStable === false && hasCelo === false

    const { cashInBottomSheetEnabled } = getExperimentParams(
      ExperimentConfigs[StatsigExperiments.CHOOSE_YOUR_ADVENTURE]
    )

    return cashInBottomSheetEnabled && isAccountBalanceZero
  }

  const keyExtractor = (_item: any, index: number) => {
    return index.toString()
  }

  const refresh: React.ReactElement<RefreshControlProps> = (
    <RefreshControl refreshing={isLoading} onRefresh={onRefresh} colors={[colors.primary]} />
  ) as React.ReactElement<RefreshControlProps>

  const sections = []

  const notificationBoxSection = {
    data: [{}],
    renderItem: () => (
      <NotificationBox
        key={'NotificationBox'}
        // When the notification center is enabled, we only show high priority notifications marked for the home screen
        showOnlyHomeScreenNotifications={showNotificationCenter}
      />
    ),
  }
  const tokenBalanceSection = {
    data: [{}],
    renderItem: () => <HomeTokenBalance key={'HomeTokenBalance'} />,
  }
  const actionsCarouselSection = {
    data: [{}],
    renderItem: () => <ActionsCarousel key={'ActionsCarousel'} />,
  }

  if (showNotificationCenter) {
    sections.push(notificationBoxSection, tokenBalanceSection, actionsCarouselSection)
  } else {
    sections.push(tokenBalanceSection, actionsCarouselSection, notificationBoxSection)
  }

  sections.push({
    data: [{}],
    renderItem: () => <DappsCarousel key="DappsCarousel" onSelectDapp={onSelectDapp} />,
  })

  sections.push({
    data: [{}],
    renderItem: () => <TransactionFeed key={'TransactionList'} />,
  })

  const showBetaTag = getFeatureGate(StatsigFeatureGates.SHOW_BETA_TAG)
  const topLeftElement = showBetaTag && <BetaTag />

  const topRightElements = (
    <View style={styles.topRightElementsContainer}>
      <QrScanButton testID={'WalletHome/QRScanButton'} style={styles.topRightElement} />
      {showNotificationCenter && (
        <NotificationBell testID={'WalletHome/NotificationBell'} style={styles.topRightElement} />
      )}
    </View>
  )

  return (
    <SafeAreaView testID="WalletHome" style={styles.container} edges={['top']}>
      <DrawerTopBar
        leftElement={topLeftElement}
        rightElement={topRightElements}
        scrollPosition={scrollPosition}
      />
      <AnimatedSectionList
        // Workaround iOS setting an incorrect automatic inset at the top
        scrollIndicatorInsets={{ top: 0.01 }}
        scrollEventThrottle={16}
        onScroll={onScroll}
        refreshControl={refresh}
        onRefresh={onRefresh}
        refreshing={isLoading}
        style={styles.container}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
        sections={sections}
        keyExtractor={keyExtractor}
        testID="WalletHome/SectionList"
      />
      <NotificationBellSpotlight isVisible={showNotificationSpotlight} />
      {shouldShowCashInBottomSheet() && <CashInBottomSheet />}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  topRightElementsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topRightElement: {
    marginLeft: Spacing.Regular16,
  },
})

export default WalletHome

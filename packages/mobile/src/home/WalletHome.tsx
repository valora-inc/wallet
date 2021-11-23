import colors from '@celo/react-components/styles/colors'
import _ from 'lodash'
import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshControl, RefreshControlProps, SectionList, StyleSheet } from 'react-native'
import Animated from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { showMessage } from 'src/alert/actions'
import { AppState } from 'src/app/actions'
import { appStateSelector, multiTokenShowHomeBalancesSelector } from 'src/app/selectors'
import {
  ALERT_BANNER_DURATION,
  CELO_TRANSACTION_MIN_AMOUNT,
  DEFAULT_TESTNET,
  SHOW_TESTNET_BANNER,
  STABLE_TRANSACTION_MIN_AMOUNT,
} from 'src/config'
import { refreshAllBalances } from 'src/home/actions'
import CashInBottomSheet from 'src/home/CashInBottomSheet'
import HomeTokenBalance from 'src/home/HomeTokenBalance'
import NotificationBox from 'src/home/NotificationBox'
import SendOrRequestBar from 'src/home/SendOrRequestBar'
import Logo from 'src/icons/Logo'
import { importContacts } from 'src/identity/actions'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { phoneRecipientCacheSelector } from 'src/recipients/reducer'
import useSelector from 'src/redux/useSelector'
import { initializeSentryUserContext } from 'src/sentry/actions'
import { balancesSelector } from 'src/stableToken/selectors'
import { FeedType } from 'src/transactions/TransactionFeed'
import TransactionsList from 'src/transactions/TransactionsList'
import { Currency, STABLE_CURRENCIES } from 'src/utils/currencies'
import { checkContactsPermission } from 'src/utils/permissions'

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList)

function WalletHome() {
  const { t } = useTranslation()

  const appState = useSelector(appStateSelector)
  const isLoading = useSelector((state) => state.home.loading)
  const recipientCache = useSelector(phoneRecipientCacheSelector)
  const isNumberVerified = useSelector((state) => state.app.numberVerified)
  const showTokensInHome = useSelector(multiTokenShowHomeBalancesSelector)
  const balances = useSelector(balancesSelector)
  const cashInButtonExpEnabled = useSelector((state) => state.app.cashInButtonExpEnabled)

  const scrollPosition = useRef(new Animated.Value(0)).current
  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollPosition } } }])

  const dispatch = useDispatch()

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
    const hasStable = STABLE_CURRENCIES.some((currency) =>
      balances[currency]?.isGreaterThan(STABLE_TRANSACTION_MIN_AMOUNT)
    )
    const hasCelo = balances[Currency.Celo]?.isGreaterThan(CELO_TRANSACTION_MIN_AMOUNT)
    const isAccountBalanceZero = hasStable === false && hasCelo === false

    return cashInButtonExpEnabled && isAccountBalanceZero
  }

  const keyExtractor = (_item: any, index: number) => {
    return index.toString()
  }

  const refresh: React.ReactElement<RefreshControlProps> = (
    <RefreshControl refreshing={isLoading} onRefresh={onRefresh} colors={[colors.greenUI]} />
  ) as React.ReactElement<RefreshControlProps>

  const sections = []

  sections.push({
    data: [{}],
    renderItem: () => <NotificationBox key={'NotificationBox'} />,
  })

  if (showTokensInHome) {
    sections.push({
      data: [{}],
      renderItem: () => <HomeTokenBalance key={'HomeTokenBalance'} />,
    })
  }

  sections.push({
    data: [{}],
    renderItem: () => <TransactionsList key={'TransactionList'} feedType={FeedType.HOME} />,
  })
  navigate(Screens.LinkBankAccountScreen)
  return (
    <SafeAreaView style={styles.container}>
      <DrawerTopBar middleElement={<Logo />} scrollPosition={scrollPosition} />
      <AnimatedSectionList
        scrollEventThrottle={16}
        onScroll={onScroll}
        refreshControl={refresh}
        onRefresh={onRefresh}
        refreshing={isLoading}
        style={styles.container}
        sections={sections}
        keyExtractor={keyExtractor}
      />
      <SendOrRequestBar />
      {shouldShowCashInBottomSheet() && <CashInBottomSheet />}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
})

export default WalletHome

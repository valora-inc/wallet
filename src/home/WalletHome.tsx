import {
  CryptoType,
  FiatAccountSchema,
  FiatType,
  TransferType,
} from '@fiatconnect/fiatconnect-types'
import _ from 'lodash'
import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshControl, RefreshControlProps, SectionList, StyleSheet } from 'react-native'
import Animated from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { KycStatus } from 'src/account/reducer'
import { showMessage } from 'src/alert/actions'
import { AppState } from 'src/app/actions'
import { appStateSelector } from 'src/app/selectors'
import Button from 'src/components/Button'
import { HomeTokenBalance } from 'src/components/TokenBalance'
import {
  ALERT_BANNER_DURATION,
  CELO_TRANSACTION_MIN_AMOUNT,
  DEFAULT_TESTNET,
  SHOW_TESTNET_BANNER,
  STABLE_TRANSACTION_MIN_AMOUNT,
} from 'src/config'
import { maxNumRecentDappsSelector } from 'src/dapps/selectors'
import useOpenDapp from 'src/dappsExplorer/useOpenDapp'
import { normalizeFiatConnectQuotes } from 'src/fiatExchanges/quotes/normalizeQuotes'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { refreshAllBalances } from 'src/home/actions'
import CashInBottomSheet from 'src/home/CashInBottomSheet'
import NotificationBox from 'src/home/NotificationBox'
import RecentlyUsedDapps from 'src/home/RecentlyUsedDapps'
import SendOrRequestBar from 'src/home/SendOrRequestBar'
import Logo from 'src/icons/Logo'
import { importContacts } from 'src/identity/actions'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { phoneRecipientCacheSelector } from 'src/recipients/reducer'
import useSelector from 'src/redux/useSelector'
import { initializeSentryUserContext } from 'src/sentry/actions'
import colors from 'src/styles/colors'
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
  const isNumberVerified = useSelector((state) => state.app.numberVerified)
  const maxNumRecentDapps = useSelector(maxNumRecentDappsSelector)
  const coreTokenBalances = useSelector(coreTokensSelector)
  const celoAddress = useSelector(celoAddressSelector)
  const cashInButtonExpEnabled = useSelector((state) => state.app.cashInButtonExpEnabled)
  const userInSanctionedCountry = useSelector(userInSanctionedCountrySelector)

  const quote = normalizeFiatConnectQuotes(CICOFlow.CashOut, [
    {
      provider: {
        id: 'provider-one',
        providerName: 'Provider One',
        imageUrl:
          'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media',
        baseUrl: 'fakewebsite.valoraapp.com',
        websiteUrl: 'https://fakewebsite.valorapp.com',
        iconUrl:
          'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media',
      },
      ok: true,
      quote: {
        fiatType: FiatType.USD,
        cryptoType: CryptoType.cUSD,
        fiatAmount: '100',
        cryptoAmount: '100',
        quoteId: 'mock_quote_in_id',
        guaranteedUntil: '2099-04-27T19:22:36.000Z',
        transferType: TransferType.TransferIn,
        fee: '4.22',
      },
      kyc: {
        kycRequired: false,
        kycSchemas: [],
      },
      fiatAccount: {
        BankAccount: {
          fiatAccountSchemas: [
            {
              fiatAccountSchema: FiatAccountSchema.AccountNumber,
              allowedValues: {},
            },
          ],
        },
      },
    },
  ])

  const scrollPosition = useRef(new Animated.Value(0)).current
  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollPosition } } }])

  const dispatch = useDispatch()

  const { onSelectDapp, ConfirmOpenDappBottomSheet } = useOpenDapp()

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

  sections.push({
    data: [{}],
    renderItem: () => <HomeTokenBalance key={'HomeTokenBalance'} />,
  })

  if (maxNumRecentDapps > 0) {
    sections.push({
      data: [{}],
      renderItem: () => <RecentlyUsedDapps key="RecentlyUsedDapps" onSelectDapp={onSelectDapp} />,
    })
  }

  sections.push({
    data: [{}],
    renderItem: () => <TransactionFeed key={'TransactionList'} />,
  })

  return (
    <SafeAreaView style={styles.container}>
      <Button
        onPress={() =>
          navigate(Screens.KycLanding, {
            quote: quote[0],
            flow: CICOFlow.CashOut,
            step: 'one',
            personaKycStatus: KycStatus.Expired,
          })
        }
        text="hello"
      />
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
      {ConfirmOpenDappBottomSheet}
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

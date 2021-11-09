import colors from '@celo/react-components/styles/colors'
import _ from 'lodash'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  RefreshControlProps,
  SectionList,
  StyleSheet,
} from 'react-native'
import Animated from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { showMessage } from 'src/alert/actions'
import { multiTokenShowHomeBalancesSelector } from 'src/app/selectors'
import {
  ALERT_BANNER_DURATION,
  DEFAULT_TESTNET,
  GOLD_TRANSACTION_MIN_AMOUNT,
  SHOW_TESTNET_BANNER,
  STABLE_TRANSACTION_MIN_AMOUNT,
} from 'src/config'
import { refreshAllBalances, setLoading } from 'src/home/actions'
import CashInBottomSheet from 'src/home/CashInBottomSheet'
import HomeTokenBalance from 'src/home/HomeTokenBalance'
import NotificationBox from 'src/home/NotificationBox'
import SendOrRequestBar from 'src/home/SendOrRequestBar'
import { Namespaces, withTranslation } from 'src/i18n'
import Logo from 'src/icons/Logo'
import { importContacts } from 'src/identity/actions'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { NumberToRecipient } from 'src/recipients/recipient'
import { phoneRecipientCacheSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'
import { initializeSentryUserContext } from 'src/sentry/actions'
import { Balances, balancesSelector } from 'src/stableToken/selectors'
import { FeedType } from 'src/transactions/TransactionFeed'
import TransactionsList from 'src/transactions/TransactionsList'
import { Currency, STABLE_CURRENCIES } from 'src/utils/currencies'
import { checkContactsPermission } from 'src/utils/permissions'

interface StateProps {
  loading: boolean
  recipientCache: NumberToRecipient
  numberVerified: boolean
  cashInButtonExpEnabled: boolean
  balances: Balances
  showTokensinHome: boolean
}

interface DispatchProps {
  refreshAllBalances: typeof refreshAllBalances
  initializeSentryUserContext: typeof initializeSentryUserContext
  setLoading: typeof setLoading
  showMessage: typeof showMessage
  importContacts: typeof importContacts
}

type Props = StateProps & DispatchProps & WithTranslation

const mapDispatchToProps = {
  refreshAllBalances,
  initializeSentryUserContext,
  setLoading,
  showMessage,
  importContacts,
}

const mapStateToProps = (state: RootState): StateProps => ({
  loading: state.home.loading,
  recipientCache: phoneRecipientCacheSelector(state),
  numberVerified: state.app.numberVerified,
  cashInButtonExpEnabled: state.app.cashInButtonExpEnabled,
  balances: balancesSelector(state),
  showTokensinHome: multiTokenShowHomeBalancesSelector(state),
})

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList)

interface State {
  isMigrating: boolean
}

export class WalletHome extends React.Component<Props, State> {
  scrollPosition: Animated.Value<number>
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void

  constructor(props: Props) {
    super(props)

    this.scrollPosition = new Animated.Value(0)
    this.onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: this.scrollPosition } } }])
    this.state = {
      isMigrating: false,
    }
  }

  onRefresh = async () => {
    this.props.refreshAllBalances()
  }

  componentDidMount = () => {
    // TODO find a better home for this, its unrelated to wallet home
    this.props.initializeSentryUserContext()
    if (SHOW_TESTNET_BANNER) {
      this.showTestnetBanner()
    }

    // TODO: Fire refreshAllBalances when the app state changes to active. It's easier to do that when we
    // transform this into a function component.
    // useEffect(() => {
    //   if (appState === AppState.Active) {
    //     dispatch(refreshAllBalances())
    //   }
    // }, [appState])
    this.props.refreshAllBalances()
    // Waiting 1/2 sec before triggering to allow
    // rest of feed to load unencumbered
    setTimeout(this.tryImportContacts, 500)
  }

  shouldShowCashInBottomSheet = () => {
    const hasStable = STABLE_CURRENCIES.some((currency) =>
      this.props.balances[currency]?.isGreaterThan(STABLE_TRANSACTION_MIN_AMOUNT)
    )
    const hasGold = this.props.balances[Currency.Celo]?.isGreaterThan(GOLD_TRANSACTION_MIN_AMOUNT)
    const isAccountBalanceZero = !hasStable && !hasGold

    return this.props.cashInButtonExpEnabled && isAccountBalanceZero
  }

  tryImportContacts = async () => {
    const { numberVerified, recipientCache } = this.props

    // Only import contacts if number is verified and
    // recip cache is empty so we haven't already
    if (!numberVerified || recipientCache.length) {
      return
    }

    const hasGivenContactPermission = await checkContactsPermission()
    if (hasGivenContactPermission) {
      this.props.importContacts()
    }
  }

  keyExtractor = (_item: any, index: number) => {
    return index.toString()
  }

  showTestnetBanner = () => {
    const { t } = this.props
    this.props.showMessage(
      t('testnetAlert.1', { testnet: _.startCase(DEFAULT_TESTNET) }),
      ALERT_BANNER_DURATION,
      null,
      null,
      t('testnetAlert.0', { testnet: _.startCase(DEFAULT_TESTNET) })
    )
  }

  render() {
    const refresh: React.ReactElement<RefreshControlProps> = (
      <RefreshControl
        refreshing={this.props.loading}
        onRefresh={this.onRefresh}
        colors={[colors.greenUI]}
      />
    ) as React.ReactElement<RefreshControlProps>

    const sections = []

    sections.push({
      data: [{}],
      renderItem: () => <NotificationBox key={'NotificationBox'} />,
    })

    if (this.props.showTokensinHome) {
      sections.push({
        data: [{}],
        renderItem: () => <HomeTokenBalance key={'HomeTokenBalance'} />,
      })
    }

    sections.push({
      data: [{}],
      renderItem: () => <HomeTokenBalance key={'HomeTokenBalance'} />,
    })

    sections.push({
      data: [{}],
      renderItem: () => <TransactionsList key={'TransactionList'} feedType={FeedType.HOME} />,
    })

    return (
      <SafeAreaView style={styles.container}>
        <DrawerTopBar middleElement={<Logo />} scrollPosition={this.scrollPosition} />
        <AnimatedSectionList
          scrollEventThrottle={16}
          onScroll={this.onScroll}
          refreshControl={refresh}
          onRefresh={this.onRefresh}
          refreshing={this.props.loading}
          style={styles.container}
          sections={sections}
          keyExtractor={this.keyExtractor}
        />
        <SendOrRequestBar />
        {this.shouldShowCashInBottomSheet() && <CashInBottomSheet />}
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
})

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation<Props>(Namespaces.walletFlow5)(WalletHome))

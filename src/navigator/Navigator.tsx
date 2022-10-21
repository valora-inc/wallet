import { RouteProp } from '@react-navigation/core'
import { createStackNavigator, StackScreenProps, TransitionPresets } from '@react-navigation/stack'
import * as React from 'react'
import { PixelRatio, Platform } from 'react-native'
import SplashScreen from 'react-native-splash-screen'
import AccountKeyEducation from 'src/account/AccountKeyEducation'
import AccounSetupFailureScreen from 'src/account/AccountSetupFailureScreen'
import BankAccounts from 'src/account/BankAccounts'
import ConnectPhoneNumberScreen from 'src/account/ConnectPhoneNumberScreen'
import GoldEducation from 'src/account/GoldEducation'
import Licenses from 'src/account/Licenses'
import LinkBankAccountErrorScreen from 'src/account/LinkBankAccountErrorScreen'
import LinkBankAccountScreen from 'src/account/LinkBankAccountScreen'
import NuxInterestsScreen from 'src/account/NuxInterests'
import Profile from 'src/account/Profile'
import RaiseLimitScreen from 'src/account/RaiseLimitScreen'
import { PincodeType } from 'src/account/reducer'
import StoreWipeRecoveryScreen from 'src/account/StoreWipeRecoveryScreen'
import SupportContact from 'src/account/SupportContact'
import SyncBankAccountScreen from 'src/account/SyncBankAccountScreen'
import { CeloExchangeEvents } from 'src/analytics/Events'
import AppLoading from 'src/app/AppLoading'
import Debug from 'src/app/Debug'
import ErrorScreen from 'src/app/ErrorScreen'
import UpgradeScreen from 'src/app/UpgradeScreen'
import WebViewScreen from 'src/app/WebViewScreen'
import BackupComplete from 'src/backup/BackupComplete'
import BackupForceScreen from 'src/backup/BackupForceScreen'
import BackupPhrase, { navOptionsForBackupPhrase } from 'src/backup/BackupPhrase'
import BackupQuiz, { navOptionsForQuiz } from 'src/backup/BackupQuiz'
import BackButton from 'src/components/BackButton'
import CancelButton from 'src/components/CancelButton'
import ConsumerIncentivesHomeScreen from 'src/consumerIncentives/ConsumerIncentivesHomeScreen'
import DappKitAccountScreen from 'src/dappkit/DappKitAccountScreen'
import DappKitSignTxScreen from 'src/dappkit/DappKitSignTxScreen'
import DappKitTxDataScreen from 'src/dappkit/DappKitTxDataScreen'
import EscrowedPaymentListScreen from 'src/escrow/EscrowedPaymentListScreen'
import ReclaimPaymentConfirmationScreen from 'src/escrow/ReclaimPaymentConfirmationScreen'
import ExchangeReview from 'src/exchange/ExchangeReview'
import ExchangeTradeScreen from 'src/exchange/ExchangeTradeScreen'
import WithdrawCeloQrScannerScreen from 'src/exchange/WithdrawCeloQrScannerScreen'
import WithdrawCeloReviewScreen from 'src/exchange/WithdrawCeloReviewScreen'
import WithdrawCeloScreen from 'src/exchange/WithdrawCeloScreen'
import BidaliScreen from 'src/fiatExchanges/BidaliScreen'
import CashInSuccess from 'src/fiatExchanges/CashInSuccess'
import ExternalExchanges, {
  externalExchangesScreenOptions,
} from 'src/fiatExchanges/ExternalExchanges'
import FiatExchangeAmount from 'src/fiatExchanges/FiatExchangeAmount'
import FiatExchangeCurrency, {
  fiatExchangesOptionsScreenOptions,
} from 'src/fiatExchanges/FiatExchangeCurrency'
import SelectProviderScreen from 'src/fiatExchanges/SelectProvider'
import SimplexScreen from 'src/fiatExchanges/SimplexScreen'
import Spend, { spendScreenOptions } from 'src/fiatExchanges/Spend'
import GuilderEducation from 'src/goldToken/GuilderEducation'
import i18n from 'src/i18n'
import { currentLanguageSelector } from 'src/i18n/selectors'
import PhoneNumberLookupQuotaScreen from 'src/identity/PhoneNumberLookupQuotaScreen'
import ImportWallet from 'src/import/ImportWallet'
import Language from 'src/language/Language'
import SelectLocalCurrency from 'src/localCurrency/SelectLocalCurrency'
import MerchantPaymentScreen from 'src/merchantPayment/MerchantPaymentScreen'
import DrawerNavigator from 'src/navigator/DrawerNavigator'
import {
  emptyHeader,
  HeaderTitleWithBalance,
  headerWithBackButton,
  headerWithBackEditButtons,
  headerWithCloseButton,
  noHeader,
  noHeaderGestureDisabled,
} from 'src/navigator/Headers'
import { navigateBack, navigateToExchangeHome } from 'src/navigator/NavigationService'
import QRNavigator from 'src/navigator/QRNavigator'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import OnboardingEducationScreen from 'src/onboarding/education/OnboardingEducationScreen'
import EnableBiometry from 'src/onboarding/registration/EnableBiometry'
import NameAndPicture from 'src/onboarding/registration/NameAndPicture'
import RegulatoryTerms from 'src/onboarding/registration/RegulatoryTerms'
import SelectCountry from 'src/onboarding/registration/SelectCountry'
import OnboardingSuccessScreen from 'src/onboarding/success/OnboardingSuccessScreen'
import Welcome from 'src/onboarding/welcome/Welcome'
import IncomingPaymentRequestListScreen from 'src/paymentRequest/IncomingPaymentRequestListScreen'
import OutgoingPaymentRequestListScreen from 'src/paymentRequest/OutgoingPaymentRequestListScreen'
import PaymentRequestConfirmation, {
  paymentConfirmationScreenNavOptions,
} from 'src/paymentRequest/PaymentRequestConfirmation'
import PaymentRequestConfirmationLegacy from 'src/paymentRequest/PaymentRequestConfirmationLegacy'
import PaymentRequestUnavailable, {
  paymentRequestUnavailableScreenNavOptions,
} from 'src/paymentRequest/PaymentRequestUnavailable'
import PincodeEnter from 'src/pincode/PincodeEnter'
import PincodeSet from 'src/pincode/PincodeSet'
import ReceiveAmount from 'src/receive'
import { RootState } from 'src/redux/reducers'
import { store } from 'src/redux/store'
import Send from 'src/send/Send'
import SendAmount from 'src/send/SendAmount'
import SendConfirmation, { sendConfirmationScreenNavOptions } from 'src/send/SendConfirmation'
import SendConfirmationLegacy, {
  sendConfirmationLegacyScreenNavOptions,
} from 'src/send/SendConfirmationLegacy'
import TransactionSent from 'src/send/TransactionSent'
import ValidateRecipientAccount, {
  validateRecipientAccountScreenNavOptions,
} from 'src/send/ValidateRecipientAccount'
import ValidateRecipientIntro, {
  validateRecipientIntroScreenNavOptions,
} from 'src/send/ValidateRecipientIntro'
import SetClock from 'src/set-clock/SetClock'
import SwapScreen from 'src/swap/SwapScreen'
import SwapTokenList from 'src/swap/SwapTokenList'
import TokenBalancesScreen from 'src/tokens/TokenBalances'
import TransactionDetailsScreen from 'src/transactions/feed/TransactionDetailsScreen'
import TransactionReview from 'src/transactions/TransactionReview'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
import { ExtractProps } from 'src/utils/typescript'
import VerificationEducationScreen from 'src/verify/VerificationEducationScreen'
import VerificationInputScreen from 'src/verify/VerificationInputScreen'
import VerificationLoadingScreen from 'src/verify/VerificationLoadingScreen'
import WalletConnectActionRequestScreen from 'src/walletConnect/screens/ActionRequest'
import WalletConnectLoading from 'src/walletConnect/screens/Loading'
import WalletConnectResult from 'src/walletConnect/screens/Result'
import WalletConnectSessionRequestScreen from 'src/walletConnect/screens/SessionRequest'
import WalletConnectSessionsScreen from 'src/walletConnect/screens/Sessions'
const TAG = 'Navigator'

const Stack = createStackNavigator<StackParamList>()
const RootStack = createStackNavigator<StackParamList>()

type NavigationOptions = StackScreenProps<StackParamList, keyof StackParamList>

export const modalScreenOptions = ({ route, navigation }: NavigationOptions) =>
  Platform.select({
    // iOS 13 modal presentation
    ios: {
      gestureEnabled: true,
      cardOverlayEnabled: true,
      headerStatusBarHeight: 0,
      ...TransitionPresets.ModalPresentationIOS,
    },
  })

const kolektivoNotificationScreens = (Navigator: typeof Stack) => {
  return (
    <>
      <Navigator.Screen
        name={Screens.GuilderEducation}
        component={GuilderEducation}
        options={noHeader}
      />
    </>
  )
}

const commonScreens = (Navigator: typeof Stack) => {
  return (
    <>
      <Navigator.Screen name={Screens.ErrorScreen} component={ErrorScreen} options={noHeader} />
      <Navigator.Screen
        name={Screens.UpgradeScreen}
        component={UpgradeScreen}
        options={UpgradeScreen.navigationOptions}
      />
      <Navigator.Screen
        name={Screens.DappKitAccountAuth}
        component={DappKitAccountScreen}
        options={DappKitAccountScreen.navigationOptions}
      />
      <Navigator.Screen
        name={Screens.DappKitSignTxScreen}
        component={DappKitSignTxScreen}
        options={DappKitSignTxScreen.navigationOptions}
      />
      <Navigator.Screen
        name={Screens.DappKitTxDataScreen}
        component={DappKitTxDataScreen}
        options={DappKitTxDataScreen.navigationOptions}
      />
      <Navigator.Screen
        name={Screens.WalletConnectLoading}
        component={WalletConnectLoading}
        options={WalletConnectLoading.navigationOptions}
      />
      <Navigator.Screen
        name={Screens.WalletConnectResult}
        component={WalletConnectResult}
        options={WalletConnectResult.navigationOptions}
      />
      <Navigator.Screen
        name={Screens.WalletConnectSessionRequest}
        component={WalletConnectSessionRequestScreen}
        options={WalletConnectSessionRequestScreen.navigationOptions}
      />
      <Navigator.Screen
        name={Screens.WalletConnectActionRequest}
        component={WalletConnectActionRequestScreen}
        options={WalletConnectActionRequestScreen.navigationOptions}
      />
      <Navigator.Screen name={Screens.Debug} component={Debug} options={Debug.navigationOptions} />
      <Navigator.Screen
        name={Screens.PhoneNumberLookupQuota}
        component={PhoneNumberLookupQuotaScreen}
        options={noHeaderGestureDisabled}
      />
      <Navigator.Screen
        name={Screens.WebViewScreen}
        component={WebViewScreen}
        options={emptyHeader}
      />
      <Navigator.Screen
        name={Screens.TokenBalances}
        component={TokenBalancesScreen}
        options={TokenBalancesScreen.navigationOptions}
      />
    </>
  )
}

/**
 * This function returns a JSX element wrapping the screens
 * related to onboarding and user verification.
 * @param Navigator The main stack navigator
 * @returns The screens related to verification
 */
const verificationScreens = (Navigator: typeof Stack) => {
  return (
    <>
      <Navigator.Screen
        name={Screens.VerificationEducationScreen}
        component={VerificationEducationScreen}
        options={VerificationEducationScreen.navigationOptions}
      />
      <Navigator.Screen
        name={Screens.VerificationLoadingScreen}
        component={VerificationLoadingScreen}
        options={VerificationLoadingScreen.navigationOptions}
      />
      <Navigator.Screen
        name={Screens.VerificationInputScreen}
        component={VerificationInputScreen}
        options={VerificationInputScreen.navigationOptions}
      />
      <Navigator.Screen
        name={Screens.NuxInterests}
        component={NuxInterestsScreen}
        options={NuxInterestsScreen.navigationOptions}
      />
    </>
  )
}

/**
 * This function returns a JSX element wrapping the screens
 * related to onboarding.
 * @param Navigator The main stack navigator
 * @returns The screens related to the onboarding flow
 */
const nuxScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen
      name={Screens.OnboardingEducationScreen}
      component={OnboardingEducationScreen}
      options={OnboardingEducationScreen.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.Welcome}
      component={Welcome}
      options={Welcome.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.NameAndPicture}
      component={NameAndPicture}
      options={NameAndPicture.navOptions}
    />
    <Navigator.Screen
      name={Screens.PincodeSet}
      component={PincodeSet}
      options={PincodeSet.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.ImportWallet}
      component={ImportWallet}
      options={ImportWallet.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.EnableBiometry}
      component={EnableBiometry}
      options={EnableBiometry.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.OnboardingSuccessScreen}
      component={OnboardingSuccessScreen}
      options={OnboardingSuccessScreen.navigationOptions}
    />
  </>
)

/**
 * This function returns a JSX element wrapping the screens
 * related to sending and receiving currencies.
 * @param Navigator The main stack navigator
 * @returns The screens related to sending and receiving
 */
const sendScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen name={Screens.Send} component={Send} options={Send.navigationOptions} />
    <Navigator.Screen
      name={Screens.SendAmount}
      component={SendAmount}
      options={SendAmount.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.ReceiveAmount}
      component={ReceiveAmount}
      options={ReceiveAmount.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.SendConfirmation}
      component={SendConfirmation}
      options={sendConfirmationScreenNavOptions}
    />
    <Navigator.Screen
      name={Screens.SendConfirmationLegacy}
      component={SendConfirmationLegacy}
      options={sendConfirmationLegacyScreenNavOptions}
    />
    <Navigator.Screen
      name={Screens.ValidateRecipientIntro}
      component={ValidateRecipientIntro}
      options={validateRecipientIntroScreenNavOptions}
    />
    <Navigator.Screen
      name={Screens.ValidateRecipientAccount}
      component={ValidateRecipientAccount}
      options={validateRecipientAccountScreenNavOptions}
    />
    <Navigator.Screen
      name={Screens.PaymentRequestUnavailable}
      component={PaymentRequestUnavailable}
      options={paymentRequestUnavailableScreenNavOptions}
    />
    <Navigator.Screen
      name={Screens.PaymentRequestConfirmation}
      component={PaymentRequestConfirmation}
      options={paymentConfirmationScreenNavOptions}
    />
    <Navigator.Screen
      name={Screens.PaymentRequestConfirmationLegacy}
      component={PaymentRequestConfirmationLegacy}
      options={paymentConfirmationScreenNavOptions}
    />
    <Navigator.Screen
      name={Screens.IncomingPaymentRequestListScreen}
      component={IncomingPaymentRequestListScreen}
      options={headerWithBackButton}
    />
    <Navigator.Screen
      name={Screens.OutgoingPaymentRequestListScreen}
      component={OutgoingPaymentRequestListScreen}
      options={headerWithBackButton}
    />
    <Navigator.Screen
      name={Screens.EscrowedPaymentListScreen}
      component={EscrowedPaymentListScreen}
      options={headerWithBackButton}
    />
    <Navigator.Screen
      name={Screens.ReclaimPaymentConfirmationScreen}
      component={ReclaimPaymentConfirmationScreen}
      options={headerWithBackButton}
    />
    <Navigator.Screen
      name={Screens.MerchantPayment}
      component={MerchantPaymentScreen}
      options={headerWithBackButton}
    />
  </>
)

const exchangeReviewScreenOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.ExchangeReview>
}) => {
  const { makerToken } = route.params
  const isCeloPurchase = makerToken !== Currency.Celo
  const title = isCeloPurchase ? i18n.t('buyGold') : i18n.t('sellGold')
  const cancelEventName = isCeloPurchase
    ? CeloExchangeEvents.celo_buy_cancel
    : CeloExchangeEvents.celo_sell_cancel
  const editEventName = isCeloPurchase
    ? CeloExchangeEvents.celo_buy_edit
    : CeloExchangeEvents.celo_sell_edit
  return {
    ...headerWithBackEditButtons,
    headerLeft: () => (
      <BackButton testID="EditButton" onPress={navigateBack} eventName={editEventName} />
    ),
    headerRight: () =>
      PixelRatio.getFontScale() > 1 ? (
        <CancelButton
          buttonType={'icon'}
          onCancel={navigateToExchangeHome}
          eventName={cancelEventName}
        />
      ) : (
        <CancelButton
          style={{ paddingHorizontal: 0 }}
          buttonType={'text'}
          onCancel={navigateToExchangeHome}
          eventName={cancelEventName}
        />
      ),
    headerTitle: () => <HeaderTitleWithBalance title={title} token={makerToken} />,
  }
}

/**
 * This function returns a JSX element wrapping the screens
 * related to the exchange flow.
 * @param Navigator The main stack navigator
 * @returns The screens related to exchanging celo.
 */
const exchangeScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen
      name={Screens.ExchangeTradeScreen}
      component={ExchangeTradeScreen}
      options={noHeader}
    />
    <Navigator.Screen
      name={Screens.ExchangeReview}
      component={ExchangeReview}
      options={exchangeReviewScreenOptions}
    />
    <Navigator.Screen
      name={Screens.WithdrawCeloScreen}
      component={WithdrawCeloScreen}
      options={WithdrawCeloScreen.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.WithdrawCeloQrScannerScreen}
      component={WithdrawCeloQrScannerScreen}
      options={WithdrawCeloQrScannerScreen.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.WithdrawCeloReviewScreen}
      component={WithdrawCeloReviewScreen}
      options={WithdrawCeloReviewScreen.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.Swap}
      component={SwapScreen}
      options={SwapScreen.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.SwapTokenList}
      component={SwapTokenList}
      options={SwapTokenList.navigationOptions}
    />
  </>
)
/**
 * This function returns a JSX element wrapping the screens
 * related to the cGLD customer incentives.
 * @param Navigator The main stack navigator
 * @returns The screens related to the cGLD incentives
 */
const consumerIncentivesScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen
      name={Screens.ConsumerIncentivesHomeScreen}
      component={ConsumerIncentivesHomeScreen}
      options={ConsumerIncentivesHomeScreen.navOptions}
    />
  </>
)

/**
 *
 * @param Navigator The main stack navigator
 * @returns
 */
const backupScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen
      name={Screens.BackupForceScreen}
      component={BackupForceScreen}
      options={BackupForceScreen.navOptions}
    />
    <Navigator.Screen
      name={Screens.BackupPhrase}
      component={BackupPhrase}
      options={navOptionsForBackupPhrase}
    />
    <Navigator.Screen
      name={Screens.BackupQuiz}
      component={BackupQuiz}
      options={navOptionsForQuiz}
    />
    <Navigator.Screen name={Screens.BackupComplete} component={BackupComplete} options={noHeader} />
    <Navigator.Screen
      name={Screens.StoreWipeRecoveryScreen}
      component={StoreWipeRecoveryScreen}
      options={StoreWipeRecoveryScreen.navOptions}
    />
    <Navigator.Screen
      name={Screens.AccounSetupFailureScreen}
      component={AccounSetupFailureScreen}
      options={AccounSetupFailureScreen.navOptions}
    />
  </>
)

/**
 * This function returns a JSX element wrapping the screens
 * related to the application settings.
 * @param Navigator The main stack navigator
 * @returns The screens related to app settings
 */
const settingsScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen
      options={Profile.navigationOptions}
      name={Screens.Profile}
      component={Profile}
    />
    <Navigator.Screen
      name={Screens.Language}
      component={Language}
      options={Language.navigationOptions(false)}
    />
    <Navigator.Screen
      name={Screens.SelectLocalCurrency}
      component={SelectLocalCurrency}
      options={headerWithBackButton}
    />
    <Navigator.Screen
      name={Screens.LinkBankAccountScreen}
      component={LinkBankAccountScreen}
      options={headerWithBackButton}
    />
    <Navigator.Screen
      name={Screens.LinkBankAccountErrorScreen}
      component={LinkBankAccountErrorScreen}
      options={headerWithCloseButton}
    />
    <Navigator.Screen
      name={Screens.SyncBankAccountScreen}
      component={SyncBankAccountScreen}
      options={SyncBankAccountScreen.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.BankAccounts}
      component={BankAccounts}
      options={BankAccounts.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.ConnectPhoneNumberScreen}
      component={ConnectPhoneNumberScreen}
      options={headerWithCloseButton}
    />
    <Navigator.Screen
      name={Screens.WalletConnectSessions}
      component={WalletConnectSessionsScreen}
      options={WalletConnectSessionsScreen.navigationOptions}
    />
    <Navigator.Screen
      options={Licenses.navigationOptions}
      name={Screens.Licenses}
      component={Licenses}
    />
    <Navigator.Screen
      options={headerWithBackButton}
      name={Screens.SupportContact}
      component={SupportContact}
    />
    <Navigator.Screen
      options={RaiseLimitScreen.navOptions}
      name={Screens.RaiseLimitScreen}
      component={RaiseLimitScreen}
    />
    <Navigator.Screen
      options={externalExchangesScreenOptions}
      name={Screens.ExternalExchanges}
      component={ExternalExchanges}
    />
    <Navigator.Screen options={spendScreenOptions} name={Screens.Spend} component={Spend} />
    <Navigator.Screen
      options={FiatExchangeAmount.navOptions}
      name={Screens.FiatExchangeAmount}
      component={FiatExchangeAmount}
    />
    <Navigator.Screen
      options={fiatExchangesOptionsScreenOptions}
      name={Screens.FiatExchangeCurrency}
      component={FiatExchangeCurrency}
    />
    <Navigator.Screen
      options={CashInSuccess.navigationOptions}
      name={Screens.CashInSuccess}
      component={CashInSuccess}
    />
    <Navigator.Screen
      options={SimplexScreen.navigationOptions}
      name={Screens.Simplex}
      component={SimplexScreen}
    />
    <Navigator.Screen
      options={SelectProviderScreen.navigationOptions}
      name={Screens.SelectProvider}
      component={SelectProviderScreen}
    />
    <Navigator.Screen
      options={BidaliScreen.navigationOptions}
      name={Screens.BidaliScreen}
      component={BidaliScreen}
    />
    <Navigator.Screen
      name={Screens.TransactionSent}
      component={TransactionSent}
      options={TransactionSent.navigationOptions}
    />
  </>
)

/**
 * This function returns a JSX element wrapping the screens
 * that do not fall under another specific category.
 * @param Navigator The main stack navigator
 * @returns General screens of the app.
 */
const generalScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen
      name={Screens.SetClock}
      component={SetClock}
      options={noHeaderGestureDisabled}
    />
    <Navigator.Screen
      name={Screens.TransactionReview}
      component={TransactionReview}
      options={TransactionReview.navOptions}
    />
    <Navigator.Screen
      name={Screens.TransactionDetailsScreen}
      component={TransactionDetailsScreen}
      options={headerWithBackButton}
    />
  </>
)

const mapStateToProps = (state: RootState) => {
  return {
    choseToRestoreAccount: state.account.choseToRestoreAccount,
    language: currentLanguageSelector(state),
    name: state.account.name,
    acceptedTerms: state.account.acceptedTerms,
    pincodeType: state.account.pincodeType,
    account: state.web3.account,
    hasSeenVerificationNux: state.identity.hasSeenVerificationNux,
    askedContactsPermission: state.identity.askedContactsPermission,
  }
}

type InitialRouteName = ExtractProps<typeof Stack.Navigator>['initialRouteName']

export function MainStackScreen() {
  const [initialRouteName, setInitialRoute] = React.useState<InitialRouteName>(undefined)

  React.useEffect(() => {
    const {
      choseToRestoreAccount,
      language,
      name,
      acceptedTerms,
      pincodeType,
      account,
      hasSeenVerificationNux,
    } = mapStateToProps(store.getState())

    let initialRoute: InitialRouteName

    if (!language) {
      initialRoute = Screens.Language
    } else if (!name || !acceptedTerms || pincodeType === PincodeType.Unset) {
      // User didn't go far enough in onboarding, start again from education
      initialRoute = Screens.OnboardingEducationScreen
    } else if (!account) {
      initialRoute = choseToRestoreAccount
        ? Screens.ImportWallet
        : Screens.OnboardingEducationScreen
    } else if (!hasSeenVerificationNux) {
      initialRoute = Screens.VerificationEducationScreen
    } else {
      initialRoute = Screens.DrawerNavigator
    }

    setInitialRoute(initialRoute)
    Logger.info(`${TAG}@MainStackScreen`, `Initial route: ${initialRoute}`)

    // Wait for next frame to avoid slight gap when hiding the splash
    requestAnimationFrame(() => SplashScreen.hide())
  }, [])

  if (!initialRouteName) {
    return <AppLoading />
  }

  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={emptyHeader}>
      <Stack.Screen name={Screens.DrawerNavigator} component={DrawerNavigator} options={noHeader} />
      {kolektivoNotificationScreens(Stack)}
      {commonScreens(Stack)}
      {sendScreens(Stack)}
      {nuxScreens(Stack)}
      {verificationScreens(Stack)}
      {exchangeScreens(Stack)}
      {backupScreens(Stack)}
      {consumerIncentivesScreens(Stack)}
      {settingsScreens(Stack)}
      {generalScreens(Stack)}
    </Stack.Navigator>
  )
}

const modalAnimatedScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen
      name={Screens.PincodeEnter}
      component={PincodeEnter}
      options={PincodeEnter.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.QRNavigator}
      component={QRNavigator}
      options={QRNavigator.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.RegulatoryTerms}
      component={RegulatoryTerms}
      options={RegulatoryTerms.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.GoldEducation}
      component={GoldEducation}
      options={GoldEducation.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.AccountKeyEducation}
      component={AccountKeyEducation}
      options={AccountKeyEducation.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.LanguageModal}
      component={Language}
      options={Language.navigationOptions(true)}
    />
    <Navigator.Screen
      name={Screens.SelectCountry}
      component={SelectCountry}
      options={SelectCountry.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.SendConfirmationModal}
      component={SendConfirmation}
      options={sendConfirmationScreenNavOptions}
    />
    <Navigator.Screen
      name={Screens.SendConfirmationLegacyModal}
      component={SendConfirmationLegacy}
      options={sendConfirmationLegacyScreenNavOptions}
    />
  </>
)

const mainScreenNavOptions = (navOptions: NavigationOptions) => ({
  ...modalScreenOptions(navOptions),
  headerShown: false,
})

function RootStackScreen() {
  return (
    <RootStack.Navigator mode="modal">
      <RootStack.Screen
        name={Screens.Main}
        component={MainStackScreen}
        options={mainScreenNavOptions}
      />
      {modalAnimatedScreens(RootStack)}
    </RootStack.Navigator>
  )
}

export default RootStackScreen

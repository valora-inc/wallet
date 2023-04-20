import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  useBottomSheetDynamicSnapPoints,
} from '@gorhom/bottom-sheet'
import { RouteProp } from '@react-navigation/native'
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack'
import { createBottomSheetNavigator } from '@th3rdwave/react-navigation-bottom-sheet'
import * as React from 'react'
import { LayoutChangeEvent, PixelRatio, Platform } from 'react-native'
import SplashScreen from 'react-native-splash-screen'
import AccountKeyEducation from 'src/account/AccountKeyEducation'
import AccounSetupFailureScreen from 'src/account/AccountSetupFailureScreen'
import GoldEducation from 'src/account/GoldEducation'
import Licenses from 'src/account/Licenses'
import Profile from 'src/account/Profile'
import StoreWipeRecoveryScreen from 'src/account/StoreWipeRecoveryScreen'
import SupportContact from 'src/account/SupportContact'
import { CeloExchangeEvents } from 'src/analytics/Events'
import AppLoading from 'src/app/AppLoading'
import Debug from 'src/app/Debug'
import ErrorScreen from 'src/app/ErrorScreen'
import SanctionedCountryErrorScreen from 'src/app/SanctionedCountryErrorScreen'
import UpgradeScreen from 'src/app/UpgradeScreen'
import BackupComplete from 'src/backup/BackupComplete'
import BackupForceScreen from 'src/backup/BackupForceScreen'
import BackupIntroduction from 'src/backup/BackupIntroduction'
import BackupPhrase, { navOptionsForBackupPhrase } from 'src/backup/BackupPhrase'
import BackupQuiz, { navOptionsForQuiz } from 'src/backup/BackupQuiz'
import BackButton from 'src/components/BackButton'
import CancelButton from 'src/components/CancelButton'
import ConsumerIncentivesHomeScreen from 'src/consumerIncentives/ConsumerIncentivesHomeScreen'
import DappKitAccountScreen from 'src/dappkit/DappKitAccountScreen'
import DappKitSignTxScreen from 'src/dappkit/DappKitSignTxScreen'
import EscrowedPaymentListScreen from 'src/escrow/EscrowedPaymentListScreen'
import ReclaimPaymentConfirmationScreen from 'src/escrow/ReclaimPaymentConfirmationScreen'
import ExchangeReview from 'src/exchange/ExchangeReview'
import ExchangeTradeScreen from 'src/exchange/ExchangeTradeScreen'
import WithdrawCeloQrScannerScreen from 'src/exchange/WithdrawCeloQrScannerScreen'
import WithdrawCeloReviewScreen from 'src/exchange/WithdrawCeloReviewScreen'
import WithdrawCeloScreen from 'src/exchange/WithdrawCeloScreen'
import FiatDetailsScreen from 'src/fiatconnect/FiatDetailsScreen'
import KycDenied from 'src/fiatconnect/kyc/KycDenied'
import KycExpired from 'src/fiatconnect/kyc/KycExpired'
import KycPending from 'src/fiatconnect/kyc/KycPending'
import KycLanding from 'src/fiatconnect/KycLanding'
import FiatConnectLinkAccountScreen from 'src/fiatconnect/LinkAccountScreen'
import FiatConnectRefetchQuoteScreen from 'src/fiatconnect/RefetchQuoteScreen'
import FiatConnectReviewScreen from 'src/fiatconnect/ReviewScreen'
import FiatConnectTransferStatusScreen from 'src/fiatconnect/TransferStatusScreen'
import BidaliScreen from 'src/fiatExchanges/BidaliScreen'
import CashInSuccess from 'src/fiatExchanges/CashInSuccess'
import CoinbasePayScreen from 'src/fiatExchanges/CoinbasePayScreen'
import ExchangeQR from 'src/fiatExchanges/ExchangeQR'
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
import WithdrawSpend from 'src/fiatExchanges/WithdrawSpend'
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
  noHeader,
  noHeaderGestureDisabled,
  nuxNavigationOptions,
} from 'src/navigator/Headers'
import { getInitialRoute } from 'src/navigator/initialRoute'
import { navigateBack, navigateToExchangeHome } from 'src/navigator/NavigationService'
import QRNavigator from 'src/navigator/QRNavigator'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import ChooseYourAdventure from 'src/onboarding/ChooseYourAdventure'
import EnableBiometry from 'src/onboarding/registration/EnableBiometry'
import NameAndPicture from 'src/onboarding/registration/NameAndPicture'
import OnboardingRecoveryPhrase from 'src/onboarding/registration/OnboardingRecoveryPhrase'
import ProtectWallet from 'src/onboarding/registration/ProtectWallet'
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
import PincodeEnter from 'src/pincode/PincodeEnter'
import PincodeSet from 'src/pincode/PincodeSet'
import { RootState } from 'src/redux/reducers'
import { store } from 'src/redux/store'
import Send from 'src/send/Send'
import SendAmount from 'src/send/SendAmount'
import SendConfirmation, { sendConfirmationScreenNavOptions } from 'src/send/SendConfirmation'
import SendConfirmationLegacy, {
  sendConfirmationLegacyScreenNavOptions,
} from 'src/send/SendConfirmationLegacy'
import ValidateRecipientAccount, {
  validateRecipientAccountScreenNavOptions,
} from 'src/send/ValidateRecipientAccount'
import ValidateRecipientIntro, {
  validateRecipientIntroScreenNavOptions,
} from 'src/send/ValidateRecipientIntro'
import SwapExecuteScreen from 'src/swap/SwapExecuteScreen'
import SwapReviewScreen from 'src/swap/SwapReviewScreen'
import SwapScreenWithBack from 'src/swap/SwapScreenWithBack'
import TokenBalancesScreen from 'src/tokens/TokenBalances'
import TransactionDetailsScreen from 'src/transactions/feed/TransactionDetailsScreen'
import TransactionReview from 'src/transactions/TransactionReview'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
import { ExtractProps } from 'src/utils/typescript'
import VerificationCodeInputScreen from 'src/verify/VerificationCodeInputScreen'
import VerificationStartScreen from 'src/verify/VerificationStartScreen'
import WalletConnectSessionsScreen from 'src/walletConnect/screens/Sessions'
import WalletConnectRequest from 'src/walletConnect/screens/WalletConnectRequest'
import WebViewScreen from 'src/webview/WebViewScreen'

const TAG = 'Navigator'

const Stack = createNativeStackNavigator<StackParamList>()
const ModalStack = createNativeStackNavigator<StackParamList>()
const RootStack = createBottomSheetNavigator<StackParamList>()

export const modalScreenOptions = () =>
  Platform.select({
    // iOS 13 modal presentation
    ios: {
      presentation: 'modal',
    },
  })

const commonScreens = (Navigator: typeof Stack) => {
  return (
    <>
      <Navigator.Screen name={Screens.ErrorScreen} component={ErrorScreen} options={noHeader} />
      <Navigator.Screen
        name={Screens.UpgradeScreen}
        component={UpgradeScreen}
        options={UpgradeScreen.navigationOptions}
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
      <Navigator.Screen
        name={Screens.SanctionedCountryErrorScreen}
        component={SanctionedCountryErrorScreen}
        options={SanctionedCountryErrorScreen.navigationOptions}
      />
    </>
  )
}

const verificationScreens = (Navigator: typeof Stack) => {
  return (
    <>
      <Navigator.Screen
        name={Screens.VerificationStartScreen}
        component={VerificationStartScreen}
        options={nuxNavigationOptions}
      />
      <Navigator.Screen
        name={Screens.VerificationCodeInputScreen}
        component={VerificationCodeInputScreen}
        options={VerificationCodeInputScreen.navigationOptions}
      />
    </>
  )
}

const nuxScreens = (Navigator: typeof Stack) => (
  <>
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
      name={Screens.ProtectWallet}
      component={ProtectWallet}
      options={ProtectWallet.navOptions}
    />
    <Navigator.Screen
      name={Screens.OnboardingRecoveryPhrase}
      component={OnboardingRecoveryPhrase}
      options={OnboardingRecoveryPhrase.navOptions}
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

const sendScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen
      name={Screens.Send}
      component={Send}
      options={Send.navigationOptions as NativeStackNavigationOptions}
    />
    <Navigator.Screen
      name={Screens.SendAmount}
      component={SendAmount}
      options={SendAmount.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.SendConfirmation}
      component={SendConfirmation}
      options={sendConfirmationScreenNavOptions as NativeStackNavigationOptions}
    />
    <Navigator.Screen
      name={Screens.SendConfirmationLegacy}
      component={SendConfirmationLegacy}
      options={sendConfirmationLegacyScreenNavOptions as NativeStackNavigationOptions}
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
      // @ts-expect-error component type in native-stack v6
      component={IncomingPaymentRequestListScreen}
      options={headerWithBackButton}
    />
    <Navigator.Screen
      name={Screens.OutgoingPaymentRequestListScreen}
      // @ts-expect-error component type in native-stack v6
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
          buttonType={'text'}
          onCancel={navigateToExchangeHome}
          eventName={cancelEventName}
        />
      ),
    headerTitle: () => <HeaderTitleWithBalance title={title} token={makerToken} />,
  }
}
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
  </>
)

const consumerIncentivesScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen
      name={Screens.ConsumerIncentivesHomeScreen}
      component={ConsumerIncentivesHomeScreen}
      options={ConsumerIncentivesHomeScreen.navOptions}
    />
  </>
)

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
    <Navigator.Screen
      name={Screens.BackupIntroduction}
      component={BackupIntroduction}
      options={headerWithBackButton}
    />
  </>
)

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
      options={Language.navigationOptions()}
    />
    <Navigator.Screen
      name={Screens.SelectLocalCurrency}
      component={SelectLocalCurrency}
      options={headerWithBackButton}
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
      options={externalExchangesScreenOptions}
      name={Screens.ExternalExchanges}
      component={ExternalExchanges}
    />
    <Navigator.Screen options={spendScreenOptions} name={Screens.Spend} component={Spend} />
    <Navigator.Screen
      options={headerWithBackButton}
      name={Screens.WithdrawSpend}
      component={WithdrawSpend}
    />
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
      options={headerWithBackButton}
      name={Screens.FiatDetailsScreen}
      component={FiatDetailsScreen}
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
      options={FiatConnectReviewScreen.navigationOptions}
      name={Screens.FiatConnectReview}
      component={FiatConnectReviewScreen}
    />
    <Navigator.Screen
      options={noHeader}
      name={Screens.FiatConnectRefetchQuote}
      component={FiatConnectRefetchQuoteScreen}
    />
    <Navigator.Screen
      options={noHeader}
      name={Screens.FiatConnectTransferStatus}
      component={FiatConnectTransferStatusScreen}
    />
    <Navigator.Screen
      options={BidaliScreen.navigationOptions}
      name={Screens.BidaliScreen}
      component={BidaliScreen}
    />
    <Navigator.Screen
      name={Screens.CoinbasePayScreen}
      // @ts-expect-error component type in native-stack v6
      component={CoinbasePayScreen}
      options={emptyHeader}
    />
    <Navigator.Screen
      options={FiatConnectLinkAccountScreen.navigationOptions}
      name={Screens.FiatConnectLinkAccount}
      component={FiatConnectLinkAccountScreen}
    />
    <Navigator.Screen
      options={KycLanding.navigationOptions}
      name={Screens.KycLanding}
      component={KycLanding}
    />
    <Navigator.Screen
      options={headerWithBackButton}
      name={Screens.KycDenied}
      component={KycDenied}
    />
    <Navigator.Screen
      options={headerWithBackButton}
      name={Screens.KycExpired}
      component={KycExpired}
    />
    <Navigator.Screen
      options={headerWithBackButton}
      name={Screens.KycPending}
      component={KycPending}
    />
    <Navigator.Screen
      options={ExchangeQR.navigationOptions}
      name={Screens.ExchangeQR}
      component={ExchangeQR}
    />
  </>
)

const generalScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen
      name={Screens.ChooseYourAdventure}
      component={ChooseYourAdventure}
      options={ChooseYourAdventure.navOptions}
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

const swapScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen
      name={Screens.SwapScreenWithBack}
      component={SwapScreenWithBack}
      options={headerWithBackButton}
    />
    <Navigator.Screen
      name={Screens.SwapReviewScreen}
      component={SwapReviewScreen}
      options={SwapReviewScreen.navOptions}
    />
    <Navigator.Screen
      name={Screens.SwapExecuteScreen}
      component={SwapExecuteScreen}
      options={SwapExecuteScreen.navOptions}
    />
  </>
)

const mapStateToProps = (state: RootState) => {
  return {
    choseToRestoreAccount: state.account.choseToRestoreAccount,
    language: currentLanguageSelector(state),
    acceptedTerms: state.account.acceptedTerms,
    pincodeType: state.account.pincodeType,
    account: state.web3.account,
    hasSeenVerificationNux: state.identity.hasSeenVerificationNux,
    askedContactsPermission: state.identity.askedContactsPermission,
    recoveryPhraseInOnboardingStatus: state.account.recoveryPhraseInOnboardingStatus,
  }
}

type InitialRouteName = ExtractProps<typeof Stack.Navigator>['initialRouteName']

export function MainStackScreen() {
  const [initialRouteName, setInitialRoute] = React.useState<InitialRouteName>(undefined)

  React.useEffect(() => {
    const {
      choseToRestoreAccount,
      language,
      acceptedTerms,
      pincodeType,
      account,
      hasSeenVerificationNux,
      recoveryPhraseInOnboardingStatus,
    } = mapStateToProps(store.getState())

    const initialRoute: InitialRouteName = getInitialRoute({
      choseToRestoreAccount,
      language,
      acceptedTerms,
      pincodeType,
      account,
      hasSeenVerificationNux,
      recoveryPhraseInOnboardingStatus,
    })

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
      {commonScreens(Stack)}
      {sendScreens(Stack)}
      {nuxScreens(Stack)}
      {verificationScreens(Stack)}
      {exchangeScreens(Stack)}
      {backupScreens(Stack)}
      {consumerIncentivesScreens(Stack)}
      {settingsScreens(Stack)}
      {generalScreens(Stack)}
      {swapScreens(Stack)}
    </Stack.Navigator>
  )
}

const modalAnimatedScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen
      name={Screens.PincodeEnter}
      component={PincodeEnter}
      options={PincodeEnter.navigationOptions as NativeStackNavigationOptions}
    />
    <Navigator.Screen
      name={Screens.QRNavigator}
      component={QRNavigator}
      options={QRNavigator.navigationOptions as NativeStackNavigationOptions}
    />
    <Navigator.Screen
      name={Screens.RegulatoryTerms}
      // @ts-expect-error component type in native-stack v6
      component={RegulatoryTerms}
      options={RegulatoryTerms.navigationOptions as NativeStackNavigationOptions}
    />
    <Navigator.Screen
      name={Screens.GoldEducation}
      component={GoldEducation}
      options={GoldEducation.navigationOptions as NativeStackNavigationOptions}
    />
    <Navigator.Screen
      name={Screens.AccountKeyEducation}
      component={AccountKeyEducation}
      options={AccountKeyEducation.navigationOptions as NativeStackNavigationOptions}
    />
    <Navigator.Screen
      name={Screens.LanguageModal}
      component={Language}
      options={Language.navigationOptions() as NativeStackNavigationOptions}
    />
    <Navigator.Screen
      name={Screens.SelectCountry}
      component={SelectCountry}
      options={SelectCountry.navigationOptions as NativeStackNavigationOptions}
    />
    <Navigator.Screen
      name={Screens.SendConfirmationModal}
      component={SendConfirmation}
      options={sendConfirmationScreenNavOptions as NativeStackNavigationOptions}
    />
    <Navigator.Screen
      name={Screens.SendConfirmationLegacyModal}
      component={SendConfirmationLegacy}
      options={sendConfirmationLegacyScreenNavOptions as NativeStackNavigationOptions}
    />
  </>
)

const mainScreenNavOptions = () => ({
  ...modalScreenOptions(),
  headerShown: false,
})

function nativeBottomSheets(
  BottomSheet: typeof RootStack,
  handleContentLayout: (event: LayoutChangeEvent) => void
) {
  return (
    <>
      <BottomSheet.Screen name={Screens.WalletConnectRequest}>
        {(props) => <WalletConnectRequest handleContentLayout={handleContentLayout} {...props} />}
      </BottomSheet.Screen>
      <BottomSheet.Screen name={Screens.DappKitAccountScreen}>
        {(props) => <DappKitAccountScreen handleContentLayout={handleContentLayout} {...props} />}
      </BottomSheet.Screen>
      <BottomSheet.Screen name={Screens.DappKitSignTxScreen}>
        {(props) => <DappKitSignTxScreen handleContentLayout={handleContentLayout} {...props} />}
      </BottomSheet.Screen>
    </>
  )
}

function ModalStackScreen() {
  return (
    <ModalStack.Navigator>
      <ModalStack.Screen
        name={Screens.Main}
        component={MainStackScreen}
        options={mainScreenNavOptions as NativeStackNavigationOptions}
      />
      {modalAnimatedScreens(ModalStack)}
    </ModalStack.Navigator>
  )
}

function RootStackScreen() {
  const initialBottomSheetSnapPoints = React.useMemo(() => ['CONTENT_HEIGHT'], [])
  const { animatedHandleHeight, animatedSnapPoints, animatedContentHeight, handleContentLayout } =
    useBottomSheetDynamicSnapPoints(initialBottomSheetSnapPoints)

  const renderBackdrop = React.useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop opacity={0.25} appearsOnIndex={0} disappearsOnIndex={-1} {...props} />
    ),
    []
  )

  // Note: scrolling views inside bottom sheet screens should use the relevant
  // components from react-native-gesture-handler instead of directly from
  // react-native
  // https://github.com/osdnk/react-native-reanimated-bottom-sheet/issues/264#issuecomment-674757545
  return (
    <RootStack.Navigator
      screenOptions={{
        backdropComponent: renderBackdrop,
        handleHeight: animatedHandleHeight,
        snapPoints: animatedSnapPoints,
        contentHeight: animatedContentHeight,
      }}
    >
      <RootStack.Screen name={Screens.MainModal} component={ModalStackScreen} />
      {nativeBottomSheets(RootStack, handleContentLayout)}
    </RootStack.Navigator>
  )
}

export default RootStackScreen

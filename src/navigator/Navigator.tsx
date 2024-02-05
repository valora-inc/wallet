import { BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import {
  NativeStackNavigationOptions,
  createNativeStackNavigator,
} from '@react-navigation/native-stack'
import { createBottomSheetNavigator } from '@th3rdwave/react-navigation-bottom-sheet'
import * as React from 'react'
import { Platform } from 'react-native'
import SplashScreen from 'react-native-splash-screen'
import AccountKeyEducation from 'src/account/AccountKeyEducation'
import AccounSetupFailureScreen from 'src/account/AccountSetupFailureScreen'
import GoldEducation from 'src/account/GoldEducation'
import Licenses from 'src/account/Licenses'
import Profile from 'src/account/Profile'
import StoreWipeRecoveryScreen from 'src/account/StoreWipeRecoveryScreen'
import SupportContact from 'src/account/SupportContact'
import AppLoading from 'src/app/AppLoading'
import Debug from 'src/app/Debug'
import ErrorScreen from 'src/app/ErrorScreen'
import MultichainBeta from 'src/app/MultichainBeta'
import SanctionedCountryErrorScreen from 'src/app/SanctionedCountryErrorScreen'
import UpgradeScreen from 'src/app/UpgradeScreen'
import BackupComplete from 'src/backup/BackupComplete'
import BackupIntroduction from 'src/backup/BackupIntroduction'
import BackupPhrase, { navOptionsForBackupPhrase } from 'src/backup/BackupPhrase'
import BackupQuiz, { navOptionsForQuiz } from 'src/backup/BackupQuiz'
import ConsumerIncentivesHomeScreen from 'src/consumerIncentives/ConsumerIncentivesHomeScreen'
import DappKitAccountScreen from 'src/dappkit/DappKitAccountScreen'
import DappKitSignTxScreen from 'src/dappkit/DappKitSignTxScreen'
import DappShortcutTransactionRequest from 'src/dapps/DappShortcutTransactionRequest'
import DappShortcutsRewards from 'src/dapps/DappShortcutsRewards'
import EscrowedPaymentListScreen from 'src/escrow/EscrowedPaymentListScreen'
import ReclaimPaymentConfirmationScreen from 'src/escrow/ReclaimPaymentConfirmationScreen'
import BidaliScreen from 'src/fiatExchanges/BidaliScreen'
import CashInSuccess from 'src/fiatExchanges/CashInSuccess'
import CoinbasePayScreen from 'src/fiatExchanges/CoinbasePayScreen'
import ExchangeQR from 'src/fiatExchanges/ExchangeQR'
import ExternalExchanges, {
  externalExchangesScreenOptions,
} from 'src/fiatExchanges/ExternalExchanges'
import FiatExchangeAmount from 'src/fiatExchanges/FiatExchangeAmount'
import FiatExchangeCurrencyBottomSheet from 'src/fiatExchanges/FiatExchangeCurrencyBottomSheet'
import SelectProviderScreen from 'src/fiatExchanges/SelectProvider'
import SimplexScreen from 'src/fiatExchanges/SimplexScreen'
import Spend, { spendScreenOptions } from 'src/fiatExchanges/Spend'
import WithdrawSpend from 'src/fiatExchanges/WithdrawSpend'
import FiatDetailsScreen from 'src/fiatconnect/FiatDetailsScreen'
import KycLanding from 'src/fiatconnect/KycLanding'
import FiatConnectLinkAccountScreen from 'src/fiatconnect/LinkAccountScreen'
import FiatConnectRefetchQuoteScreen from 'src/fiatconnect/RefetchQuoteScreen'
import FiatConnectReviewScreen from 'src/fiatconnect/ReviewScreen'
import FiatConnectTransferStatusScreen from 'src/fiatconnect/TransferStatusScreen'
import KycDenied from 'src/fiatconnect/kyc/KycDenied'
import KycExpired from 'src/fiatconnect/kyc/KycExpired'
import KycPending from 'src/fiatconnect/kyc/KycPending'
import NotificationCenter from 'src/home/NotificationCenter'
import { currentLanguageSelector } from 'src/i18n/selectors'
import ImportWallet from 'src/import/ImportWallet'
import ImportSelect from 'src/importSelect/ImportSelect'
import KeylessBackupPhoneCodeInput from 'src/keylessBackup/KeylessBackupPhoneCodeInput'
import KeylessBackupPhoneInput from 'src/keylessBackup/KeylessBackupPhoneInput'
import KeylessBackupProgress from 'src/keylessBackup/KeylessBackupProgress'
import LinkPhoneNumber from 'src/keylessBackup/LinkPhoneNumber'
import SetUpKeylessBackup from 'src/keylessBackup/SetUpKeylessBackup'
import SignInWithEmail from 'src/keylessBackup/SignInWithEmail'
import WalletSecurityPrimer from 'src/keylessBackup/WalletSecurityPrimer'
import Language from 'src/language/Language'
import SelectLocalCurrency from 'src/localCurrency/SelectLocalCurrency'
import DrawerNavigator from 'src/navigator/DrawerNavigator'
import {
  emptyHeader,
  headerTransparentWithBack,
  headerWithBackButton,
  noHeader,
  nuxNavigationOptions,
} from 'src/navigator/Headers'
import QRNavigator from 'src/navigator/QRNavigator'
import { Screens } from 'src/navigator/Screens'
import { getInitialRoute } from 'src/navigator/initialRoute'
import { StackParamList } from 'src/navigator/types'
import NftsInfoCarousel from 'src/nfts/NftsInfoCarousel'
import ChooseYourAdventure from 'src/onboarding/ChooseYourAdventure'
import EnableBiometry from 'src/onboarding/registration/EnableBiometry'
import NameAndPicture from 'src/onboarding/registration/NameAndPicture'
import OnboardingRecoveryPhrase from 'src/onboarding/registration/OnboardingRecoveryPhrase'
import ProtectWallet from 'src/onboarding/registration/ProtectWallet'
import RegulatoryTerms from 'src/onboarding/registration/RegulatoryTerms'
import SelectCountry from 'src/onboarding/registration/SelectCountry'
import OnboardingSuccessScreen from 'src/onboarding/success/OnboardingSuccessScreen'
import Welcome from 'src/onboarding/welcome/Welcome'
import PincodeEnter from 'src/pincode/PincodeEnter'
import PincodeSet from 'src/pincode/PincodeSet'
import { RootState } from 'src/redux/reducers'
import { store } from 'src/redux/store'
import Send from 'src/send/Send'
import SendAmount from 'src/send/SendAmount'
import SendConfirmation, { sendConfirmationScreenNavOptions } from 'src/send/SendConfirmation'
import SendEnterAmount from 'src/send/SendEnterAmount'
import SendSelectRecipient from 'src/send/SendSelectRecipient'
import ValidateRecipientAccount, {
  validateRecipientAccountScreenNavOptions,
} from 'src/send/ValidateRecipientAccount'
import ValidateRecipientIntro, {
  validateRecipientIntroScreenNavOptions,
} from 'src/send/ValidateRecipientIntro'
import SwapScreen from 'src/swap/SwapScreen'
import AssetsScreen from 'src/tokens/Assets'
import TokenBalancesScreen from 'src/tokens/TokenBalances'
import TokenDetailsScreen from 'src/tokens/TokenDetails'
import TokenImportScreen from 'src/tokens/TokenImport'
import TransactionDetailsScreen from 'src/transactions/feed/TransactionDetailsScreen'
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
      <Navigator.Screen
        name={Screens.QRNavigator}
        component={QRNavigator}
        options={QRNavigator.navigationOptions as NativeStackNavigationOptions}
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
      name={Screens.ImportSelect}
      component={ImportSelect}
      options={ImportSelect.navigationOptions}
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
      name={Screens.SendSelectRecipient}
      component={SendSelectRecipient}
      options={SendSelectRecipient.navigationOptions as NativeStackNavigationOptions}
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
      name={Screens.SendEnterAmount}
      component={SendEnterAmount}
      options={noHeader}
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
    <Navigator.Screen
      name={Screens.DappShortcutsRewards}
      component={DappShortcutsRewards}
      options={headerWithBackButton}
    />
  </>
)

const backupScreens = (Navigator: typeof Stack) => (
  <>
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
    <Navigator.Screen
      name={Screens.AccountKeyEducation}
      component={AccountKeyEducation}
      options={AccountKeyEducation.navigationOptions as NativeStackNavigationOptions}
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
      // @ts-expect-error component type in native-stack v6
      name={Screens.CoinbasePayScreen}
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
    <Navigator.Screen
      name={Screens.WalletSecurityPrimer}
      options={headerWithBackButton}
      component={WalletSecurityPrimer}
    />
    <Navigator.Screen
      name={Screens.SetUpKeylessBackup}
      options={SetUpKeylessBackup.navigationOptions}
      component={SetUpKeylessBackup}
    />
    <Navigator.Screen
      name={Screens.SignInWithEmail}
      options={SignInWithEmail.navigationOptions}
      component={SignInWithEmail}
    />
    <Navigator.Screen
      name={Screens.KeylessBackupPhoneInput}
      options={KeylessBackupPhoneInput.navigationOptions}
      component={KeylessBackupPhoneInput}
    />
    <Navigator.Screen
      name={Screens.KeylessBackupPhoneCodeInput}
      options={{ headerStyle: {} }}
      component={KeylessBackupPhoneCodeInput}
    />
    <Navigator.Screen
      name={Screens.KeylessBackupProgress}
      options={{ headerStyle: {} }}
      component={KeylessBackupProgress}
    />
    <Navigator.Screen
      name={Screens.LinkPhoneNumber}
      options={{ headerStyle: {} }}
      component={LinkPhoneNumber}
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
      name={Screens.TransactionDetailsScreen}
      component={TransactionDetailsScreen}
      options={headerWithBackButton}
    />
    <Navigator.Screen
      name={Screens.GoldEducation}
      component={GoldEducation}
      options={GoldEducation.navigationOptions as NativeStackNavigationOptions}
    />
    <Navigator.Screen
      name={Screens.NotificationCenter}
      component={NotificationCenter}
      options={headerWithBackButton}
    />
    <Navigator.Screen
      name={Screens.MultichainBeta}
      component={MultichainBeta}
      options={MultichainBeta.navigationOptions}
    />
  </>
)

const swapScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen name={Screens.SwapScreenWithBack} component={SwapScreen} options={noHeader} />
  </>
)

const nftScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen
      name={Screens.NftsInfoCarousel}
      component={NftsInfoCarousel}
      options={headerTransparentWithBack}
    />
  </>
)

const assetScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen
      name={Screens.Assets}
      component={AssetsScreen}
      options={AssetsScreen.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.TokenDetails}
      component={TokenDetailsScreen}
      options={TokenDetailsScreen.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.TokenImport}
      component={TokenImportScreen}
      options={TokenImportScreen.navigationOptions}
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
    multichainBetaStatus: state.app.multichainBetaStatus,
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
      multichainBetaStatus,
    } = mapStateToProps(store.getState())

    const initialRoute: InitialRouteName = getInitialRoute({
      choseToRestoreAccount,
      language,
      acceptedTerms,
      pincodeType,
      account,
      hasSeenVerificationNux,
      recoveryPhraseInOnboardingStatus,
      multichainBetaStatus,
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
      {backupScreens(Stack)}
      {consumerIncentivesScreens(Stack)}
      {settingsScreens(Stack)}
      {generalScreens(Stack)}
      {swapScreens(Stack)}
      {nftScreens(Stack)}
      {assetScreens(Stack)}
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
      name={Screens.RegulatoryTerms}
      // @ts-expect-error component type in native-stack v6
      component={RegulatoryTerms}
      options={RegulatoryTerms.navigationOptions as NativeStackNavigationOptions}
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
  </>
)

const mainScreenNavOptions = () => ({
  headerShown: false,
})

function nativeBottomSheets(BottomSheet: typeof RootStack) {
  return (
    <>
      <BottomSheet.Screen name={Screens.WalletConnectRequest} component={WalletConnectRequest} />
      <BottomSheet.Screen name={Screens.DappKitAccountScreen} component={DappKitAccountScreen} />
      <BottomSheet.Screen name={Screens.DappKitSignTxScreen} component={DappKitSignTxScreen} />
      <BottomSheet.Screen
        name={Screens.DappShortcutTransactionRequest}
        component={DappShortcutTransactionRequest}
      />
      <BottomSheet.Screen
        name={Screens.FiatExchangeCurrencyBottomSheet}
        component={FiatExchangeCurrencyBottomSheet}
      />
    </>
  )
}

function ModalStackScreen() {
  return (
    <ModalStack.Navigator
      screenOptions={Platform.select({
        // iOS 13 modal presentation
        ios: {
          presentation: 'modal',
        },
      })}
    >
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
        enableDynamicSizing: true,
        snapPoints: ['CONTENT_HEIGHT'], // prevent bottom sheets from having an extra snap point at the default of 66%
      }}
    >
      <RootStack.Screen name={Screens.MainModal} component={ModalStackScreen} />
      {nativeBottomSheets(RootStack)}
    </RootStack.Navigator>
  )
}

export default RootStackScreen

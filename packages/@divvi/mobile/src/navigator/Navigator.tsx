import { BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { createBottomSheetNavigator } from '@interaxyz/react-navigation-bottom-sheet'
import {
  NativeStackNavigationOptions,
  createNativeStackNavigator,
} from '@react-navigation/native-stack'
import * as React from 'react'
import { Platform } from 'react-native'
import AccountKeyEducation from 'src/account/AccountKeyEducation'
import AccounSetupFailureScreen from 'src/account/AccountSetupFailureScreen'
import GoldEducation from 'src/account/GoldEducation'
import LegalSubmenu from 'src/account/LegalSubmenu'
import Licenses from 'src/account/Licenses'
import PreferencesSubmenu from 'src/account/PreferencesSubmenu'
import Profile from 'src/account/Profile'
import ProfileSubmenu from 'src/account/ProfileSubmenu'
import SecuritySubmenu from 'src/account/SecuritySubmenu'
import StoreWipeRecoveryScreen from 'src/account/StoreWipeRecoveryScreen'
import Support from 'src/account/Support'
import SupportContact from 'src/account/SupportContact'
import AppLoading from 'src/app/AppLoading'
import DebugImages from 'src/app/DebugImages'
import ErrorScreen from 'src/app/ErrorScreen'
import SanctionedCountryErrorScreen from 'src/app/SanctionedCountryErrorScreen'
import UpgradeScreen from 'src/app/UpgradeScreen'
import { getAppConfig } from 'src/appConfig'
import BackupComplete from 'src/backup/BackupComplete'
import BackupIntroduction from 'src/backup/BackupIntroduction'
import BackupPhrase, { navOptionsForBackupPhrase } from 'src/backup/BackupPhrase'
import BackupQuiz, { navOptionsForQuiz } from 'src/backup/BackupQuiz'
import DappShortcutTransactionRequest from 'src/dapps/DappShortcutTransactionRequest'
import DappShortcutsRewards from 'src/dapps/DappShortcutsRewards'
import DappsScreen from 'src/dapps/DappsScreen'
import EarnConfirmationScreen from 'src/earn/EarnConfirmationScreen'
import EarnEnterAmount from 'src/earn/EarnEnterAmount'
import EarnHome from 'src/earn/EarnHome'
import EarnInfoScreen from 'src/earn/EarnInfoScreen'
import EarnPoolInfoScreen from 'src/earn/poolInfoScreen/EarnPoolInfoScreen'
import BidaliScreen from 'src/fiatExchanges/BidaliScreen'
import CashInSuccess from 'src/fiatExchanges/CashInSuccess'
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
import Invite from 'src/invite/Invite'
import JumpstartEnterAmount from 'src/jumpstart/JumpstartEnterAmount'
import JumpstartSendConfirmation from 'src/jumpstart/JumpstartSendConfirmation'
import JumpstartShareLink from 'src/jumpstart/JumpstartShareLink'
import JumpstartTransactionDetailsScreen from 'src/jumpstart/JumpstartTransactionDetailsScreen'
import KeylessBackupIntro from 'src/keylessBackup/KeylessBackupIntro'
import KeylessBackupPhoneCodeInput from 'src/keylessBackup/KeylessBackupPhoneCodeInput'
import KeylessBackupPhoneInput from 'src/keylessBackup/KeylessBackupPhoneInput'
import KeylessBackupProgress from 'src/keylessBackup/KeylessBackupProgress'
import LinkPhoneNumber from 'src/keylessBackup/LinkPhoneNumber'
import SignInWithEmail from 'src/keylessBackup/SignInWithEmail'
import WalletSecurityPrimer from 'src/keylessBackup/WalletSecurityPrimer'
import { KeylessBackupFlow, KeylessBackupOrigin } from 'src/keylessBackup/types'
import Language from 'src/language/Language'
import SelectLocalCurrency from 'src/localCurrency/SelectLocalCurrency'
import DemoModeAuthBlock from 'src/navigator/DemoModeAuthBlock'
import {
  emptyHeader,
  headerWithBackButton,
  noHeader,
  nuxNavigationOptions,
} from 'src/navigator/Headers'
import QRNavigator from 'src/navigator/QRNavigator'
import { Screens } from 'src/navigator/Screens'
import SettingsMenu from 'src/navigator/SettingsMenu'
import TabNavigator from 'src/navigator/TabNavigator'
import { getInitialRoute } from 'src/navigator/initialRoute'
import { StackParamList } from 'src/navigator/types'
import NftsInfoCarousel from 'src/nfts/NftsInfoCarousel'
import EnableBiometry from 'src/onboarding/registration/EnableBiometry'
import ImportSelect from 'src/onboarding/registration/ImportSelect'
import OnboardingRecoveryPhrase from 'src/onboarding/registration/OnboardingRecoveryPhrase'
import ProtectWallet from 'src/onboarding/registration/ProtectWallet'
import RegulatoryTerms from 'src/onboarding/registration/RegulatoryTerms'
import SelectCountry from 'src/onboarding/registration/SelectCountry'
import OnboardingSuccessScreen from 'src/onboarding/success/OnboardingSuccessScreen'
import Welcome from 'src/onboarding/welcome/Welcome'
import PincodeEnter from 'src/pincode/PincodeEnter'
import PincodeSet from 'src/pincode/PincodeSet'
import PointsHome from 'src/points/PointsHome'
import PointsIntro from 'src/points/PointsIntro'
import { NavigatorScreen } from 'src/public/navigate'
import { RootState } from 'src/redux/reducers'
import { store } from 'src/redux/store'
import SendConfirmation, { sendConfirmationScreenNavOptions } from 'src/send/SendConfirmation'
import SendEnterAmount from 'src/send/SendEnterAmount'
import SendSelectRecipient from 'src/send/SendSelectRecipient'
import ValidateRecipientAccount, {
  validateRecipientAccountScreenNavOptions,
} from 'src/send/ValidateRecipientAccount'
import ValidateRecipientIntro, {
  validateRecipientIntroScreenNavOptions,
} from 'src/send/ValidateRecipientIntro'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import styles from 'src/styles/styles'
import variables from 'src/styles/variables'
import SwapScreen from 'src/swap/SwapScreen'
import SwapScreenV2 from 'src/swap/SwapScreenV2'
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
      <Navigator.Screen
        name={Screens.DebugImages}
        component={DebugImages}
        options={headerWithBackButton}
      />
      <Navigator.Screen
        name={Screens.WebViewScreen}
        component={WebViewScreen}
        options={emptyHeader}
      />
      <Navigator.Screen
        name={Screens.SanctionedCountryErrorScreen}
        component={SanctionedCountryErrorScreen}
        options={SanctionedCountryErrorScreen.navigationOptions}
      />
      <Navigator.Screen
        name={Screens.QRNavigator}
        component={QRNavigator}
        options={QRNavigator.navigationOptions}
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
        options={nuxNavigationOptions}
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
      name={Screens.SendSelectRecipient}
      component={SendSelectRecipient}
      options={SendSelectRecipient.navigationOptions as NativeStackNavigationOptions}
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
      name={Screens.SendEnterAmount}
      component={SendEnterAmount}
      options={noHeader}
    />
    <Navigator.Screen
      name={Screens.JumpstartEnterAmount}
      component={JumpstartEnterAmount}
      options={noHeader}
    />
    <Navigator.Screen
      name={Screens.JumpstartSendConfirmation}
      component={JumpstartSendConfirmation}
      options={headerWithBackButton}
    />
    <Navigator.Screen
      name={Screens.JumpstartShareLink}
      component={JumpstartShareLink}
      options={JumpstartShareLink.navigationOptions}
    />
  </>
)

const consumerIncentivesScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen
      name={Screens.DappShortcutsRewards}
      component={DappShortcutsRewards}
      options={headerWithBackButton}
    />
    <Navigator.Screen
      name={Screens.DappsScreen}
      component={DappsScreen}
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
    <Navigator.Screen options={noHeader} name={Screens.ProfileSubmenu} component={ProfileSubmenu} />
    <Navigator.Screen options={noHeader} name={Screens.LegalSubmenu} component={LegalSubmenu} />
    <Navigator.Screen
      options={noHeader}
      name={Screens.PreferencesSubmenu}
      component={PreferencesSubmenu}
    />
    <Navigator.Screen
      name={Screens.SecuritySubmenu}
      component={SecuritySubmenu}
      options={noHeader}
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
      name={Screens.KeylessBackupIntro}
      options={KeylessBackupIntro.navigationOptions}
      component={KeylessBackupIntro}
    />
    <Navigator.Screen
      name={Screens.SignInWithEmail}
      options={noHeader}
      component={SignInWithEmail}
      initialParams={{
        keylessBackupFlow: KeylessBackupFlow.Setup,
        origin: KeylessBackupOrigin.Onboarding,
      }}
    />
    <Navigator.Screen
      name={Screens.KeylessBackupPhoneInput}
      options={noHeader}
      component={KeylessBackupPhoneInput}
    />
    <Navigator.Screen
      name={Screens.KeylessBackupPhoneCodeInput}
      options={noHeader}
      component={KeylessBackupPhoneCodeInput}
    />
    <Navigator.Screen
      name={Screens.KeylessBackupProgress}
      options={noHeader}
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
      name={Screens.TransactionDetailsScreen}
      component={TransactionDetailsScreen}
      options={headerWithBackButton}
    />
    <Navigator.Screen
      name={Screens.JumpstartTransactionDetailsScreen}
      component={JumpstartTransactionDetailsScreen}
      options={noHeader}
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
      name={Screens.SettingsMenu}
      component={SettingsMenu}
      options={SettingsMenu.navigationOptions as NativeStackNavigationOptions}
    />
    <Navigator.Screen name={Screens.Invite} component={Invite} options={noHeader} />
    <Navigator.Screen name={Screens.Support} component={Support} options={noHeader} />
  </>
)

const earnScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen name={Screens.EarnHome} component={EarnHome} options={headerWithBackButton} />
    <Navigator.Screen
      name={Screens.EarnConfirmationScreen}
      component={EarnConfirmationScreen}
      options={headerWithBackButton}
    />
    <Navigator.Screen
      name={Screens.EarnEnterAmount}
      component={EarnEnterAmount}
      options={noHeader}
    />
    <Navigator.Screen
      name={Screens.EarnInfoScreen}
      component={EarnInfoScreen}
      options={EarnInfoScreen.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.EarnPoolInfoScreen}
      component={EarnPoolInfoScreen}
      options={headerWithBackButton}
    />
  </>
)

const swapScreens = (Navigator: typeof Stack) => {
  const showNewEnterAmountForSwap = getFeatureGate(
    StatsigFeatureGates.SHOW_NEW_ENTER_AMOUNT_FOR_SWAP
  )

  return (
    <>
      <Navigator.Screen
        name={Screens.SwapScreenWithBack}
        component={showNewEnterAmountForSwap ? SwapScreenV2 : SwapScreen}
        options={noHeader}
      />
    </>
  )
}

const nftScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen
      name={Screens.NftsInfoCarousel}
      component={NftsInfoCarousel}
      options={NftsInfoCarousel.navigationOptions as NativeStackNavigationOptions}
    />
  </>
)

const assetScreens = (Navigator: typeof Stack) => (
  <>
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

const pointsScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen name={Screens.PointsHome} component={PointsHome} options={noHeader} />
    <Navigator.Screen name={Screens.PointsIntro} component={PointsIntro} options={noHeader} />
  </>
)

const customScreens = (Navigator: typeof Stack) => {
  return getAppConfig().screens?.custom?.(Navigator.Screen as NavigatorScreen) ?? null
}

const mapStateToProps = (state: RootState) => {
  return {
    language: currentLanguageSelector(state),
    acceptedTerms: state.account.acceptedTerms,
    pincodeType: state.account.pincodeType,
    lastOnboardingStepScreen: state.account.lastOnboardingStepScreen as keyof StackParamList,
    onboardingCompleted: state.account.onboardingCompleted,
  }
}

type InitialRouteName = ExtractProps<typeof Stack.Navigator>['initialRouteName']

function MainStackScreen() {
  const [initialRouteName, setInitialRoute] = React.useState<InitialRouteName>(undefined)

  React.useEffect(() => {
    const { language, acceptedTerms, pincodeType, onboardingCompleted, lastOnboardingStepScreen } =
      mapStateToProps(store.getState())

    const initialRoute: InitialRouteName = getInitialRoute({
      language,
      acceptedTerms,
      pincodeType,
      onboardingCompleted,
      lastOnboardingStepScreen,
    })

    setInitialRoute(initialRoute)
    Logger.info(`${TAG}@MainStackScreen`, `Initial route: ${initialRoute}`)

    // Wait for next frame to avoid slight gap when hiding the
    // TODO: make this work with the expo splash screen
    // requestAnimationFrame(() => SplashScreen.hide())
  }, [])

  if (!initialRouteName) {
    return <AppLoading />
  }

  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={emptyHeader}>
      <Stack.Screen name={Screens.TabNavigator} component={TabNavigator} options={noHeader} />
      {commonScreens(Stack)}
      {sendScreens(Stack)}
      {nuxScreens(Stack)}
      {verificationScreens(Stack)}
      {backupScreens(Stack)}
      {consumerIncentivesScreens(Stack)}
      {settingsScreens(Stack)}
      {generalScreens(Stack)}
      {swapScreens(Stack)}
      {earnScreens(Stack)}
      {nftScreens(Stack)}
      {assetScreens(Stack)}
      {pointsScreens(Stack)}
      {customScreens(Stack)}
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
      // @ts-expect-error class component instead of functional component
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
      name={Screens.SendConfirmationFromExternal}
      component={SendConfirmation}
      options={sendConfirmationScreenNavOptions as NativeStackNavigationOptions}
    />
  </>
)

const mainScreenNavOptions = () => ({
  headerShown: false,
})

function nativeBottomSheets(BottomSheet: typeof RootStack) {
  // Note: scrolling views inside bottom sheet screens should use the relevant
  // components from gorhom/react-native-bottom-sheet instead of directly from
  // react-native

  return (
    <>
      <BottomSheet.Screen name={Screens.WalletConnectRequest} component={WalletConnectRequest} />
      <BottomSheet.Screen
        name={Screens.DappShortcutTransactionRequest}
        component={DappShortcutTransactionRequest}
      />
      <BottomSheet.Screen
        name={Screens.FiatExchangeCurrencyBottomSheet}
        component={FiatExchangeCurrencyBottomSheet}
      />
      <BottomSheet.Screen name={Screens.DemoModeAuthBlock} component={DemoModeAuthBlock} />
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
      <BottomSheetBackdrop
        {...props}
        style={[props.style, styles.bottomSheetBackdrop]}
        opacity={0.25}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
      />
    ),
    []
  )

  return (
    <RootStack.Navigator
      screenOptions={{
        backdropComponent: renderBackdrop,
        enableDynamicSizing: true,
        // use max height (similar as 90% snap point) for screens. when bottom sheets
        // take up the whole screen, it is no longer obvious that they are a bottom
        // sheet / how to navigate away
        maxDynamicContentSize: variables.height * 0.9,
        backgroundStyle: styles.bottomSheetBackground,
        handleIndicatorStyle: styles.bottomSheetHandleIndicator,
      }}
    >
      <RootStack.Screen name={Screens.MainModal} component={ModalStackScreen} />
      {nativeBottomSheets(RootStack)}
    </RootStack.Navigator>
  )
}

export default RootStackScreen

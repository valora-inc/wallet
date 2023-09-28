import { Countries } from '@celo/phone-utils'
import { AccountAuthRequest, SignTxRequest } from '@celo/utils'
import { KycSchema } from '@fiatconnect/fiatconnect-types'
import { SessionTypes } from '@walletconnect/types'
import { Web3WalletTypes } from '@walletconnect/web3wallet'
import BigNumber from 'bignumber.js'
import { SendOrigin, WalletConnectPairingOrigin } from 'src/analytics/types'
import { EscrowedPayment } from 'src/escrow/actions'
import { Props as KycLandingProps } from 'src/fiatconnect/KycLanding'
import { FiatAccount } from 'src/fiatconnect/slice'
import { ExternalExchangeProvider } from 'src/fiatExchanges/ExternalExchanges'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow, FiatExchangeFlow, SimplexQuote } from 'src/fiatExchanges/utils'
import { AddressValidationType } from 'src/identity/reducer'
import { KeylessBackupFlow } from 'src/keylessBackup/types'
import { Screens } from 'src/navigator/Screens'
import { Nft } from 'src/nfts/types'
import { Recipient } from 'src/recipients/recipient'
import { TransactionDataInput } from 'src/send/SendAmount'
import { QRCodeDataType, QRCodeStyle } from 'src/statsig/types'
import { AssetViewType } from 'src/tokens/TokenBalances'
import { Network, TokenTransaction } from 'src/transactions/types'
import { CiCoCurrency, Currency } from 'src/utils/currencies'
import { WalletConnectRequestType } from 'src/walletConnect/types'

// Typed nested navigator params
type NestedNavigatorParams<ParamList> = {
  [K in keyof ParamList]: undefined extends ParamList[K]
    ? { screen: K; params?: ParamList[K] }
    : { screen: K; params: ParamList[K] }
}[keyof ParamList]

interface SendConfirmationParams {
  origin: SendOrigin
  transactionData: TransactionDataInput
  isFromScan: boolean
}

export type StackParamList = {
  [Screens.BackupComplete]:
    | undefined
    | {
        navigatedFromSettings: boolean
      }
  [Screens.BackupIntroduction]:
    | {
        showDrawerTopBar: boolean
      }
    | undefined
  [Screens.AccountKeyEducation]:
    | undefined
    | {
        nextScreen: keyof StackParamList
      }
  [Screens.AccounSetupFailureScreen]: undefined
  [Screens.BackupPhrase]:
    | undefined
    | {
        navigatedFromSettings: boolean
      }
  [Screens.BackupQuiz]:
    | undefined
    | {
        navigatedFromSettings: boolean
      }
  [Screens.FiatDetailsScreen]: {
    quote: FiatConnectQuote
    flow: CICOFlow
  }
  [Screens.BidaliScreen]: { currency?: Currency }
  [Screens.CoinbasePayScreen]: { uri: string }
  [Screens.CashInSuccess]: { provider?: string }
  [Screens.ChooseYourAdventure]: undefined
  [Screens.ConsumerIncentivesHomeScreen]: undefined
  [Screens.DappKitAccountScreen]: {
    dappKitRequest: AccountAuthRequest
  }
  [Screens.DappKitSignTxScreen]: {
    dappKitRequest: SignTxRequest
  }
  [Screens.DAppsExplorerScreen]: undefined
  [Screens.DappShortcutsRewards]: undefined
  [Screens.DappShortcutTransactionRequest]: {
    rewardId: string
  }
  [Screens.Debug]: undefined
  [Screens.DrawerNavigator]: {
    initialScreen?: Screens
    fromModal?: boolean
  }
  [Screens.ErrorScreen]: {
    errorMessage?: string
  }
  [Screens.EscrowedPaymentListScreen]: undefined
  [Screens.ExchangeHomeScreen]: undefined
  [Screens.ExternalExchanges]: {
    isCashIn?: boolean
    currency: CiCoCurrency
    exchanges: ExternalExchangeProvider[]
  }
  [Screens.ExchangeQR]: {
    flow: CICOFlow
    exchanges: ExternalExchangeProvider[]
  }
  [Screens.FiatExchangeAmount]: {
    currency: CiCoCurrency
    flow: CICOFlow
    network: Network
  }
  [Screens.FiatExchangeCurrency]: {
    flow: FiatExchangeFlow
  }
  [Screens.FiatConnectLinkAccount]: {
    quote: FiatConnectQuote
    flow: CICOFlow
  }
  [Screens.FiatConnectReview]: {
    flow: CICOFlow
    normalizedQuote: FiatConnectQuote
    fiatAccount: FiatAccount
    shouldRefetchQuote?: boolean
  }
  [Screens.FiatConnectRefetchQuote]: {
    providerId: string
    kycSchema: KycSchema
  }
  [Screens.FiatConnectTransferStatus]: {
    flow: CICOFlow
    normalizedQuote: FiatConnectQuote
    fiatAccount: FiatAccount
  }
  [Screens.KeylessBackupPhoneCodeInput]: {
    keylessBackupFlow: KeylessBackupFlow
    e164Number: string
  }
  [Screens.KeylessBackupPhoneInput]: {
    keylessBackupFlow: KeylessBackupFlow
    selectedCountryCodeAlpha2?: string
  }
  [Screens.KeylessBackupProgress]: {
    keylessBackupFlow: KeylessBackupFlow
  }
  [Screens.KycDenied]: {
    flow: CICOFlow
    quote: FiatConnectQuote
    retryable: boolean
  }
  [Screens.KycExpired]: {
    flow: CICOFlow
    quote: FiatConnectQuote
  }
  [Screens.KycPending]: {
    flow: CICOFlow
    quote: FiatConnectQuote
  }
  [Screens.Simplex]: {
    simplexQuote: SimplexQuote
  }
  [Screens.GoldEducation]: undefined
  [Screens.ImportWallet]:
    | {
        clean: boolean
        showZeroBalanceModal?: boolean
      }
    | undefined
  [Screens.IncomingPaymentRequestListScreen]: undefined
  [Screens.Invite]: undefined
  [Screens.NameAndPicture]: undefined
  [Screens.EnableBiometry]: undefined
  [Screens.Language]:
    | {
        nextScreen: keyof StackParamList
      }
    | undefined
  [Screens.LanguageModal]:
    | {
        nextScreen: keyof StackParamList
      }
    | undefined
  [Screens.Licenses]: undefined
  [Screens.Main]: undefined
  [Screens.MainModal]: undefined
  [Screens.MerchantPayment]: { referenceId: string; apiBase: string }
  [Screens.NotificationCenter]: undefined
  [Screens.NftGallery]: undefined
  [Screens.NftsInfoCarousel]: { nfts: Nft[] }
  [Screens.OutgoingPaymentRequestListScreen]: undefined
  [Screens.PaymentRequestConfirmation]: {
    transactionData: TransactionDataInput
    isFromScan: boolean
  }
  [Screens.KycLanding]: KycLandingProps
  [Screens.PincodeEnter]: {
    withVerification?: boolean
    onSuccess: (pin: string) => void
    onCancel: () => void
    account?: string
  }
  [Screens.PincodeSet]:
    | {
        changePin?: boolean
        choseToRestoreAccount?: boolean
        registrationStep?: { step: number; totalSteps: number }
        showGuidedOnboarding?: boolean
      }
    | undefined
  [Screens.PhoneNumberLookupQuota]: {
    onBuy: () => void
    onSkip: () => void
  }
  [Screens.ProtectWallet]: undefined
  [Screens.OnboardingRecoveryPhrase]: undefined
  [Screens.Profile]: undefined
  [Screens.QRNavigator]: NestedNavigatorParams<QRTabParamList> | undefined
  [Screens.ReclaimPaymentConfirmationScreen]: {
    reclaimPaymentInput: EscrowedPayment
    onCancel?: () => void
  }
  [Screens.RegulatoryTerms]: undefined
  [Screens.SanctionedCountryErrorScreen]: undefined
  [Screens.SelectCountry]: {
    countries: Countries
    selectedCountryCodeAlpha2: string
    onSelectCountry(countryCode: string): void
  }
  [Screens.SelectLocalCurrency]: undefined
  [Screens.SelectProvider]: {
    flow: CICOFlow
    selectedCrypto: CiCoCurrency
    network: Network
    amount: {
      crypto: number
      fiat: number
    }
  }
  [Screens.Send]:
    | {
        isOutgoingPaymentRequest?: boolean
        skipContactsImport?: boolean
        forceTokenAddress?: boolean
        defaultTokenOverride?: string
      }
    | undefined
  [Screens.SendAmount]: {
    recipient: Recipient
    isOutgoingPaymentRequest?: boolean
    isFromScan: boolean
    origin: SendOrigin
    forceTokenAddress?: boolean
    defaultTokenOverride?: string
  }
  [Screens.SendConfirmation]: SendConfirmationParams
  [Screens.SendConfirmationModal]: SendConfirmationParams
  [Screens.Settings]: { promptConfirmRemovalModal?: boolean } | undefined
  [Screens.SetUpKeylessBackup]: undefined
  [Screens.SignInWithEmail]: {
    keylessBackupFlow: KeylessBackupFlow
  }
  [Screens.Spend]: undefined
  [Screens.StoreWipeRecoveryScreen]: undefined
  [Screens.Support]: undefined
  [Screens.SupportContact]:
    | {
        prefilledText: string
      }
    | undefined
  [Screens.SwapExecuteScreen]: undefined
  [Screens.SwapReviewScreen]: undefined
  [Screens.SwapScreenWithBack]: undefined
  [Screens.TransactionDetailsScreen]: {
    transaction: TokenTransaction
  }
  [Screens.UpgradeScreen]: undefined
  [Screens.ValidateRecipientIntro]: {
    transactionData: TransactionDataInput
    addressValidationType: AddressValidationType
    isOutgoingPaymentRequest?: true
    requesterAddress?: string
    origin: SendOrigin
  }
  [Screens.ValidateRecipientAccount]: {
    transactionData: TransactionDataInput
    addressValidationType: AddressValidationType
    isOutgoingPaymentRequest?: true
    requesterAddress?: string
    origin: SendOrigin
  }
  [Screens.VerificationStartScreen]:
    | {
        hideOnboardingStep?: boolean
        selectedCountryCodeAlpha2?: string
        choseToRestoreAccount?: boolean
      }
    | undefined
  [Screens.VerificationCodeInputScreen]: {
    registrationStep?: { step: number; totalSteps: number }
    e164Number: string
    countryCallingCode: string
  }
  [Screens.OnboardingSuccessScreen]: undefined
  [Screens.WalletConnectRequest]:
    | { type: WalletConnectRequestType.Loading; origin: WalletConnectPairingOrigin }
    | {
        type: WalletConnectRequestType.Action
        version: 2
        pendingAction: Web3WalletTypes.EventArguments['session_request']
        supportedChains: string[]
      }
    | {
        type: WalletConnectRequestType.Session
        version: 2
        pendingSession: Web3WalletTypes.EventArguments['session_proposal']
        namespacesToApprove: SessionTypes.Namespaces | null // if null, we need to reject the session
        supportedChains: string[]
      }
    | { type: WalletConnectRequestType.TimeOut }
  [Screens.WalletConnectSessions]: undefined
  [Screens.WalletHome]: undefined
  [Screens.WalletSecurityPrimer]: undefined
  [Screens.WalletSecurityPrimerDrawer]: { showDrawerTopBar: boolean }
  [Screens.WebViewScreen]: { uri: string; dappkitDeeplink?: string }
  [Screens.Welcome]: undefined
  [Screens.WithdrawCeloQrScannerScreen]: {
    onAddressScanned: (address: string) => void
  }
  [Screens.WithdrawCeloReviewScreen]: {
    amount: BigNumber
    recipientAddress: string
    feeEstimate: BigNumber
    isCashOut: boolean
  }
  [Screens.WithdrawCeloScreen]: {
    isCashOut: boolean
    amount?: BigNumber
    recipientAddress?: string
  }
  [Screens.WithdrawSpend]: undefined
  [Screens.TokenBalances]:
    | {
        activeView: AssetViewType
      }
    | undefined
}

export type QRTabParamList = {
  [Screens.QRCode]:
    | {
        qrCodeDataType?: QRCodeDataType
        qrCodeStyle?: QRCodeStyle
      }
    | undefined
  [Screens.QRScanner]:
    | {
        scanIsForSecureSend?: true
        transactionData?: TransactionDataInput
        isOutgoingPaymentRequest?: boolean
        requesterAddress?: string
      }
    | undefined
}

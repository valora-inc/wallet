import { Countries } from '@celo/phone-utils'
import { AccountAuthRequest, SignTxRequest } from '@celo/utils'
import { KycSchema } from '@fiatconnect/fiatconnect-types'
import { SignClientTypes } from '@walletconnect/types'
import BigNumber from 'bignumber.js'
import { SendOrigin, WalletConnectPairingOrigin } from 'src/analytics/types'
import { EscrowedPayment } from 'src/escrow/actions'
import { ExchangeConfirmationCardProps } from 'src/exchange/ExchangeConfirmationCard'
import { Props as KycLandingProps } from 'src/fiatconnect/KycLanding'
import { FiatAccount } from 'src/fiatconnect/slice'
import { ExternalExchangeProvider } from 'src/fiatExchanges/ExternalExchanges'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow, FiatExchangeFlow, SimplexQuote } from 'src/fiatExchanges/utils'
import { AddressValidationType } from 'src/identity/reducer'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { Screens } from 'src/navigator/Screens'
import { Recipient } from 'src/recipients/recipient'
import { TransactionDataInput } from 'src/send/SendAmount'
import {
  CurrencyInfo,
  TransactionDataInput as TransactionDataInputLegacy,
} from 'src/send/SendConfirmationLegacy'
import { ReviewProps } from 'src/transactions/TransactionReview'
import { TransferConfirmationCardProps } from 'src/transactions/TransferConfirmationCard'
import { TokenTransaction } from 'src/transactions/types'
import { CiCoCurrency, Currency } from 'src/utils/currencies'
import {
  PendingAction,
  WalletConnectRequestType,
  WalletConnectSessionRequest,
} from 'src/walletConnect/types'

// Typed nested navigator params
type NestedNavigatorParams<ParamList> = {
  [K in keyof ParamList]: undefined extends ParamList[K]
    ? { screen: K; params?: ParamList[K] }
    : { screen: K; params: ParamList[K] }
}[keyof ParamList]

interface SendConfirmationLegacyParams {
  origin: SendOrigin
  transactionData: TransactionDataInputLegacy
  addressJustValidated?: boolean
  isFromScan?: boolean
  currencyInfo?: CurrencyInfo
}

interface SendConfirmationParams {
  origin: SendOrigin
  transactionData: TransactionDataInput
  isFromScan?: boolean
}

interface SendConfirmationLegacyParams {
  origin: SendOrigin
  transactionData: TransactionDataInputLegacy
  addressJustValidated?: boolean
  isFromScan?: boolean
  currencyInfo?: CurrencyInfo
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
  [Screens.BackupForceScreen]: undefined
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
  [Screens.ConsumerIncentivesHomeScreen]: undefined
  [Screens.DappKitAccountScreen]: {
    dappKitRequest: AccountAuthRequest
  }
  [Screens.DappKitSignTxScreen]: {
    dappKitRequest: SignTxRequest
  }
  [Screens.DAppsExplorerScreen]: undefined
  [Screens.Debug]: undefined
  [Screens.DrawerNavigator]: undefined
  [Screens.ErrorScreen]: {
    errorMessage?: string
  }
  [Screens.EscrowedPaymentListScreen]: undefined
  [Screens.ExchangeHomeScreen]: undefined
  [Screens.ExchangeReview]: {
    makerToken: Currency
    takerToken: Currency
    celoAmount: BigNumber
    stableAmount: BigNumber
    inputToken: Currency
    inputTokenDisplayName: string
    inputAmount: BigNumber
  }
  [Screens.ExchangeTradeScreen]: {
    buyCelo: boolean
  }
  [Screens.ExternalExchanges]: {
    isCashIn?: boolean
    currency: Currency
    exchanges: ExternalExchangeProvider[]
  }
  [Screens.ExchangeQR]: {
    flow: CICOFlow
    exchanges: ExternalExchangeProvider[]
  }
  [Screens.FiatExchange]: undefined
  [Screens.FiatExchangeAmount]: {
    currency: Currency
    flow: CICOFlow
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
  [Screens.MoonPayScreen]: {
    localAmount: number
    currencyCode: LocalCurrencyCode
    currencyToBuy: CiCoCurrency
  }
  [Screens.XanpoolScreen]: {
    localAmount: number
    currencyCode: LocalCurrencyCode
    currencyToBuy: CiCoCurrency
  }
  [Screens.RampScreen]: {
    localAmount: number
    currencyCode: LocalCurrencyCode
    currencyToBuy: CiCoCurrency
  }
  [Screens.TransakScreen]: {
    localAmount: number
    currencyCode: LocalCurrencyCode
    currencyToBuy: CiCoCurrency
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
  [Screens.OutgoingPaymentRequestListScreen]: undefined
  [Screens.PaymentRequestConfirmation]: {
    transactionData: TransactionDataInput
  }
  [Screens.PaymentRequestConfirmationLegacy]: {
    transactionData: TransactionDataInputLegacy
    addressJustValidated?: boolean
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
  [Screens.PhotosEducation]: undefined
  [Screens.PhotosNUX]: undefined
  [Screens.Profile]: undefined
  [Screens.QRNavigator]: NestedNavigatorParams<QRTabParamList> | undefined
  [Screens.ReclaimPaymentConfirmationScreen]: {
    reclaimPaymentInput: EscrowedPayment
    onCancel?: () => void
  }
  [Screens.RegulatoryTerms]: undefined
  [Screens.SanctionedCountryErrorScreen]: undefined
  [Screens.SelectCountry]: {
    hideOnboardingStep: boolean
    countries: Countries
    selectedCountryCodeAlpha2: string
  }
  [Screens.SelectLocalCurrency]: undefined
  [Screens.SelectProvider]: {
    flow: CICOFlow
    selectedCrypto: Currency
    amount: {
      crypto: number
      fiat: number
    }
  }
  [Screens.Send]:
    | {
        isOutgoingPaymentRequest?: boolean
        skipContactsImport?: boolean
        forceTokenAddress?: string
      }
    | undefined
  [Screens.SendAmount]: {
    recipient: Recipient
    isOutgoingPaymentRequest?: boolean
    isFromScan?: boolean
    origin: SendOrigin
    forceTokenAddress?: string
  }
  [Screens.SendConfirmation]: SendConfirmationParams
  [Screens.SendConfirmationModal]: SendConfirmationParams
  [Screens.SendConfirmationLegacy]: SendConfirmationLegacyParams
  [Screens.SendConfirmationLegacyModal]: SendConfirmationLegacyParams
  [Screens.Settings]: { promptConfirmRemovalModal?: boolean } | undefined
  [Screens.ShakeForSupport]: undefined
  [Screens.Spend]: undefined
  [Screens.StoreWipeRecoveryScreen]: undefined
  [Screens.Support]: undefined
  [Screens.SupportContact]:
    | {
        prefilledText: string
      }
    | undefined
  [Screens.Sync]: undefined
  [Screens.SwapScreen]: undefined
  [Screens.SwapExecuteScreen]: undefined
  [Screens.SwapReviewScreen]: undefined
  [Screens.TransactionDetailsScreen]: {
    transaction: TokenTransaction
  }
  [Screens.TransactionReview]: {
    reviewProps: ReviewProps
    confirmationProps: TransferConfirmationCardProps | ExchangeConfirmationCardProps
  }
  [Screens.UpgradeScreen]: undefined
  [Screens.ValidateRecipientIntro]: {
    transactionData: TransactionDataInputLegacy | TransactionDataInput
    addressValidationType: AddressValidationType
    isOutgoingPaymentRequest?: true
    requesterAddress?: string
    origin: SendOrigin
  }
  [Screens.ValidateRecipientAccount]: {
    transactionData: TransactionDataInputLegacy | TransactionDataInput
    addressValidationType: AddressValidationType
    isOutgoingPaymentRequest?: true
    requesterAddress?: string
    origin: SendOrigin
  }
  [Screens.VerificationStartScreen]:
    | {
        showSkipDialog?: boolean
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
  [Screens.OnboardingEducationScreen]: undefined
  [Screens.OnboardingSuccessScreen]: undefined
  [Screens.WalletConnectRequest]:
    | { type: WalletConnectRequestType.Loading; origin: WalletConnectPairingOrigin }
    | { type: WalletConnectRequestType.Action; version: 1; pendingAction: PendingAction }
    | {
        type: WalletConnectRequestType.Action
        version: 2
        pendingAction: SignClientTypes.EventArguments['session_request']
      }
    | {
        type: WalletConnectRequestType.Session
        version: 1
        pendingSession: WalletConnectSessionRequest
      }
    | {
        type: WalletConnectRequestType.Session
        version: 2
        pendingSession: SignClientTypes.EventArguments['session_proposal']
      }
    | { type: WalletConnectRequestType.TimeOut }
  [Screens.WalletConnectSessions]: undefined
  [Screens.WalletHome]: undefined
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
  [Screens.TokenBalances]: undefined
}

export type QRTabParamList = {
  [Screens.QRCode]: undefined
  [Screens.QRScanner]:
    | {
        scanIsForSecureSend?: true
        transactionData?: TransactionDataInputLegacy | TransactionDataInput
        isOutgoingPaymentRequest?: boolean
        requesterAddress?: string
      }
    | undefined
}

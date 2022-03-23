import { AccountAuthRequest, Countries, SignTxRequest, TxToSignParam } from '@celo/utils'
import BigNumber from 'bignumber.js'
import { LinkError } from 'react-native-plaid-link-sdk'
import { KycStatus } from 'src/account/reducer'
import { SendOrigin, WalletConnectPairingOrigin } from 'src/analytics/types'
import { EscrowedPayment } from 'src/escrow/actions'
import { ExchangeConfirmationCardProps } from 'src/exchange/ExchangeConfirmationCard'
import { PaymentMethod } from 'src/fiatExchanges/FiatExchangeOptions'
import { SimplexQuote } from 'src/fiatExchanges/utils'
import { AddressValidationType } from 'src/identity/reducer'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { Screens } from 'src/navigator/Screens'
import { Recipient } from 'src/recipients/recipient'
import { TransactionDataInput } from 'src/send/SendAmount'
import { TransactionDataInput as TransactionDataInputLegacy } from 'src/send/SendAmountLegacy'
import { CurrencyInfo } from 'src/send/SendConfirmationLegacy'
import { ReviewProps } from 'src/transactions/TransactionReview'
import { TransferConfirmationCardProps } from 'src/transactions/TransferConfirmationCard'
import { TokenTransaction } from 'src/transactions/types'
import { CiCoCurrency, Currency } from 'src/utils/currencies'
import { PendingAction, PendingSession } from 'src/walletConnect/types'

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
        navigatedFromSettings?: boolean
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
  [Screens.BankAccounts]: {
    newPublicToken?: string
    fromSyncBankAccountScreen?: boolean
  }
  [Screens.BidaliScreen]: { currency?: Currency }
  [Screens.CashInSuccess]: { provider?: string }
  [Screens.ConsumerIncentivesHomeScreen]: undefined
  [Screens.DappKitAccountAuth]: {
    dappKitRequest: AccountAuthRequest
  }
  [Screens.DappKitSignTxScreen]: {
    dappKitRequest: SignTxRequest
  }
  [Screens.DappKitTxDataScreen]: {
    dappKitData: TxToSignParam['txData']
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
  }
  [Screens.FiatExchange]: undefined
  [Screens.FiatExchangeAmount]: {
    currency: Currency
    paymentMethod: PaymentMethod.Card | PaymentMethod.Bank
    isCashIn: boolean
  }
  [Screens.FiatExchangeOptions]: {
    isCashIn?: boolean
    amount?: BigNumber
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
    userIpAddress: string
  }
  [Screens.GoldEducation]: undefined
  [Screens.ImportWallet]:
    | {
        clean: boolean
        showZeroBalanceModal?: boolean
      }
    | undefined
  [Screens.IncomingPaymentRequestListScreen]: undefined
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
  [Screens.MerchantPayment]: { referenceId: string; apiBase: string }
  [Screens.OutgoingPaymentRequestListScreen]: undefined
  [Screens.PaymentRequestUnavailable]: {
    transactionData: TransactionDataInput | TransactionDataInputLegacy
  }
  [Screens.PaymentRequestConfirmation]: {
    transactionData: TransactionDataInput
  }
  [Screens.PaymentRequestConfirmationLegacy]: {
    transactionData: TransactionDataInputLegacy
    addressJustValidated?: boolean
  }
  [Screens.PincodeEnter]: {
    withVerification?: boolean
    onSuccess: (pin: string) => void
    onCancel: () => void
    account?: string
  }
  [Screens.PincodeSet]:
    | {
        isVerifying?: boolean
        changePin?: boolean
        komenciAvailable?: boolean
        choseToRestoreAccount?: boolean
        registrationStep?: { step: number; totalSteps: number }
      }
    | undefined
  [Screens.PhoneNumberLookupQuota]: {
    onBuy: () => void
    onSkip: () => void
  }
  [Screens.PhotosEducation]: undefined
  [Screens.PhotosNUX]: undefined
  [Screens.Profile]: undefined
  [Screens.ProviderOptionsScreen]: {
    isCashIn?: boolean
    selectedCrypto: Currency
    amount: {
      crypto: number
      fiat: number
    }
    paymentMethod: PaymentMethod.Card | PaymentMethod.Bank
  }
  [Screens.QRNavigator]: NestedNavigatorParams<QRTabParamList> | undefined
  [Screens.RaiseLimitScreen]: undefined
  [Screens.ReclaimPaymentConfirmationScreen]: {
    reclaimPaymentInput: EscrowedPayment
    onCancel?: () => void
  }
  [Screens.RegulatoryTerms]: undefined
  [Screens.SelectCountry]: {
    countries: Countries
    selectedCountryCodeAlpha2: string
  }
  [Screens.SelectLocalCurrency]: undefined
  [Screens.Send]:
    | {
        isOutgoingPaymentRequest?: boolean
        skipContactsImport?: boolean
        forceCurrency?: Currency
      }
    | undefined
  [Screens.SendAmount]: {
    recipient: Recipient
    isOutgoingPaymentRequest?: boolean
    isFromScan?: boolean
    origin: SendOrigin
    forceTokenAddress?: string
  }
  [Screens.SendAmountLegacy]: {
    recipient: Recipient
    isOutgoingPaymentRequest?: boolean
    isFromScan?: boolean
    origin: SendOrigin
    forceCurrency?: Currency
  }
  [Screens.SendConfirmation]: SendConfirmationParams
  [Screens.SendConfirmationModal]: SendConfirmationParams
  [Screens.SendConfirmationLegacy]: SendConfirmationLegacyParams
  [Screens.SendConfirmationLegacyModal]: SendConfirmationLegacyParams
  [Screens.SetClock]: undefined
  [Screens.Settings]:
    | { promptFornoModal?: boolean; promptConfirmRemovalModal?: boolean }
    | undefined
  [Screens.Spend]: undefined
  [Screens.StoreWipeRecoveryScreen]: undefined
  [Screens.Support]: undefined
  [Screens.SupportContact]:
    | {
        prefilledText: string
      }
    | undefined
  [Screens.Sync]: undefined
  [Screens.SyncBankAccountScreen]: {
    publicToken: string
  }
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
  [Screens.VerificationEducationScreen]:
    | {
        showSkipDialog?: boolean
        hideOnboardingStep?: boolean
        selectedCountryCodeAlpha2?: string
        choseToRestoreAccount?: boolean
      }
    | undefined
  [Screens.LinkBankAccountErrorScreen]:
    | {
        error?: Error | LinkError
      }
    | undefined
  [Screens.LinkBankAccountScreen]: { kycStatus: KycStatus | undefined }
  [Screens.ConnectPhoneNumberScreen]: undefined
  [Screens.VerificationInputScreen]:
    | {
        showHelpDialog?: boolean
        choseToRestoreAccount?: boolean
        registrationStep?: { step: number; totalSteps: number }
      }
    | undefined
  [Screens.VerificationLoadingScreen]: { withoutRevealing: boolean }
  [Screens.OnboardingEducationScreen]: undefined
  [Screens.OnboardingSuccessScreen]: undefined
  [Screens.WalletConnectLoading]: { origin: WalletConnectPairingOrigin }
  [Screens.WalletConnectResult]: {
    title: string
    subtitle: string
  }
  [Screens.WalletConnectSessionRequest]: PendingSession
  [Screens.WalletConnectSessions]: undefined
  [Screens.WalletConnectActionRequest]: PendingAction & {
    dappName: string
    dappUrl: string
    dappIcon: string
  }
  [Screens.WalletHome]: undefined
  [Screens.WebViewScreen]: { uri: string; headerTitle?: string }
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

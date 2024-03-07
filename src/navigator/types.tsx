import { Countries } from '@celo/phone-utils'
import { AccountAuthRequest, SignTxRequest } from '@celo/utils'
import { KycSchema } from '@fiatconnect/fiatconnect-types'
import { SendOrigin, WalletConnectPairingOrigin } from 'src/analytics/types'
import { EscrowedPayment } from 'src/escrow/actions'
import { ExternalExchangeProvider } from 'src/fiatExchanges/ExternalExchanges'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow, FiatExchangeFlow, SimplexQuote } from 'src/fiatExchanges/utils'
import { Props as KycLandingProps } from 'src/fiatconnect/KycLanding'
import { FiatAccount } from 'src/fiatconnect/slice'
import { KeylessBackupFlow } from 'src/keylessBackup/types'
import { Screens } from 'src/navigator/Screens'
import { Nft } from 'src/nfts/types'
import { Recipient } from 'src/recipients/recipient'
import { QrCode, TransactionDataInput } from 'src/send/types'
import { AssetTabType } from 'src/tokens/Assets'
import { NetworkId, TokenTransaction } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'
import { ActionRequestProps } from 'src/walletConnect/screens/ActionRequest'
import { SessionRequestProps } from 'src/walletConnect/screens/SessionRequest'
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

type SendEnterAmountParams = {
  recipient: Recipient & { address: string }
  isFromScan: boolean
  origin: SendOrigin
  forceTokenId?: boolean
  defaultTokenIdOverride?: string
}

interface ValidateRecipientParams {
  requesterAddress?: string
  origin: SendOrigin
  recipient: Recipient
  forceTokenId?: boolean
  defaultTokenIdOverride?: string
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
    tokenId: string
    exchanges: ExternalExchangeProvider[]
  }
  [Screens.ExchangeQR]: {
    flow: CICOFlow
    exchanges: ExternalExchangeProvider[]
  }
  [Screens.FiatExchangeAmount]: {
    tokenId: string
    flow: CICOFlow
    tokenSymbol: string
  }
  [Screens.FiatExchangeCurrency]: {
    flow: FiatExchangeFlow
  }
  [Screens.FiatExchangeCurrencyBottomSheet]: {
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
  [Screens.KeylessBackupIntro]: {
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
    tokenId: string
  }
  [Screens.GoldEducation]: undefined
  [Screens.ImportSelect]: undefined
  [Screens.ImportWallet]:
    | {
        clean: boolean
        showZeroBalanceModal?: boolean
      }
    | undefined
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
  [Screens.LinkPhoneNumber]: undefined
  [Screens.Main]: undefined
  [Screens.MainModal]: undefined
  [Screens.MultichainBeta]: undefined
  [Screens.NotificationCenter]: undefined
  [Screens.NftsInfoCarousel]: { nfts: Nft[]; networkId: NetworkId }
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
    tokenId: string
    amount: {
      crypto: number
      fiat: number
    }
  }
  [Screens.SendSelectRecipient]:
    | {
        forceTokenId?: boolean
        defaultTokenIdOverride?: string
      }
    | undefined
  [Screens.SendConfirmation]: SendConfirmationParams
  [Screens.SendConfirmationModal]: SendConfirmationParams
  [Screens.SendEnterAmount]: SendEnterAmountParams
  [Screens.JumpstartEnterAmount]: undefined
  [Screens.JumpstartSendConfirmation]: {
    link: string
    sendAmount: string
    tokenId: string
    preparedTransactions: SerializableTransactionRequest[]
  }
  [Screens.Settings]: { promptConfirmRemovalModal?: boolean } | undefined
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
  [Screens.SwapScreenWithBack]: { fromTokenId: string } | undefined
  [Screens.TokenDetails]: { tokenId: string }
  [Screens.TokenImport]: undefined
  [Screens.TransactionDetailsScreen]: {
    transaction: TokenTransaction
  }
  [Screens.UpgradeScreen]: undefined
  [Screens.ValidateRecipientIntro]: ValidateRecipientParams
  [Screens.ValidateRecipientAccount]: ValidateRecipientParams
  [Screens.VerificationStartScreen]:
    | {
        hasOnboarded?: boolean
        selectedCountryCodeAlpha2?: string
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
    | ({
        type: WalletConnectRequestType.Action
      } & ActionRequestProps)
    | ({
        type: WalletConnectRequestType.Session
      } & SessionRequestProps)
    | { type: WalletConnectRequestType.TimeOut }
  [Screens.WalletConnectSessions]: undefined
  [Screens.WalletHome]: undefined
  [Screens.WalletSecurityPrimer]: undefined
  [Screens.WalletSecurityPrimerDrawer]: { showDrawerTopBar: boolean }
  [Screens.WebViewScreen]: { uri: string; dappkitDeeplink?: string }
  [Screens.Welcome]: undefined
  [Screens.WithdrawSpend]: undefined
  [Screens.Assets]:
    | {
        activeTab: AssetTabType
      }
    | undefined
}

export type QRTabParamList = {
  [Screens.QRCode]:
    | {
        showSecureSendStyling?: true
      }
    | undefined
  [Screens.QRScanner]:
    | {
        showSecureSendStyling?: true
        onQRCodeDetected?: (qrCode: QrCode) => void
      }
    | undefined
}

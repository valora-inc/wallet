import { DappKitRequestTypes } from '@celo/utils'
import { check } from 'react-native-permissions'
import { PincodeType } from 'src/account/reducer'
import {
  AppEvents,
  AuthenticationEvents,
  CeloExchangeEvents,
  CICOEvents,
  ContractKitEvents,
  DappExplorerEvents,
  DappKitEvents,
  EscrowEvents,
  FeeEvents,
  FiatExchangeEvents,
  GethEvents,
  HomeEvents,
  IdentityEvents,
  InviteEvents,
  KolektivoNotificationEvents,
  NavigationEvents,
  NetworkEvents,
  OnboardingEvents,
  PerformanceEvents,
  RequestEvents,
  RewardsEvents,
  SendEvents,
  SettingsEvents,
  TransactionEvents,
  VerificationEvents,
  WalletConnectEvents,
} from 'src/analytics/Events'
import {
  BackQuizProgress,
  DappRequestOrigin,
  ScrollDirection,
  SendOrigin,
  WalletConnectPairingOrigin,
} from 'src/analytics/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { DappSection } from 'src/app/reducers'
import { TokenPickerOrigin } from 'src/components/TokenBottomSheet'
import {
  RewardsScreenCta,
  RewardsScreenOrigin,
} from 'src/consumerIncentives/analyticsEventsTracker'
import { InputToken } from 'src/exchange/ExchangeTradeScreen'
import { CICOFlow, FiatExchangeFlow, PaymentMethod } from 'src/fiatExchanges/utils'
import { NotificationBannerCTATypes, NotificationBannerTypes } from 'src/home/NotificationBox'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { NotificationReceiveState } from 'src/notifications/types'
import { RecipientType } from 'src/recipients/recipient'
import { Currency, StableCurrency } from 'src/utils/currencies'
import { Awaited } from 'src/utils/typescript'

type PermissionStatus = Awaited<ReturnType<typeof check>>

interface AppEventsProperties {
  [AppEvents.app_launched]: {
    // TODO: Figure out how to measure loadingDuration iOS and make param required
    reactLoadDuration?: number
    appLoadDuration?: number
    deviceInfo?: object
    deviceHeight: number
    deviceWidth: number
    language: string | null
  }
  [AppEvents.app_state_error]: {
    error: string
  }
  [AppEvents.error_displayed]: {
    error: string
  }
  [AppEvents.error_fallback]: {
    error: ErrorMessages
  }
  [AppEvents.error_boundary]: {
    error: string
  }
  [AppEvents.user_restart]: undefined
  [AppEvents.fetch_balance]: {
    dollarBalance?: string
    goldBalance?: string
  }
  [AppEvents.fetch_balance_error]: {
    dollarBalance?: string
    goldBalance?: string
    error?: string
  }
  [AppEvents.redux_keychain_mismatch]: {
    account: string
  }
  [AppEvents.redux_store_recovery_success]: {
    account: string
  }
  [AppEvents.redux_no_matching_keychain_account]: {
    walletAddress: string
  }
  [AppEvents.push_notification_opened]: {
    id?: string
    state: NotificationReceiveState
    type?: string
  }
  [AppEvents.android_mobile_services_availability_checked]: {
    googleIsAvailable: boolean | undefined
    huaweiIsAvailable: boolean | undefined
  }
  [AppEvents.request_tracking_permission_started]: {
    currentPermission: PermissionStatus
  }
  [AppEvents.request_tracking_permission_declined]: {
    newPermission: PermissionStatus
  }
  [AppEvents.request_tracking_permission_accepted]: {
    newPermission: 'granted'
  }
  [AppEvents.account_funded]: undefined
  [AppEvents.account_liquidated]: undefined
}

interface HomeEventsProperties {
  [HomeEvents.home_send]: undefined
  [HomeEvents.home_request]: undefined
  [HomeEvents.home_qr]: undefined
  [HomeEvents.hamburger_tapped]: undefined
  [HomeEvents.drawer_navigation]: {
    navigateTo: string
  }
  [HomeEvents.drawer_address_copy]: undefined

  [HomeEvents.notification_scroll]: {
    // TODO: Pass in notificationType and make param required
    notificationType?: NotificationBannerTypes
    direction: ScrollDirection
  }
  [HomeEvents.notification_select]: {
    notificationType: NotificationBannerTypes
    selectedAction: NotificationBannerCTATypes
    notificationId?: string
  }
  [HomeEvents.notification_impression]: {
    notificationId: string
  }
  [HomeEvents.transaction_feed_item_select]: undefined
  [HomeEvents.transaction_feed_address_copy]: undefined
  [HomeEvents.view_token_balances]: { totalBalance?: string }
}

interface SettingsEventsProperties {
  [SettingsEvents.settings_profile_edit]: undefined
  [SettingsEvents.settings_profile_name_edit]: undefined
  [SettingsEvents.language_select]: {
    language: string
  }
  [SettingsEvents.settings_verify_number]: undefined
  [SettingsEvents.pin_require_on_load]: {
    enabled: boolean
  }
  [SettingsEvents.forno_toggle]: {
    enabled: boolean
  }
  [SettingsEvents.licenses_view]: undefined
  [SettingsEvents.tos_view]: undefined
  [SettingsEvents.start_account_removal]: undefined
  [SettingsEvents.completed_account_removal]: undefined
  [SettingsEvents.change_pin_start]: undefined
  [SettingsEvents.change_pin_current_pin_entered]: undefined
  [SettingsEvents.change_pin_current_pin_error]: undefined
  [SettingsEvents.change_pin_new_pin_entered]: undefined
  [SettingsEvents.change_pin_new_pin_confirmed]: undefined
  [SettingsEvents.change_pin_new_pin_error]: undefined
  [SettingsEvents.settings_link_bank_account]: undefined
  [SettingsEvents.settings_biometry_opt_in_enable]: undefined
  [SettingsEvents.settings_biometry_opt_in_complete]: undefined
  [SettingsEvents.settings_biometry_opt_in_error]: undefined
  [SettingsEvents.settings_biometry_opt_in_disable]: undefined
}

interface OnboardingEventsProperties {
  [OnboardingEvents.onboarding_education_start]: undefined
  [OnboardingEvents.onboarding_education_scroll]: {
    currentStep: number
    direction: ScrollDirection
  }
  [OnboardingEvents.onboarding_education_complete]: undefined
  [OnboardingEvents.onboarding_education_cancel]: undefined

  [OnboardingEvents.create_account_start]: undefined
  [OnboardingEvents.create_account_cancel]: undefined

  [OnboardingEvents.restore_account_start]: undefined
  [OnboardingEvents.restore_account_cancel]: undefined

  [OnboardingEvents.backup_education_start]: undefined
  [OnboardingEvents.backup_education_scroll]: {
    currentStep: number
    direction: ScrollDirection
  }
  [OnboardingEvents.backup_education_complete]: undefined
  [OnboardingEvents.backup_education_cancel]: undefined

  [OnboardingEvents.backup_start]: undefined
  [OnboardingEvents.backup_continue]: undefined
  [OnboardingEvents.backup_complete]: undefined
  [OnboardingEvents.backup_more_info]: undefined
  [OnboardingEvents.backup_delay]: undefined
  [OnboardingEvents.backup_delay_confirm]: undefined
  [OnboardingEvents.backup_delay_cancel]: undefined
  [OnboardingEvents.backup_cancel]: undefined
  [OnboardingEvents.backup_error]: {
    error: string
    context?: string
  }

  [OnboardingEvents.backup_quiz_start]: undefined
  [OnboardingEvents.backup_quiz_progress]: {
    action: BackQuizProgress
  }
  [OnboardingEvents.backup_quiz_complete]: undefined
  [OnboardingEvents.backup_quiz_incorrect]: undefined

  [OnboardingEvents.terms_and_conditions_accepted]: undefined

  [OnboardingEvents.celo_education_start]: undefined
  [OnboardingEvents.celo_education_scroll]: {
    currentStep: number
    direction: ScrollDirection
  }
  [OnboardingEvents.celo_education_complete]: undefined
  [OnboardingEvents.celo_education_cancel]: undefined

  [OnboardingEvents.name_and_picture_set]: {
    includesPhoto: boolean
    profilePictureSkipped: boolean
  }
  [OnboardingEvents.phone_number_set]: {
    countryCode: string
    country?: string
  }

  [OnboardingEvents.pin_set]: undefined
  [OnboardingEvents.pin_invalid]: {
    error: string
  }
  [OnboardingEvents.pin_failed_to_set]: {
    pincodeType: PincodeType
    error: string
  }
  [OnboardingEvents.pin_never_set]: undefined

  [OnboardingEvents.biometry_opt_in_start]: undefined
  [OnboardingEvents.biometry_opt_in_cancel]: undefined
  [OnboardingEvents.biometry_opt_in_approve]: undefined
  [OnboardingEvents.biometry_opt_in_complete]: undefined
  [OnboardingEvents.biometry_opt_in_error]: undefined

  [OnboardingEvents.wallet_import_start]: undefined
  [OnboardingEvents.wallet_import_phrase_updated]: {
    wordCount: number
    wordCountChange: number
  }
  [OnboardingEvents.wallet_import_submit]: {
    useEmptyWallet: boolean
  }
  [OnboardingEvents.wallet_import_cancel]: undefined
  [OnboardingEvents.wallet_import_zero_balance]: {
    account: string
  }
  [OnboardingEvents.wallet_import_phrase_invalid]: {
    wordCount: number
    invalidWordCount: number | undefined
  }
  [OnboardingEvents.wallet_import_phrase_correction_attempt]: undefined
  [OnboardingEvents.wallet_import_phrase_correction_success]: {
    attemptNumber: number
  }
  [OnboardingEvents.wallet_import_phrase_correction_failed]: {
    timeout: boolean
    error?: string
  }
  [OnboardingEvents.wallet_import_error]: {
    error: string
  }
  [OnboardingEvents.wallet_import_success]: undefined

  [OnboardingEvents.invite_redeem_start]: undefined
  [OnboardingEvents.invite_redeem_complete]: undefined
  [OnboardingEvents.invite_redeem_cancel]: undefined
  [OnboardingEvents.invite_redeem_timeout]: undefined
  [OnboardingEvents.invite_redeem_error]: {
    error: string
  }
  [OnboardingEvents.invite_redeem_move_funds_start]: undefined
  [OnboardingEvents.invite_redeem_move_funds_complete]: undefined

  [OnboardingEvents.initialize_account_start]: undefined
  [OnboardingEvents.initialize_account_complete]: undefined
  [OnboardingEvents.initialize_account_error]: {
    error: string
  }

  [OnboardingEvents.escrow_redeem_start]: undefined
  [OnboardingEvents.escrow_redeem_complete]: undefined
  [OnboardingEvents.escrow_redeem_error]: {
    error: string
  }

  [OnboardingEvents.account_dek_register_start]:
    | {
        feeless?: boolean
      }
    | undefined
  [OnboardingEvents.account_dek_register_account_unlocked]:
    | {
        feeless?: boolean
      }
    | undefined
  [OnboardingEvents.account_dek_register_account_checked]:
    | {
        feeless?: boolean
      }
    | undefined
  [OnboardingEvents.account_dek_register_complete]: {
    newRegistration: boolean
    feeless?: boolean
  }
}

interface VerificationEventsProperties {
  [VerificationEvents.verification_start]:
    | {
        feeless?: boolean
      }
    | undefined
  [VerificationEvents.verification_complete]:
    | {
        feeless?: boolean
      }
    | undefined
  [VerificationEvents.verification_error]: {
    error: string
    feeless?: true
  }
  [VerificationEvents.verification_cancel]:
    | {
        feeless?: boolean
      }
    | undefined
  [VerificationEvents.verification_timeout]:
    | {
        feeless?: boolean
      }
    | undefined
  [VerificationEvents.verification_hash_cached]: {
    phoneHash: string
    address: string
  }
  [VerificationEvents.verification_hash_retrieved]: {
    phoneHash: string
    address: string
    feeless?: boolean
  }
  [VerificationEvents.verification_request_all_attestations_start]: {
    attestationsToRequest: number
    feeless?: boolean
  }
  [VerificationEvents.verification_request_all_attestations_refresh_progress]: {
    attestationsRemaining: number
    feeless?: boolean
  }
  [VerificationEvents.verification_request_all_attestations_complete]: {
    issuers: string[]
    feeless?: boolean
  }

  [VerificationEvents.verification_request_attestation_start]: {
    currentAttestation: number
    feeless?: boolean
  }
  [VerificationEvents.verification_request_attestation_approve_tx_sent]:
    | {
        feeless?: boolean
      }
    | undefined
  [VerificationEvents.verification_request_attestation_request_tx_sent]:
    | {
        feeless?: boolean
      }
    | undefined
  [VerificationEvents.verification_request_attestation_await_issuer_selection]:
    | {
        feeless?: boolean
      }
    | undefined
  [VerificationEvents.verification_request_attestation_select_issuer]:
    | {
        feeless?: boolean
      }
    | undefined
  [VerificationEvents.verification_request_attestation_issuer_tx_sent]:
    | {
        feeless?: boolean
      }
    | undefined
  [VerificationEvents.verification_request_attestation_complete]:
    | {
        feeless?: boolean
      }
    | undefined
  [VerificationEvents.verification_code_received]: {
    context?: string
    feeless?: boolean
  }
  [VerificationEvents.verification_code_validate_start]: {
    issuer: any
    feeless?: boolean
  }
  [VerificationEvents.verification_code_validate_complete]: {
    issuer: any
    feeless?: boolean
  }
  [VerificationEvents.verification_reveal_all_attestations_start]:
    | {
        feeless?: boolean
      }
    | undefined
  [VerificationEvents.verification_reveal_attestation_revealed]: {
    issuer: any
    neededRetry: boolean
    feeless?: boolean
    account?: string
    phoneNumberType?: string
    credentials?: string
  }
  [VerificationEvents.verification_reveal_attestation_await_code_start]: {
    issuer: any
    feeless?: boolean
  }
  [VerificationEvents.verification_reveal_all_attestations_complete]:
    | {
        feeless?: boolean
      }
    | undefined

  [VerificationEvents.verification_reveal_attestation_start]: {
    issuer: any
    feeless?: boolean
  }
  [VerificationEvents.verification_reveal_attestation_await_code_complete]: {
    issuer: any
    position: number
    feeless?: boolean
  }
  [VerificationEvents.verification_reveal_attestation_complete]: {
    issuer: any
    position: number
    feeless?: boolean
  }
  [VerificationEvents.verification_reveal_attestation_error]: {
    issuer: any
    error: string
    feeless?: boolean
  }
  [VerificationEvents.verification_reveal_attestation_status]: {
    success: boolean
    identifier: string
    account: string
    issuer: string
    attempt: number
    countryCode: string
    status: string
    provider: string
    duration: number
    errors: any
    feeless?: boolean
  }
  [VerificationEvents.verification_revoke_start]:
    | {
        feeless?: boolean
      }
    | undefined
  [VerificationEvents.verification_revoke_finish]:
    | {
        feeless?: boolean
      }
    | undefined
  [VerificationEvents.verification_revoke_error]: {
    error: string
    feeless?: boolean
  }
  [VerificationEvents.verification_resend_messages]: {
    count: number
    feeless?: boolean
  }
  [VerificationEvents.verification_recaptcha_started]: undefined
  [VerificationEvents.verification_recaptcha_skipped]: undefined
  [VerificationEvents.verification_recaptcha_success]: undefined
  [VerificationEvents.verification_recaptcha_failure]: undefined
  [VerificationEvents.verification_recaptcha_canceled]: undefined
  [VerificationEvents.verification_session_started]: undefined
  [VerificationEvents.verification_already_completed]: { mtwAddress: string }
  [VerificationEvents.verification_mtw_fetch_start]: { unverifiedMtwAddress: string }
  [VerificationEvents.verification_mtw_fetch_success]: { mtwAddress: string }
  [VerificationEvents.verification_fetch_on_chain_data_start]: undefined
  [VerificationEvents.verification_fetch_on_chain_data_success]: {
    attestationsRemaining: number
    actionableAttestations: number
  }
}

interface IdentityEventsProperties {
  [IdentityEvents.contacts_connect]: {
    matchMakingEnabled: boolean
  }
  [IdentityEvents.contacts_import_permission_denied]: undefined
  [IdentityEvents.contacts_import_start]: undefined
  [IdentityEvents.contacts_import_complete]: {
    contactImportCount: number
  }
  [IdentityEvents.contacts_processing_complete]: undefined
  [IdentityEvents.contacts_matchmaking_complete]: {
    matchCount: number
  }
  [IdentityEvents.contacts_import_error]: {
    error: string
  }

  [IdentityEvents.phone_number_lookup_start]: undefined
  [IdentityEvents.phone_number_lookup_complete]: undefined
  [IdentityEvents.phone_number_lookup_error]: {
    error: string
  }

  [IdentityEvents.phone_number_lookup_purchase_complete]: undefined
  [IdentityEvents.phone_number_lookup_purchase_error]: {
    error: string
  }
  [IdentityEvents.phone_number_lookup_purchase_skip]: undefined
}

interface AuthenticationEventsProperties {
  [AuthenticationEvents.get_pincode_start]: undefined
  [AuthenticationEvents.get_pincode_complete]: undefined
  [AuthenticationEvents.get_pincode_error]: undefined

  [AuthenticationEvents.get_pincode_with_biometry_start]: undefined
  [AuthenticationEvents.get_pincode_with_biometry_complete]: undefined
  [AuthenticationEvents.get_pincode_with_biometry_error]: undefined

  [AuthenticationEvents.get_pincode_with_input_start]: undefined
  [AuthenticationEvents.get_pincode_with_input_complete]: undefined
  [AuthenticationEvents.get_pincode_with_input_error]: undefined
}

interface InviteEventsProperties {
  [InviteEvents.invite_tx_start]: {
    escrowIncluded: boolean
  }
  [InviteEvents.invite_tx_complete]: {
    escrowIncluded: boolean
  }
  [InviteEvents.invite_tx_error]: {
    escrowIncluded: boolean
    error: string
  }
  [InviteEvents.invite_start]: {
    amount: string
    tokenAddress: string
    usdAmount?: string
  }
  [InviteEvents.invite_complete]: {
    amount: string
    tokenAddress: string
    usdAmount?: string
  }
  [InviteEvents.invite_error]: {
    amount: string
    tokenAddress: string
    usdAmount?: string
    error: string
  }
  [InviteEvents.invite_method_sms]: undefined
  [InviteEvents.invite_method_whatsapp]: undefined
  [InviteEvents.invite_method_error]: {
    error: string
  }
  [InviteEvents.invite_from_menu]: undefined
  [InviteEvents.invite_banner_impression]: undefined
}

interface EscrowEventsProperties {
  [EscrowEvents.escrow_transfer_start]: undefined
  [EscrowEvents.escrow_transfer_approve_tx_sent]: undefined
  [EscrowEvents.escrow_transfer_transfer_tx_sent]: undefined
  [EscrowEvents.escrow_transfer_complete]: undefined
  [EscrowEvents.escrow_transfer_error]: {
    error: string
  }

  [EscrowEvents.escrow_fetch_start]: undefined
  [EscrowEvents.escrow_fetch_complete]: undefined
  [EscrowEvents.escrow_fetch_error]: {
    error: string
  }

  [EscrowEvents.escrow_reclaim_confirm]: undefined
  [EscrowEvents.escrow_reclaim_cancel]: undefined
  [EscrowEvents.escrow_reclaim_start]: undefined
  [EscrowEvents.escrow_reclaim_complete]: undefined
  [EscrowEvents.escrow_reclaim_error]: {
    error: string
  }
}
interface SendEventsProperties {
  [SendEvents.send_scan]: undefined
  [SendEvents.send_select_recipient]: {
    // TODO: decide what recipient info to collect, now that RecipientKind doesn't exist
    usedSearchBar: boolean
  }
  [SendEvents.send_cancel]: undefined
  [SendEvents.send_amount_back]: undefined
  [SendEvents.send_amount_continue]:
    | {
        origin: SendOrigin
        isScan: boolean
        isInvite: boolean
        localCurrencyExchangeRate?: string | null
        localCurrency: LocalCurrencyCode
        localCurrencyAmount: string | null
        underlyingCurrency: Currency
        underlyingAmount: string | null
      }
    | {
        origin: SendOrigin
        recipientType?: RecipientType
        isScan: boolean
        isInvite: boolean
        localCurrencyExchangeRate?: string | null
        localCurrency: LocalCurrencyCode
        localCurrencyAmount: string | null
        underlyingTokenAddress: string
        underlyingTokenSymbol: string
        underlyingAmount: string | null
        amountInUsd: string | null
      }
  [SendEvents.send_confirm_back]: undefined
  [SendEvents.send_confirm_send]:
    | {
        origin: SendOrigin
        isScan: boolean
        isInvite: boolean
        isRequest: boolean
        localCurrencyExchangeRate?: string | null
        localCurrency: LocalCurrencyCode
        dollarAmount: string | null
        localCurrencyAmount: string | null
        commentLength: number
      }
    | {
        origin: SendOrigin
        recipientType?: RecipientType
        isScan: boolean
        isInvite: boolean
        localCurrency: LocalCurrencyCode
        usdAmount: string | null
        localCurrencyAmount: string | null
        tokenAmount: string
        tokenSymbol: string
        tokenAddress: string
        commentLength: number
      }

  [SendEvents.send_secure_start]: {
    confirmByScan: boolean
  }
  [SendEvents.send_secure_back]: undefined
  [SendEvents.send_secure_cancel]: undefined
  [SendEvents.send_secure_submit]: {
    partialAddressValidation: boolean
    address: string
  }
  [SendEvents.send_secure_complete]: {
    confirmByScan: boolean
    partialAddressValidation?: boolean
  }
  [SendEvents.send_secure_incorrect]: {
    confirmByScan: boolean
    partialAddressValidation?: boolean
    error: string
  }
  [SendEvents.send_secure_info]: {
    partialAddressValidation: boolean
  }
  [SendEvents.send_secure_info_dismissed]: {
    partialAddressValidation: boolean
  }
  [SendEvents.send_secure_edit]: undefined

  [SendEvents.send_tx_start]: undefined
  [SendEvents.send_tx_complete]: {
    txId: string
    recipientAddress: string
    amount: string
    usdAmount: string | undefined
    tokenAddress: string
  }
  [SendEvents.send_tx_error]: {
    error: string
  }
  [SendEvents.token_dropdown_opened]: {
    currentTokenAddress: string
  }
  [SendEvents.token_selected]: {
    origin: TokenPickerOrigin
    tokenAddress: string
  }
  [SendEvents.max_pressed]: {
    tokenAddress: string
  }
  [SendEvents.swap_input_pressed]: {
    tokenAddress: string
    swapToLocalAmount: boolean
  }
  [SendEvents.check_account_alert_shown]: undefined
  [SendEvents.check_account_do_not_ask_selected]: undefined
  [SendEvents.check_account_alert_back]: undefined
  [SendEvents.check_account_alerts_continue]: undefined
}

interface RequestEventsProperties {
  [RequestEvents.request_amount_back]: undefined
  [RequestEvents.request_cancel]: undefined
  [RequestEvents.request_scan]: undefined
  [RequestEvents.request_select_recipient]: {
    // TODO: decide what recipient info to collect, now that RecipientKind doesn't exist
    usedSearchBar: boolean
  }
  [RequestEvents.request_amount_continue]:
    | {
        origin: SendOrigin
        isScan: boolean
        isInvite: boolean
        localCurrencyExchangeRate?: string | null
        localCurrency: LocalCurrencyCode
        localCurrencyAmount: string | null
        underlyingCurrency: Currency
        underlyingAmount: string | null
      }
    | {
        origin: SendOrigin
        isScan: boolean
        isInvite: boolean
        localCurrencyExchangeRate?: string | null
        localCurrency: LocalCurrencyCode
        localCurrencyAmount: string | null
        underlyingTokenAddress: string
        underlyingTokenSymbol: string
        underlyingAmount: string | null
        amountInUsd: string | null
      }
  [RequestEvents.request_unavailable]:
    | {
        origin: SendOrigin
        isScan: boolean
        isInvite: boolean
        localCurrencyExchangeRate?: string | null
        localCurrency: LocalCurrencyCode
        localCurrencyAmount: string | null
        underlyingCurrency: Currency
        underlyingAmount: string | null
      }
    | {
        origin: SendOrigin
        isScan: boolean
        isInvite: boolean
        localCurrencyExchangeRate?: string | null
        localCurrency: LocalCurrencyCode
        localCurrencyAmount: string | null
        underlyingTokenAddress: string
        underlyingTokenSymbol: string
        underlyingAmount: string | null
        amountInUsd: string | null
      }
  [RequestEvents.request_confirm_back]: undefined
  [RequestEvents.request_confirm_request]: {
    requesteeAddress: string
  }
  [RequestEvents.request_error]: {
    error: string
  }
}

interface FeeEventsProperties {
  [FeeEvents.fee_rendered]: {
    feeType: string
    fee?: string
  }
  [FeeEvents.estimate_fee_failed]: {
    feeType: string
    tokenAddress: string
    error: string
  }
  [FeeEvents.estimate_fee_success]: {
    feeType: string
    tokenAddress: string
    usdFee: string
  }
  [FeeEvents.fetch_tobin_tax_failed]: {
    error: string
  }
}

interface TransactionEventsProperties {
  [TransactionEvents.transaction_start]: {
    txId: string
    description?: string
    fornoMode?: boolean
  }
  [TransactionEvents.transaction_gas_estimated]: {
    txId: string
    estimatedGas: number
    prefilled: boolean
  }
  [TransactionEvents.transaction_hash_received]: {
    txId: string
    txHash: string
  }
  [TransactionEvents.transaction_confirmed]: {
    txId: string
  }
  [TransactionEvents.transaction_receipt_received]: {
    txId: string
  }
  [TransactionEvents.transaction_error]: {
    txId: string
    error: string
  }
  [TransactionEvents.transaction_exception]: {
    txId: string
    error: string
  }
}

interface CeloExchangeEventsProperties {
  [CeloExchangeEvents.celo_home_info]: undefined
  [CeloExchangeEvents.celo_home_buy]: undefined
  [CeloExchangeEvents.celo_home_sell]: undefined
  [CeloExchangeEvents.celo_home_withdraw]: undefined
  [CeloExchangeEvents.celo_transaction_select]: undefined
  [CeloExchangeEvents.celo_transaction_back]: undefined

  [CeloExchangeEvents.celo_toggle_input_currency]: {
    to: InputToken
  }
  [CeloExchangeEvents.celo_buy_continue]: {
    localCurrencyAmount: string | null
    goldAmount: string
    inputToken: Currency
  }
  [CeloExchangeEvents.celo_buy_confirm]: {
    localCurrencyAmount: string | null
    goldAmount: string
    stableAmount: string
    inputToken: Currency
  }
  [CeloExchangeEvents.celo_buy_cancel]: undefined
  [CeloExchangeEvents.celo_buy_edit]: undefined
  [CeloExchangeEvents.celo_buy_error]: {
    error: string
  }
  [CeloExchangeEvents.celo_sell_continue]: {
    localCurrencyAmount: string | null
    goldAmount: string
    inputToken: Currency
  }
  [CeloExchangeEvents.celo_sell_confirm]: {
    localCurrencyAmount: string | null
    goldAmount: string
    stableAmount: string
    inputToken: Currency
  }
  [CeloExchangeEvents.celo_sell_cancel]: undefined
  [CeloExchangeEvents.celo_sell_edit]: undefined
  [CeloExchangeEvents.celo_sell_error]: {
    error: string
  }

  [CeloExchangeEvents.celo_exchange_start]: undefined
  [CeloExchangeEvents.celo_exchange_complete]: {
    txId: string
    currency: string
    amount: string
  }
  [CeloExchangeEvents.celo_exchange_error]: {
    error: string
  }

  [CeloExchangeEvents.celo_fetch_exchange_rate_start]: undefined
  [CeloExchangeEvents.celo_fetch_exchange_rate_complete]: {
    currency: StableCurrency
    makerAmount: number
    exchangeRate: number
  }
  [CeloExchangeEvents.celo_fetch_exchange_rate_error]: {
    error: string
  }

  [CeloExchangeEvents.celo_withdraw_review]: {
    amount: string
  }
  [CeloExchangeEvents.celo_withdraw_edit]: undefined
  [CeloExchangeEvents.celo_withdraw_cancel]: undefined
  [CeloExchangeEvents.celo_withdraw_confirm]: {
    amount: string
  }
  [CeloExchangeEvents.celo_withdraw_completed]: {
    amount: string
  }
  [CeloExchangeEvents.celo_withdraw_error]: {
    error: string
  }
  [CeloExchangeEvents.celo_chart_tapped]: undefined
}

interface FiatExchangeEventsProperties {
  [FiatExchangeEvents.cico_cash_out_info_support]: undefined
  [FiatExchangeEvents.external_exchange_link]: {
    name: string
    link: string
    isCashIn: boolean
  }
  [FiatExchangeEvents.spend_merchant_link]: {
    name: string
    link: string
  }
  [FiatExchangeEvents.cash_in_success]: {
    provider: string | undefined
  }
  [FiatExchangeEvents.cico_add_funds_bottom_sheet_selected]: {
    rampAvailable: boolean
  }
  [FiatExchangeEvents.cico_add_funds_bottom_sheet_impression]: undefined
  [FiatExchangeEvents.cico_add_funds_bottom_sheet_ramp_selected]: undefined
  [FiatExchangeEvents.cico_add_funds_bottom_sheet_ramp_available]: undefined
  [FiatExchangeEvents.cico_add_funds_info_support]: undefined
  [FiatExchangeEvents.cico_external_exchanges_back]: undefined
  [FiatExchangeEvents.cico_cash_out_copy_address]: undefined
  [FiatExchangeEvents.cico_spend_select_provider_back]: undefined
  [FiatExchangeEvents.cico_non_celo_exchange_send_bar_continue]: undefined
  [FiatExchangeEvents.cico_celo_exchange_send_bar_continue]: undefined
  [FiatExchangeEvents.cico_landing_token_balance]: { totalBalance?: string }
  [FiatExchangeEvents.cico_landing_select_flow]: { flow: FiatExchangeFlow }
  [FiatExchangeEvents.cico_landing_how_to_fund]: undefined
  [FiatExchangeEvents.cico_currency_chosen]: {
    flow: FiatExchangeFlow
    currency: Currency
  }
  [FiatExchangeEvents.cico_currency_back]: { flow: FiatExchangeFlow }
  [FiatExchangeEvents.cico_amount_chosen]: {
    amount: number
    currency: Currency
    flow: CICOFlow
  }
  [FiatExchangeEvents.cico_amount_chosen_invalid]: {
    amount: number
    currency: Currency
    flow: CICOFlow
  }
  [FiatExchangeEvents.cico_amount_back]: {
    currency: Currency
    flow: CICOFlow
  }
  [FiatExchangeEvents.cico_providers_section_impression]: {
    paymentMethod: PaymentMethod
    quoteCount: number
    flow: CICOFlow
    providers: string[]
  }
  [FiatExchangeEvents.cico_providers_section_expand]: {
    paymentMethod: PaymentMethod
    flow: CICOFlow
  }
  [FiatExchangeEvents.cico_providers_section_collapse]: {
    paymentMethod: PaymentMethod
    flow: CICOFlow
  }
  [FiatExchangeEvents.cico_providers_quote_selected]: {
    paymentMethod: PaymentMethod
    provider: string
    flow: CICOFlow
  }
  [FiatExchangeEvents.cico_providers_back]: { flow: CICOFlow }
  [FiatExchangeEvents.cico_providers_exchanges_selected]: { flow: CICOFlow }
  [FiatExchangeEvents.cico_providers_unavailable_impression]: { flow: CICOFlow }
  [FiatExchangeEvents.cico_providers_unavailable_selected]: { flow: CICOFlow }
}

interface GethEventsProperties {
  [GethEvents.blockchain_corruption]: undefined
  [GethEvents.geth_init_success]: undefined
  [GethEvents.geth_init_failure]: {
    error: string
    context: string
  }
  [GethEvents.geth_restart_to_fix_init]: undefined
  [GethEvents.prompt_forno]: {
    error?: string
    context: string
  }
  [GethEvents.geth_init_start]: {
    shouldStartNode: boolean
  }
  [GethEvents.create_geth_start]: undefined
  [GethEvents.create_geth_finish]: undefined
  [GethEvents.create_geth_error]: {
    error: string
  }
  [GethEvents.start_geth_start]: undefined
  [GethEvents.start_geth_finish]: undefined
}

interface NetworkEventsProperties {
  [NetworkEvents.network_connected]: {
    fornoMode: boolean
  }
  [NetworkEvents.network_disconnected]: {
    fornoMode: boolean
  }
  [NetworkEvents.network_sync_lost]: {
    latestBlock: number
    latestTimestamp: number
  }
  [NetworkEvents.network_sync_restored]: {
    latestBlock: number
    latestTimestamp: number
  }
  [NetworkEvents.network_sync_waiting]: {
    latestBlock?: number
  }
  [NetworkEvents.network_sync_start]: {
    startingBlock: number
    currentBlock: number
    highestBlock: number
  }
  [NetworkEvents.network_sync_finish]: {
    latestBlock: number
  }
  [NetworkEvents.network_sync_error]: {
    error: string
  }
}

interface ContractKitEventsProperties {
  [ContractKitEvents.init_contractkit_start]: undefined
  [ContractKitEvents.init_contractkit_geth_init_start]: {
    retries: number
  }
  [ContractKitEvents.init_contractkit_geth_init_finish]: undefined
  [ContractKitEvents.init_contractkit_get_ipc_start]: undefined
  [ContractKitEvents.init_contractkit_get_ipc_finish]: undefined
  [ContractKitEvents.init_contractkit_get_wallet_start]: undefined
  [ContractKitEvents.init_contractkit_get_wallet_finish]: undefined
  [ContractKitEvents.init_contractkit_init_wallet_finish]: undefined
  [ContractKitEvents.init_contractkit_finish]: undefined
}

interface PerformanceProperties {
  [PerformanceEvents.redux_store_size]: {
    size: number
  }
}

interface NavigationProperties {
  [NavigationEvents.navigator_not_ready]: undefined
}

interface RewardsProperties {
  [RewardsEvents.rewards_screen_opened]: {
    origin: RewardsScreenOrigin
  }
  [RewardsEvents.rewards_screen_cta_pressed]: {
    buttonPressed: RewardsScreenCta
  }
  [RewardsEvents.learn_more_pressed]: undefined
  [RewardsEvents.claimed_reward]: {
    amount: string
    token: string
  }
}

export interface WalletConnect1Properties {
  version: 1
  dappRequestOrigin: DappRequestOrigin
  dappName: string
  dappUrl: string
  dappDescription: string
  dappIcon: string
  peerId: string
  chainId: string
}

export interface WalletConnect2Properties {
  version: 2
  dappRequestOrigin: DappRequestOrigin
  dappName: string
  dappUrl: string
  dappDescription: string
  dappIcon: string
  permissionsBlockchains: string[]
  permissionsJsonrpcMethods: string[]
  permissionsNotificationsTypes: string[]
  relayProtocol: string
}

type WalletConnectDefaultProperties = WalletConnect1Properties | WalletConnect2Properties

type WalletConnectRequestDefaultProperties = WalletConnectDefaultProperties & {
  requestChainId: string | undefined
  requestId: number
  requestJsonrpc: string
  requestMethod: string
  // TODO: add back when we confirm there's no privacy issue with tracking this
  // requestParams: any
}

type WalletConnectRequestDenyProperties = WalletConnectRequestDefaultProperties & {
  denyReason: string
}

interface WalletConnectProperties {
  [WalletConnectEvents.wc_pairing_start]: {
    dappRequestOrigin: DappRequestOrigin
    origin: WalletConnectPairingOrigin
  }
  [WalletConnectEvents.wc_pairing_success]: { dappRequestOrigin: DappRequestOrigin }
  [WalletConnectEvents.wc_pairing_error]: {
    dappRequestOrigin: DappRequestOrigin
    error: string
  }

  [WalletConnectEvents.wc_session_propose]: WalletConnectDefaultProperties
  [WalletConnectEvents.wc_session_approve_start]: WalletConnectDefaultProperties
  [WalletConnectEvents.wc_session_approve_success]: WalletConnectDefaultProperties
  [WalletConnectEvents.wc_session_approve_error]: WalletConnectDefaultProperties & {
    error: string
  }
  [WalletConnectEvents.wc_session_reject_start]: WalletConnectDefaultProperties
  [WalletConnectEvents.wc_session_reject_success]: WalletConnectDefaultProperties
  [WalletConnectEvents.wc_session_reject_error]: WalletConnectDefaultProperties & {
    error: string
  }
  [WalletConnectEvents.wc_session_remove_start]: WalletConnectDefaultProperties
  [WalletConnectEvents.wc_session_remove_success]: WalletConnectDefaultProperties
  [WalletConnectEvents.wc_session_remove_error]: WalletConnectDefaultProperties & {
    error: string
  }

  [WalletConnectEvents.wc_request_propose]: WalletConnectRequestDefaultProperties
  [WalletConnectEvents.wc_request_details]: WalletConnectRequestDefaultProperties
  [WalletConnectEvents.wc_request_accept_start]: WalletConnectRequestDefaultProperties
  [WalletConnectEvents.wc_request_accept_success]: WalletConnectRequestDefaultProperties
  [WalletConnectEvents.wc_request_accept_error]: WalletConnectRequestDefaultProperties & {
    error: string
  }
  [WalletConnectEvents.wc_request_deny_start]: WalletConnectRequestDenyProperties
  [WalletConnectEvents.wc_request_deny_success]: WalletConnectRequestDenyProperties
  [WalletConnectEvents.wc_request_deny_error]: WalletConnectRequestDenyProperties & {
    error: string
  }
}

interface DappKitRequestDefaultProperties {
  dappRequestOrigin: DappRequestOrigin
  dappName: string
  dappUrl: string
  requestType: DappKitRequestTypes
  requestCallback: string
  requestId: string
}

interface DappKitProperties {
  [DappKitEvents.dappkit_parse_deeplink_error]: {
    dappRequestOrigin: DappRequestOrigin
    deeplink: string
    error: string
  }
  [DappKitEvents.dappkit_request_propose]: DappKitRequestDefaultProperties
  [DappKitEvents.dappkit_request_cancel]: DappKitRequestDefaultProperties
  [DappKitEvents.dappkit_request_details]: DappKitRequestDefaultProperties
  [DappKitEvents.dappkit_request_accept_start]: DappKitRequestDefaultProperties
  [DappKitEvents.dappkit_request_accept_success]: DappKitRequestDefaultProperties
  [DappKitEvents.dappkit_request_accept_error]: DappKitRequestDefaultProperties & {
    error: string
  }
}

interface CICOEventsProperties {
  [CICOEvents.link_bank_account_cancel]: undefined
  [CICOEvents.persona_kyc_start]: undefined
  [CICOEvents.persona_kyc_success]: undefined
  [CICOEvents.persona_kyc_cancel]: undefined
  [CICOEvents.persona_kyc_error]: undefined
  [CICOEvents.connect_phone_start]: undefined
  [CICOEvents.connect_phone_cancel]: undefined
  [CICOEvents.add_initial_bank_account_start]: undefined
  [CICOEvents.add_bank_account_start]: undefined
  [CICOEvents.delete_bank_account]: { id: number }
  [CICOEvents.plaid_open_link_flow]: {
    linkSessionId: string
  }
  [CICOEvents.plaid_select_institution]: {
    linkSessionId: string
    institutionId: string
    institutionName: string
  }
  [CICOEvents.plaid_submit_credentials]: {
    linkSessionId: string
  }
  [CICOEvents.plaid_exit]: {
    linkSessionId: string
  }
  [CICOEvents.plaid_handoff]: {
    linkSessionId: string
  }
  [CICOEvents.plaid_error]: {
    linkSessionId: string
    errorType: string
    errorCode: string
  }
}

interface DappEventProperties {
  categoryId: string
  dappId: string
  dappName: string
  section: DappSection
  horizontalPosition?: number
}

interface DappExplorerEventsProperties {
  [DappExplorerEvents.dapp_impression]: DappEventProperties
  [DappExplorerEvents.dapp_open]: DappEventProperties
  [DappExplorerEvents.dapp_close]: DappEventProperties
  [DappExplorerEvents.dapp_screen_open]: undefined
  [DappExplorerEvents.dapp_view_all]: undefined
  [DappExplorerEvents.dapp_select]: DappEventProperties
  [DappExplorerEvents.dapp_bottom_sheet_open]: DappEventProperties
  [DappExplorerEvents.dapp_bottom_sheet_dismiss]: DappEventProperties
}

interface KolektivoNotificationEventsProperties {
  [KolektivoNotificationEvents.view_cico_prompt]: undefined
  [KolektivoNotificationEvents.cico_prompt_complete]: undefined
}

export type AnalyticsPropertiesList = AppEventsProperties &
  HomeEventsProperties &
  SettingsEventsProperties &
  OnboardingEventsProperties &
  VerificationEventsProperties &
  IdentityEventsProperties &
  AuthenticationEventsProperties &
  InviteEventsProperties &
  SendEventsProperties &
  EscrowEventsProperties &
  RequestEventsProperties &
  FeeEventsProperties &
  TransactionEventsProperties &
  CeloExchangeEventsProperties &
  FiatExchangeEventsProperties &
  GethEventsProperties &
  NetworkEventsProperties &
  ContractKitEventsProperties &
  PerformanceProperties &
  NavigationProperties &
  RewardsProperties &
  WalletConnectProperties &
  DappKitProperties &
  CICOEventsProperties &
  DappExplorerEventsProperties &
  KolektivoNotificationEventsProperties

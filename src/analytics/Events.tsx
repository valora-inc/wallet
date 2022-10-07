// TODO: TX feed + QR scanner + Geth

export enum AppEvents {
  app_launched = 'app_launched',
  app_state_error = 'app_state_error',
  error_displayed = 'error_displayed',
  error_fallback = 'error_fallback',
  error_boundary = 'error_boundary',
  user_restart = 'user_restart',
  fetch_balance = 'fetch_balance',
  fetch_balance_error = 'fetch_balance_error',
  redux_keychain_mismatch = 'redux_keychain_mismatch', // when the redux state doesn't contain the account found in geth
  redux_store_recovery_success = 'redux_store_recovery_success',
  redux_no_matching_keychain_account = 'redux_no_matching_keychain_account', // when account in redux has no matching password hash in the keychain
  push_notification_opened = 'push_notification_opened',
  android_mobile_services_availability_checked = 'android_mobile_services_availability_checked',

  request_tracking_permission_started = 'request_tracking_permission_started',
  request_tracking_permission_declined = 'request_tracking_permission_declined',
  request_tracking_permission_accepted = 'request_tracking_permission_accepted',

  account_funded = 'account_funded',
  account_liquidated = 'account_liquidated',
}

export enum HomeEvents {
  home_send = 'home_send',
  home_request = 'home_request',
  home_qr = 'home_qr',
  hamburger_tapped = 'hamburger_tapped',
  drawer_navigation = 'drawer_navigation',
  drawer_address_copy = 'drawer_address_copy',
  notification_scroll = 'notification_scroll',
  notification_impression = 'notification_impression',
  notification_select = 'notification_select',
  transaction_feed_item_select = 'transaction_feed_item_select',
  transaction_feed_address_copy = 'transaction_feed_address_copy',
  view_token_balances = 'view_token_balances',
}

export enum SettingsEvents {
  settings_profile_edit = 'settings_profile_edit',
  settings_profile_name_edit = 'settings_profile_name_edit',
  settings_verify_number = 'settings_verify_number',
  settings_link_bank_account = 'settings_link_bank_account', // when "Link Bank Account" is pressed
  language_select = 'language_select',
  pin_require_on_load = 'pin_require_on_load',
  forno_toggle = 'forno_toggle',
  licenses_view = 'licenses_view',
  tos_view = 'tos_view',
  start_account_removal = 'start_account_removal',
  completed_account_removal = 'completed_account_removal',
  change_pin_start = 'change_pin_start',
  change_pin_current_pin_entered = 'change_pin_current_pin_entered',
  change_pin_current_pin_error = 'change_pin_current_pin_error',
  change_pin_new_pin_entered = 'change_pin_new_pin_entered',
  change_pin_new_pin_confirmed = 'change_pin_new_pin_confirmed',
  change_pin_new_pin_error = 'change_pin_new_pin_error',
  settings_biometry_opt_in_enable = 'settings_biometry_opt_in_enable',
  settings_biometry_opt_in_complete = 'settings_biometry_opt_in_complete',
  settings_biometry_opt_in_error = 'settings_biometry_opt_in_error',
  settings_biometry_opt_in_disable = 'settings_biometry_opt_in_disable',
  // intentionally not tracking analytics opt in/out
  // to avoid tracking through omission
}

export enum OnboardingEvents {
  onboarding_education_start = 'onboarding_education_start',
  onboarding_education_scroll = 'onboarding_education_scroll',
  onboarding_education_complete = 'onboarding_education_complete',
  onboarding_education_cancel = 'onboarding_education_cancel',

  create_account_start = 'create_account_start',
  create_account_cancel = 'create_account_cancel',

  restore_account_start = 'restore_account_start',
  restore_account_cancel = 'restore_account_cancel',

  backup_education_start = 'backup_education_start',
  backup_education_scroll = 'backup_education_scroll',
  backup_education_complete = 'backup_education_complete',
  backup_education_cancel = 'backup_education_cancel',

  backup_start = 'backup_start',
  backup_continue = 'backup_continue', // (count # of taps on “Continue” button in Backup_Phrase)
  backup_complete = 'backup_complete', // (count # of taps on "Cancel" button in Backup_Phrase/BackupQuiz)
  backup_more_info = 'backup_more_info',
  backup_delay = 'backup_delay', // when a user delays backup seed phrase completion
  backup_delay_confirm = 'backup_delay_confirm', // when a user confirms they want to delay backup
  backup_delay_cancel = 'backup_delay_cancel', // when a user decides to return to backup flow
  backup_cancel = 'backup_cancel', // (count # of taps on "Cancel" button in Backup_Phrase/BackupQuiz)
  backup_error = 'backup_error',

  backup_quiz_start = 'backup_quiz_start',
  backup_quiz_progress = 'backup_quiz_progress', // whenever the backspace is pressed or word is chosen
  backup_quiz_complete = 'backup_quiz_complete', // (Count # of successful Recovery Phrase confirmations Backup_Quiz)
  backup_quiz_incorrect = 'backup_quiz_incorrect', // (Count # of failed Recovery Phrase confirmations Backup_Quiz)

  terms_and_conditions_accepted = 'terms_and_conditions_accepted',

  celo_education_start = 'celo_education_start',
  celo_education_scroll = 'celo_education_scroll',
  celo_education_complete = 'celo_education_complete',
  celo_education_cancel = 'celo_education_cancel',

  name_and_picture_set = 'name_and_picture_set',

  phone_number_set = 'phone_number_set',

  pin_set = 'pin_set',
  pin_invalid = 'pin_invalid',
  pin_failed_to_set = 'pin_failed_to_set',
  pin_never_set = 'pin_never_set',

  biometry_opt_in_start = 'biometry_opt_in_start',
  biometry_opt_in_cancel = 'biometry_opt_in_cancel',
  biometry_opt_in_approve = 'biometry_opt_in_approve',
  biometry_opt_in_complete = 'biometry_opt_in_complete',
  biometry_opt_in_error = 'biometry_opt_in_error',

  wallet_import_start = 'wallet_import_start',
  wallet_import_phrase_updated = 'wallet_import_phrase_updated',
  wallet_import_submit = 'wallet_import_submit',
  wallet_import_cancel = 'wallet_import_cancel', // when a user cancels import of empty wallet or navigates back
  wallet_import_zero_balance = 'wallet_import_zero_balance', // when the user is informed a wallet has zero balance
  wallet_import_phrase_invalid = 'wallet_import_phrase_invalid',
  wallet_import_phrase_correction_attempt = 'wallet_import_phrase_correction_attempt',
  wallet_import_phrase_correction_success = 'wallet_import_phrase_correction_success',
  wallet_import_phrase_correction_failed = 'wallet_import_phrase_correction_failed',
  wallet_import_error = 'wallet_import_error',
  wallet_import_success = 'wallet_import_success',

  invite_redeem_start = 'invite_redeem_start',
  invite_redeem_complete = 'invite_redeem_complete',
  invite_redeem_cancel = 'invite_redeem_cancel',
  invite_redeem_timeout = 'invite_redeem_timeout',
  invite_redeem_error = 'invite_redeem_error',
  invite_redeem_move_funds_start = 'invite_redeem_move_funds_start',
  invite_redeem_move_funds_complete = 'invite_redeem_move_funds_complete',

  initialize_account_start = 'initialize_account_start',
  initialize_account_complete = 'initialize_account_complete',
  initialize_account_error = 'initialize_account_error',

  escrow_redeem_start = 'escrow_redeem_start', // when escrow redemption starts (only happens on user invite redemption)
  escrow_redeem_complete = 'escrow_redeem_complete',
  escrow_redeem_error = 'escrow_redeem_error',

  account_dek_register_start = 'account_dek_register_start',
  account_dek_register_account_unlocked = 'account_dek_register_account_unlocked',
  account_dek_register_account_checked = 'account_dek_register_account_checked',
  account_dek_register_complete = 'account_dek_register_complete',
}

export enum VerificationEvents {
  verification_start = 'verification_start',
  verification_complete = 'verification_complete',
  verification_error = 'verification_error',
  verification_cancel = 'verification_cancel',
  verification_timeout = 'verification_timeout',

  verification_hash_cached = 'verification_hash_cached',
  verification_hash_retrieved = 'verification_hash_retrieved',

  verification_request_all_attestations_start = 'verification_request_all_attestations_start',
  verification_request_all_attestations_refresh_progress = 'verification_request_all_attestations_refresh_progress',
  verification_request_all_attestations_complete = 'verification_request_all_attestations_complete',

  // Events for an individual attestation
  verification_request_attestation_start = 'verification_request_attestation_start',
  verification_request_attestation_approve_tx_sent = 'verification_request_attestation_approve_tx_sent',
  verification_request_attestation_request_tx_sent = 'verification_request_attestation_request_tx_sent',
  verification_request_attestation_await_issuer_selection = 'verification_request_attestation_await_issuer_selection',
  verification_request_attestation_select_issuer = 'verification_request_attestation_select_issuer',
  verification_request_attestation_issuer_tx_sent = 'verification_request_attestation_issuer_tx_sent',
  verification_request_attestation_complete = 'verification_request_attestation_complete',

  verification_code_received = 'verification_code_received',
  verification_code_validate_start = 'verification_code_validate_start',
  verification_code_validate_complete = 'verification_code_validate_complete',

  verification_reveal_all_attestations_start = 'verification_reveal_all_attestations_start',
  verification_reveal_all_attestations_complete = 'verification_reveal_all_attestations_complete',

  // Events for an individual attestation reveal
  verification_reveal_attestation_start = 'verification_reveal_attestation_start',
  verification_reveal_attestation_revealed = 'verification_reveal_attestation_revealed',
  verification_reveal_attestation_await_code_start = 'verification_reveal_attestation_await_code_start',
  verification_reveal_attestation_await_code_complete = 'verification_reveal_attestation_await_code_complete',
  verification_reveal_attestation_complete = 'verification_reveal_attestation_complete',
  verification_reveal_attestation_error = 'verification_reveal_attestation_error',
  verification_reveal_attestation_status = 'verification_reveal_attestation_status',

  verification_revoke_start = 'verification_revoke_start',
  verification_revoke_finish = 'verification_revoke_finish',
  verification_revoke_error = 'verification_revoke_error',

  verification_resend_messages = 'verification_resend_messages',

  verification_recaptcha_started = 'verification_recaptcha_started',
  verification_recaptcha_skipped = 'verification_recaptcha_skipped',
  verification_recaptcha_success = 'verification_recaptcha_success',
  verification_recaptcha_failure = 'verification_recaptcha_failure',
  verification_recaptcha_canceled = 'verification_recaptcha_canceled',

  verification_session_started = 'verification_session_started',

  verification_already_completed = 'verification_already_completed',

  verification_mtw_fetch_start = 'verification_mtw_fetch_start',
  verification_mtw_fetch_success = 'verification_mtw_fetch_success',

  verification_fetch_on_chain_data_start = 'verification_fetch_on_chain_data_start',
  verification_fetch_on_chain_data_success = 'verification_fetch_on_chain_data_success',
}

export enum IdentityEvents {
  contacts_connect = 'contacts_connect', // when connect button is pressed
  contacts_import_permission_denied = 'contacts_import_permission_denied',
  contacts_import_start = 'contacts_import_start',
  contacts_import_complete = 'contacts_import_complete',
  contacts_processing_complete = 'contacts_processing_complete',
  contacts_matchmaking_complete = 'contacts_matchmaking_complete',
  contacts_import_error = 'contacts_import_error',

  phone_number_lookup_start = 'phone_number_lookup_start',
  phone_number_lookup_complete = 'phone_number_lookup_complete',
  phone_number_lookup_error = 'phone_number_lookup_error',

  phone_number_lookup_purchase_complete = 'phone_number_lookup_purchase_complete',
  phone_number_lookup_purchase_error = 'phone_number_lookup_purchase_error',
  phone_number_lookup_purchase_skip = 'phone_number_lookup_purchase_skip',
}

export enum AuthenticationEvents {
  get_pincode_start = 'get_pincode_start',
  get_pincode_complete = 'get_pincode_complete',
  get_pincode_error = 'get_pincode_error',

  get_pincode_with_biometry_start = 'get_pincode_with_biometry_start',
  get_pincode_with_biometry_complete = 'get_pincode_with_biometry_complete',
  get_pincode_with_biometry_error = 'get_pincode_with_biometry_error',

  get_pincode_with_input_start = 'get_pincode_with_input_start',
  get_pincode_with_input_complete = 'get_pincode_with_input_complete',
  get_pincode_with_input_error = 'get_pincode_with_input_error',
}

export enum InviteEvents {
  invite_tx_start = 'invite_tx_start',
  invite_tx_complete = 'invite_tx_complete',
  invite_tx_error = 'invite_tx_error',
  invite_start = 'invite_start',
  invite_complete = 'invite_complete',
  invite_error = 'invite_error',
  invite_method_sms = 'invite_method_sms',
  invite_method_whatsapp = 'invite_method_whatsapp',
  invite_method_error = 'invite_method_error',
  invite_from_menu = 'invite_from_menu',
  invite_banner_impression = 'invite_banner_impression',
}

export enum EscrowEvents {
  escrow_transfer_start = 'escrow_transfer_start',
  escrow_transfer_approve_tx_sent = 'escrow_transfer_approve_tx_sent',
  escrow_transfer_transfer_tx_sent = 'escrow_transfer_transfer_tx_sent',
  escrow_transfer_complete = 'escrow_transfer_complete',
  escrow_transfer_error = 'escrow_transfer_error',

  escrow_fetch_start = 'escrow_fetch_start',
  escrow_fetch_complete = 'escrow_fetch_complete',
  escrow_fetch_error = 'escrow_fetch_error',

  escrow_reclaim_confirm = 'escrow_reclaim_confirm', // user confirms they want to reclaim escrowed payment
  escrow_reclaim_cancel = 'escrow_reclaim_cancel', // user decides not to initiate a reclaim of escrowed payment
  escrow_reclaim_start = 'escrow_reclaim_start', // when reclaim transaction starts
  escrow_reclaim_complete = 'escrow_reclaim_complete', // when reclaim transaction complete
  escrow_reclaim_error = 'escrow_reclaim_error',
}

export enum SendEvents {
  send_scan = 'send_scan', // when scan QR icon is selected from the send screen
  send_select_recipient = 'send_select_recipient', // when recipient was selected
  send_cancel = 'send_cancel', // when user x's out of Send screen
  send_amount_back = 'send_amount_back', // back button pressed on amount screen
  send_amount_continue = 'send_amount_continue', // when next button pressed on amount enter page
  send_confirm_back = 'send_confirm_back', // when back button pressed on send confirmation screen
  send_confirm_send = 'send_confirm_send', // when send button pressed on send confirmation screen

  send_secure_start = 'send_secure_start', // when either secure send scan or manual confirm button pressed
  send_secure_back = 'send_secure_back', // when back button is pressed during secure send
  send_secure_cancel = 'send_secure_cancel', // when secure send flow is canceled

  send_secure_info = 'send_secure_info', // when "help" button is pressed
  send_secure_info_dismissed = 'send_secure_info_dismissed', // when "help" button is dismissed
  send_secure_submit = 'send_secure_submit', // when an account is submitted for validation
  send_secure_incorrect = 'send_secure_incorrect', // when there's been an error validating the account
  send_secure_complete = 'send_secure_complete', // when an account has been validated

  send_secure_edit = 'send_secure_edit', // when "edit" address button is pressed to manually initiate secure send flow

  send_tx_start = 'send_tx_start',
  send_tx_complete = 'send_tx_complete', // when a send or invite transaction has successfully completed
  send_tx_error = 'send_tx_error', // when there is an error sending a transaction

  token_dropdown_opened = 'token_dropdown_opened',
  token_selected = 'token_selected', // A token was selected in TokenBottomSheet.
  max_pressed = 'max_pressed',
  swap_input_pressed = 'swap_input_pressed',

  // related to the alert that is shown when sending to an unknown address
  check_account_alert_shown = 'check_account_alert_shown',
  check_account_do_not_ask_selected = 'check_account_do_not_ask_selected',
  check_account_alert_back = 'check_account_alert_back',
  check_account_alerts_continue = 'check_account_alerts_continue',
}

export enum RequestEvents {
  request_scan = 'request_scan', // when scan QR icon is selected from the request screen
  request_select_recipient = 'request_select_recipient', // when recipient was selected
  request_cancel = 'request_cancel', // when cancel is clicked after launching request flow
  request_amount_back = 'request_amount_back', // back button pressed on amount screen
  request_amount_continue = 'request_amount_continue', // when next button pressed on amount enter page
  request_unavailable = 'request_unavailable', // when request sender is unverified
  request_confirm_back = 'request_confirm_back', // when back button pressed on request confirmation screen
  request_confirm_request = 'request_confirm_request', // when request button pressed on request confirmation screen
  request_error = 'request_error', // when there is an error requesting a transaction
}

export enum FeeEvents {
  fee_rendered = 'fee_rendered',
  estimate_fee_failed = 'estimate_fee_failed',
  estimate_fee_success = 'estimate_fee_success',
  fetch_tobin_tax_failed = 'fetch_tobin_tax_failed',
}

// Generic transaction logging to grab tx hashes
export enum TransactionEvents {
  transaction_start = 'transaction_start',
  transaction_gas_estimated = 'transaction_gas_estimated',
  transaction_hash_received = 'transaction_hash_received',
  transaction_receipt_received = 'transaction_receipt_received',
  transaction_confirmed = 'transaction_confirmed',
  transaction_error = 'transaction_error',
  transaction_exception = 'transaction_exception',
}

export enum CeloExchangeEvents {
  celo_home_info = 'celo_home_info', // when the (i) next to Celo Gold price is clicked, launching education (not pictured)
  celo_home_buy = 'celo_home_buy', // when the “Buy” button is clicked
  celo_home_sell = 'celo_home_sell', // when the “Sell” button is clicked
  celo_home_withdraw = 'celo_home_withdraw', // when the “Withdraw” button is clicked
  celo_transaction_select = 'celo_transaction_select', // when an transaction item is clicked
  celo_transaction_back = 'celo_transaction_back', // when back caret is clicked from drilldown

  celo_toggle_input_currency = 'celo_toggle_input_currency', // when ‘switch to gold’ button pressed
  celo_buy_continue = 'celo_buy_continue', // when ‘review’ button clicked
  celo_buy_confirm = 'celo_buy_confirm', // when ‘buy’ button clicked
  celo_buy_cancel = 'celo_buy_cancel', // when ‘cancel’ is clicked
  celo_buy_edit = 'celo_buy_edit', // when ‘edit’ is clicked
  celo_buy_error = 'celo_buy_error', // error in send flow
  celo_sell_continue = 'celo_sell_continue', // when ‘review’ button clicked
  celo_sell_confirm = 'celo_sell_confirm', // when ‘sell’ button clicked
  celo_sell_cancel = 'celo_sell_cancel', // when ‘cancel’ is clicked
  celo_sell_edit = 'celo_sell_edit', // when ‘edit’ is clicked
  celo_sell_error = 'celo_sell_error', // error in sell flow

  celo_exchange_start = 'celo_exchange_start',
  celo_exchange_complete = 'celo_exchange_complete',
  celo_exchange_error = 'celo_exchange_error',

  celo_fetch_exchange_rate_start = 'celo_fetch_exchange_rate_start',
  celo_fetch_exchange_rate_complete = 'celo_fetch_exchange_rate_complete',
  celo_fetch_exchange_rate_error = 'celo_fetch_exchange_rate_error',

  celo_withdraw_review = 'celo_withdraw_review', // when ‘review’ is clicked on the withdraw amount screen
  celo_withdraw_edit = 'celo_withdraw_edit', // when ‘edit’ is clicked on the review screen
  celo_withdraw_cancel = 'celo_withdraw_cancel', // when ’cancel’ is clicked on the review screen
  celo_withdraw_confirm = 'celo_withdraw_confirm', // when ‘withdraw’ is clicked on the review screen
  celo_withdraw_completed = 'celo_withdraw_completed', // when the transaction for the withdrawal is completed
  celo_withdraw_error = 'celo_withdraw_error', // when there's an error on the withdrawal transaction

  celo_chart_tapped = 'celo_chart_tapped', // when user clicks the chart on exchange screen
}

export enum FiatExchangeEvents {
  // The CICO landing page accessible from the Settings Menu
  cico_landing_token_balance = 'cico_landing_token_balance', // User taps to view detailed token balance
  cico_landing_select_flow = 'cico_landing_select_flow', // User taps which CICO flow they want (Cash in, cash out, spend)
  cico_landing_how_to_fund = 'cico_landing_how_to_fund', // User taps help article link at the bottom

  // The CICO Currency screen where the user selects their digital currency
  cico_currency_chosen = 'cico_currency_chosen', // User selects a currency and taps next
  cico_currency_back = 'cico_currency_back', // User presses the back button from the currency screen

  // The CICO Amount screen where the user selects the amount of money
  cico_amount_chosen = 'cico_amount_chosen', // User selects a valid amount and taps next
  cico_amount_chosen_invalid = 'cico_amount_chosen_invalid', // User attempts to click next but the amount is invalid
  cico_amount_back = 'cico_amount_back', // User presses the back button from the amount screen

  // Select Provider Screen
  cico_providers_section_impression = 'cico_providers_section_impression', // User sees a category of providers
  cico_providers_section_expand = 'cico_providers_section_expand', // User expands a category of providers
  cico_providers_section_collapse = 'cico_providers_section_collapse', // User collapses a category of providers
  cico_providers_quote_selected = 'cico_providers_quote_selected', // User selects a quote
  cico_providers_exchanges_selected = 'cico_providers_exchanges_selected', // User taps the External Exchanges section

  cico_providers_back = 'cico_providers_back', // User presses the back button from the Select Providers screen
  cico_providers_unavailable_impression = 'cico_providers_unavailable_impression', // User sees a blurb about providers unavailable
  cico_providers_unavailable_selected = 'cico_providers_unavailable_selected', // User taps a blurb about providers unavalable

  // Cash In Success Screen
  cash_in_success = 'cash_in_success', // Screen users are (most of the time) redirected to after cash in with external providers

  // Add fund flow entered through home screen cash in bottom sheet
  cico_add_funds_bottom_sheet_selected = 'cico_add_funds_bottom_sheet_selected',
  cico_add_funds_bottom_sheet_impression = 'cico_add_funds_bottom_sheet_impression',
  cico_add_funds_bottom_sheet_ramp_selected = 'cico_add_funds_bottom_sheet_ramp_selected',
  cico_add_funds_bottom_sheet_ramp_available = 'cico_add_funds_bottom_sheet_ramp_available',

  // Funding Education Dialog Screen
  cico_add_funds_info_support = 'cico_add_funds_info_support',
  cico_cash_out_info_support = 'cico_cash_out_info_support',

  // External Exchanges Screen
  external_exchange_link = 'external_exchange_link',
  cico_external_exchanges_back = 'cico_external_exchanges_back',
  cico_cash_out_copy_address = 'cico_cash_out_copy_address',
  cico_celo_exchange_send_bar_continue = 'cico_celo_exchange_send_bar_continue', // When withdraw bar is tapped from cash out CELO

  // Spend Flow
  spend_merchant_link = 'spend_merchant_link',
  cico_spend_select_provider_back = 'cico_spend_select_provider_back',
  cico_non_celo_exchange_send_bar_continue = 'cico_non_celo_exchange_send_bar_continue', // When send bar is tapped from cash out for cUSD & cEUR
}

export enum GethEvents {
  blockchain_corruption = 'blockchain_corruption',
  geth_init_start = 'geth_init_start',
  geth_init_success = 'geth_init_success',
  geth_init_failure = 'geth_init_failure',
  geth_restart_to_fix_init = 'geth_restart_to_fix_init',
  prompt_forno = 'prompt_forno',
  create_geth_start = 'create_geth_start',
  create_geth_finish = 'create_geth_finish',
  create_geth_error = 'create_geth_error',
  start_geth_start = 'start_geth_start',
  start_geth_finish = 'start_geth_finish',
}

export enum NetworkEvents {
  // Events triggered when the app detects it is connected or disconnected from the Celo network.
  network_connected = 'network_connected',
  network_disconnected = 'network_disconnected',

  // Events triggered when the app detects it loses or restores sync with the Celo network.
  network_sync_lost = 'network_sync_lost',
  network_sync_restored = 'network_sync_restored',

  // Events triggered during a syncing or waiting to start syncing.
  network_sync_waiting = 'network_sync_waiting',
  network_sync_start = 'network_sync_start',
  network_sync_finish = 'network_sync_finish',
  network_sync_error = 'network_sync_error',
}

export enum ContractKitEvents {
  init_contractkit_start = 'init_contractkit_start',
  init_contractkit_geth_init_start = 'init_contractkit_geth_init_start',
  init_contractkit_geth_init_finish = 'init_contractkit_geth_init_finish',
  init_contractkit_get_ipc_start = 'init_contractkit_get_ipc_start',
  init_contractkit_get_ipc_finish = 'init_contractkit_get_ipc_finish',
  init_contractkit_get_wallet_start = 'init_contractkit_get_wallet_start',
  init_contractkit_get_wallet_finish = 'init_contractkit_get_wallet_finish',
  init_contractkit_init_wallet_finish = 'init_contractkit_init_wallet_finish',
  init_contractkit_finish = 'init_contractkit_finish',
}

export enum PerformanceEvents {
  redux_store_size = 'redux_store_size',
}

export enum NavigationEvents {
  navigator_not_ready = 'navigator_not_ready',
}

export enum RewardsEvents {
  rewards_screen_opened = 'rewards_screen_opened',
  rewards_screen_cta_pressed = 'rewards_screen_cta_pressed',
  learn_more_pressed = 'learn_more_pressed',
  claimed_reward = 'claimed_reward',
}

export enum WalletConnectEvents {
  // Events related to WalletConnect pairing (technical: opening up the communication channel via QR code or deeplink)
  wc_pairing_start = 'wc_pairing_start', // when WC pairing is started (no UI at this point)
  wc_pairing_success = 'wc_pairing_success', // when WC pairing succeeds
  wc_pairing_error = 'wc_pairing_error', // when WC pairing fails

  // Events related to WalletConnect sessions (approving/rejecting/removing dapps)
  wc_session_propose = 'wc_session_propose', // when the WC session screen is displayed to approve/reject a new dapp
  wc_session_approve_start = 'wc_session_approve_start', // when user presses the button to approve the dapp connection
  wc_session_approve_success = 'wc_session_approve_success', // when the dapp approval succeeds
  wc_session_approve_error = 'wc_session_approve_error', // when the dapp approval fails
  wc_session_reject_start = 'wc_session_reject_start', // when user presses the button to reject the dapp connection
  wc_session_reject_success = 'wc_session_reject_success', // when the dapp rejection succeeds
  wc_session_reject_error = 'wc_session_reject_error', // when the dapp rejection fails
  wc_session_remove_start = 'wc_session_remove_start', // when user presses the button to disconnect the dapp
  wc_session_remove_success = 'wc_session_remove_success', // when the dapp disconnection succeeds
  wc_session_remove_error = 'wc_session_remove_error', // when the dapp disconnection fails

  // Events related to WalletConnect requests from approved dapps (signing)
  wc_request_propose = 'wc_request_propose', // when the WC request screen is displayed to accept/deny a dapp request
  wc_request_details = 'wc_request_details', // when user presses the button to show details of a dapp request
  wc_request_accept_start = 'wc_request_accept_start', // when user presses the button to accept a dapp request
  wc_request_accept_success = 'wc_request_accept_success', // when the dapp request succeeds
  wc_request_accept_error = 'wc_request_accept_error', // when the dapp request fails
  wc_request_deny_start = 'wc_request_deny_start', // when user presses the button to accept a dapp request
  wc_request_deny_success = 'wc_request_deny_success', // when the dapp request denial succeeds
  wc_request_deny_error = 'wc_request_deny_error', // when the dapp request denial fails
}

export enum DappKitEvents {
  dappkit_parse_deeplink_error = 'dappkit_parse_deeplink_error', // when dappkit fails to parse the deeplink
  dappkit_request_propose = 'dappkit_request_propose', // when the dappkit request screen is displayed to accept/deny a dapp request
  dappkit_request_cancel = 'dappkit_request_cancel', // when user presses the button to cancel the dapp request
  dappkit_request_details = 'dappkit_request_details', // when user presses the button to show details of a dapp request
  dappkit_request_accept_start = 'dappkit_request_accept_start', // when user presses the button to accept a dapp request
  dappkit_request_accept_success = 'dappkit_request_accept_success', // when the dapp request succeeds
  dappkit_request_accept_error = 'dappkit_request_accept_error', // when the dapp request fails
}

export enum CICOEvents {
  link_bank_account_cancel = 'link_bank_account_cancel', // when a user who has verified their # presses the X button after entering "Link Bank Account"

  persona_kyc_start = 'persona_kyc_start', // when a user begins the Persona KYC process
  persona_kyc_success = 'persona_kyc_success', // when the onSuccess callback is called for a Persona inquiry
  persona_kyc_cancel = 'persona_kyc_cancel', // when the onCancelled callback is called for a Persona inquiry
  persona_kyc_error = 'persona_kyc_error', // when the onError callback is called for a Persona inquiry

  connect_phone_start = 'connect_phone_start', // when a user who has not verified their # presses the "Connect" button after entering "Link Bank Account"
  connect_phone_cancel = 'connect_phone_cancel', // when a user who has not verified their # presses the "X" button after entering "Link Bank Account"

  add_initial_bank_account_start = 'add_initial_bank_account_start', // When a user who has not added any accounts clicks on the initial “Link Bank Account” button
  add_bank_account_start = 'add_bank_account_start', // When a user adds another bank account after the first (using the “Add new bank account” button)
  delete_bank_account = 'delete_bank_account', // When a user deletes a bank account
  plaid_open_link_flow = 'plaid_open_link_flow', // When a user opens the Plaid Link flow
  plaid_select_institution = 'plaid_select_institution', // When a user selects an institution within the Plaid Link flow
  plaid_submit_credentials = 'plaid_submit_credentials', // When a user submits credentials for an institution within the Plaid Link flow
  plaid_exit = 'plaid_exit', // When a user exits the Plaid Link flow without connecting a bank account
  plaid_handoff = 'plaid_handoff', // When a user exits the Plaid Link flow after successfully connecting a bank account
  plaid_error = 'plaid_error', // When the Plaid Link flow encounters an unrecoverable error
}

export enum DappExplorerEvents {
  dapp_impression = 'dapp_impression', // when a dapp shows up in the featured section of the app
  dapp_open = 'dapp_open', // when a dapp is opened
  dapp_close = 'dapp_close', // when a dapp is closed from the in-app dapp web view
  dapp_screen_open = 'dapp_screen_open',
  dapp_select = 'dapp_select',
  dapp_bottom_sheet_open = 'dapp_bottom_sheet_open',
  dapp_bottom_sheet_dismiss = 'dapp_bottom_sheet_dismiss',
  dapp_view_all = 'dapp_view_all', // when user taps "view all dapps" from recently used dapps section
}

export enum KolektivoNotificationEvents {
  view_cico_prompt = 'view_cico_prompt',
  cico_prompt_complete = 'cico_prompt_complete',
}

export type AnalyticsEventType =
  | AppEvents
  | HomeEvents
  | SettingsEvents
  | OnboardingEvents
  | VerificationEvents
  | IdentityEvents
  | AuthenticationEvents
  | InviteEvents
  | EscrowEvents
  | FiatExchangeEvents
  | SendEvents
  | RequestEvents
  | FeeEvents
  | TransactionEvents
  | CeloExchangeEvents
  | GethEvents
  | NetworkEvents
  | PerformanceEvents
  | NavigationEvents
  | RewardsEvents
  | WalletConnectEvents
  | DappKitEvents
  | CICOEvents
  | DappExplorerEvents
  | KolektivoNotificationEvents

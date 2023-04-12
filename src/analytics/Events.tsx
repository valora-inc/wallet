// TODO: TX feed + QR scanner

export enum AppEvents {
  app_launched = 'app_launched',
  app_state_error = 'app_state_error',
  error_displayed = 'error_displayed',
  error_fallback = 'error_fallback',
  error_boundary = 'error_boundary',
  user_restart = 'user_restart',
  fetch_balance = 'fetch_balance',
  fetch_balance_error = 'fetch_balance_error',
  redux_keychain_mismatch = 'redux_keychain_mismatch', // when the redux state doesn't contain the account found in the keychain
  redux_store_recovery_success = 'redux_store_recovery_success',
  redux_no_matching_keychain_account = 'redux_no_matching_keychain_account', // when account in redux has no matching password hash in the keychain
  push_notification_opened = 'push_notification_opened',
  push_notifications_permission_changed = 'push_notifications_permission_changed',
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
  view_nft_home_assets = 'view_nft_home_assets', // When "NFTs" is clicked in Home Assets Pages
  home_actions_send = 'home_actions_send',
  home_actions_receive = 'home_actions_receive',
  home_actions_add = 'home_actions_add',
  home_actions_swap = 'home_actions_swap',
  home_actions_request = 'home_actions_request',
  home_actions_withdraw = 'home_actions_withdraw',
}

export enum SettingsEvents {
  settings_profile_edit = 'settings_profile_edit',
  profile_generate_name = 'profile_generate_name',
  profile_save = 'profile_save',
  profile_cancel = 'profile_cancel',
  profile_photo_chosen = 'profile_photo_chosen',
  profile_photo_removed = 'profile_photo_removed',
  settings_verify_number = 'settings_verify_number',
  language_select = 'language_select',
  pin_require_on_load = 'pin_require_on_load',
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
  settings_recovery_phrase = 'settings_recovery_phrase',
  settings_haptic_feedback = 'settings_haptic_feedback',
}

export enum OnboardingEvents {
  onboarding_education_start = 'onboarding_education_start',
  onboarding_education_scroll = 'onboarding_education_scroll',
  onboarding_education_step_impression = 'onboarding_education_step_impression',
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
  name_and_picture_skip = 'name_and_picture_skip',
  name_and_picture_generate_name = 'name_and_picture_generate_name',

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

  initialize_account_start = 'initialize_account_start',
  initialize_account_complete = 'initialize_account_complete',
  initialize_account_error = 'initialize_account_error',

  account_dek_register_start = 'account_dek_register_start',
  account_dek_register_account_unlocked = 'account_dek_register_account_unlocked',
  account_dek_register_account_checked = 'account_dek_register_account_checked',
  account_dek_register_complete = 'account_dek_register_complete',

  protect_wallet_use_recovery = 'protect_wallet_use_recovery',
  protect_wallet_use_cloud = 'protect_wallet_use_cloud',
  protect_wallet_use_cloud_bottom_sheet = 'protect_wallet_use_cloud_bottom_sheet',
  protect_wallet_help = 'protect_wallet_help',
  protect_wallet_help_dismiss = 'protect_wallet_help_dismiss',
  protect_wallet_copy_phrase = 'protect_wallet_copy_phrase',
  protect_wallet_complete = 'protect_wallet_complete',

  cya_button_press = 'cya_button_press',
  cya_later = 'cya_later',
}

export enum VerificationEvents {
  verification_start = 'verification_start',
  verification_complete = 'verification_complete',
  verification_error = 'verification_error',
  verification_cancel = 'verification_cancel',
  verification_timeout = 'verification_timeout',
  verification_skip = 'verification_skip',
  verification_skip_confirm = 'verification_skip_confirm',

  verification_revoke_start = 'verification_revoke_start',
  verification_revoke_finish = 'verification_revoke_finish',
  verification_revoke_error = 'verification_revoke_error',
}

// Events emitted in the CPV flow
export enum PhoneVerificationEvents {
  phone_verification_skip = 'phone_verification_skip', // when skip is pressed in the phone number input screen
  phone_verification_skip_confirm = 'phone_verification_skip_confirm', // when skip is confirmed from the dialog in the phone number input screen
  phone_verification_learn_more = 'phone_verification_learn_more', // when the learn more dialog is launched in the phone number input screen
  phone_verification_start = 'phone_verification_start', // when the start button is pressed in the phone number input screen

  phone_verification_code_request_success = 'phone_verification_code_request_success', // when the verifyPhoneNumber endpoint returns successfully
  phone_verification_code_verify_start = 'phone_verification_code_verify_start', // when the user has entered the sms code and we start to validate on the backend
  phone_verification_code_verify_success = 'phone_verification_code_verify_success', // when the backend confirms that the sms code is successfully validated
  phone_verification_code_verify_error = 'phone_verification_code_verify_error', // when the backend throws an error and the sms code cannot be validated

  phone_verification_input_help = 'phone_verification_input_help', // when the help button is pressed
  phone_verification_input_help_skip = 'phone_verification_input_help_skip', // when the user presses skip on the help dialog to skip verification
  phone_verification_input_help_continue = 'phone_verification_input_help_continue', // when the user presses continue on the help dialog to continue verification

  phone_verification_resend_message = 'phone_verification_resend_message', // when the user triggers a resend of the sms code
}

export enum IdentityEvents {
  contacts_connect = 'contacts_connect', // when connect button is pressed
  contacts_import_permission_denied = 'contacts_import_permission_denied',
  contacts_import_start = 'contacts_import_start',
  contacts_import_complete = 'contacts_import_complete',
  contacts_processing_complete = 'contacts_processing_complete',
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
  invite_banner_impression = 'invite_banner_impression',
  invite_with_share = 'invite_with_share',
  invite_with_share_dismiss = 'invite_with_share_dismiss',
  invite_with_referral_url = 'invite_with_referral_url',
  opened_via_invite_url = 'opened_via_invite_url',
  invite_help_link = 'invite_help_link', // When taps "View all terms" in invite disclaimer
}

export enum EscrowEvents {
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
  send_tx_complete = 'send_tx_complete', // when a send transaction has successfully completed
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

export enum QrScreenEvents {
  // Events for the QR screen redesign
  qr_screen_bottom_sheet_open = 'qr_screen_bottom_sheet_open',
  qr_screen_bottom_sheet_close = 'qr_screen_bottom_sheet_close',
  qr_screen_bottom_sheet_link_press = 'qr_screen_bottom_sheet_link_press',
  qr_screen_copy_address = 'qr_screen_copy_address',
}

export enum RequestEvents {
  request_scan = 'request_scan', // when scan QR icon is selected from the request screen
  request_select_recipient = 'request_select_recipient', // when recipient was selected
  request_cancel = 'request_cancel', // when cancel is clicked after launching request flow
  request_amount_back = 'request_amount_back', // back button pressed on amount screen
  request_amount_continue = 'request_amount_continue', // when next button pressed on amount enter page
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
  cico_providers_unavailable_selected = 'cico_providers_unavailable_selected', // User taps a blurb about providers unavailable
  cico_providers_new_info_opened = 'cico_providers_new_info_opened', // User taps on the new label and views the dialog

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

  // External Exchanges QR Code Screen
  external_exchange_qr_bottom_sheet_open = 'external_exchange_qr_bottom_sheet_open',
  external_exchange_qr_bottom_sheet_close = 'external_exchange_qr_bottom_sheet_close',
  external_exchange_qr_bottom_sheet_link_press = 'external_exchange_qr_bottom_sheet_link_press',
  external_exchange_qr_back = 'external_exchange_qr_back',
  external_exchange_qr_copy_address = 'external_exchange_qr_copy_address',
  external_exchange_qr_share = 'external_exchange_qr_share',

  // Spend Flow
  spend_merchant_link = 'spend_merchant_link',
  cico_spend_select_provider_back = 'cico_spend_select_provider_back',
  cico_non_celo_exchange_send_bar_continue = 'cico_non_celo_exchange_send_bar_continue', // When send bar is tapped from cash out for cUSD & cEUR

  // Simplex Review Screen
  cico_simplex_open_webview = 'cico_simplex_open_webview',

  // Fiat connect review screen
  cico_fc_review_submit = 'cico_fc_review_submit',
  cico_fc_review_cancel = 'cico_fc_review_cancel',
  cico_fc_review_back = 'cico_fc_review_back',
  cico_fc_review_error_contact_support = 'cico_fc_review_error_contact_support',
  cico_fc_review_error_retry = 'cico_fc_review_error_retry',

  // Fiat Connect link account screen
  cico_fc_link_account_continue = 'cico_fc_link_account_continue',
  cico_fc_link_account_back = 'cico_fc_link_account_back',
  cico_fc_link_account_provider_website = 'cico_fc_link_account_provider_website',

  // Fiat Connect link KYC & account page
  cico_fc_link_kyc_account_back = 'cico_fc_link_kyc_account_back',
  // persona_kyc_start is fired when the 'Set up ID Verification' button is clicked

  // Fiat Connect fiat details screen
  cico_fiat_details_success = 'cico_fiat_details_success',
  cico_fiat_details_back = 'cico_fiat_details_back',
  cico_fiat_details_cancel = 'cico_fiat_details_cancel',
  cico_fiat_details_error = 'cico_fiat_details_error',

  // Fiat Connect transfer analytics
  cico_fc_transfer_api_error = 'cico_fc_transfer_api_error',
  cico_fc_transfer_tx_error = 'cico_fc_transfer_tx_error',
  cico_fc_transfer_error = 'cico_fc_transfer_error',
  cico_fc_transfer_success = 'cico_fc_transfer_success',

  // Fiat Connect transfer status screen
  cico_fc_transfer_error_retry = 'cico_fc_transfer_error_retry',
  cico_fc_transfer_error_cancel = 'cico_fc_transfer_error_cancel',
  cico_fc_transfer_error_contact_support = 'cico_fc_transfer_error_contact_support',
  cico_fc_transfer_success_complete = 'cico_fc_transfer_success_complete',
  cico_fc_transfer_success_view_tx = 'cico_fc_transfer_success_view_tx',
  cico_fc_transfer_processing_continue = 'cico_fc_transfer_processing_continue',
  cico_fc_transfer_processing_view_tx = 'cico_fc_transfer_processing_view_tx',

  // Fiat Connect KYC status screens
  cico_fc_kyc_status_contact_support = 'cico_fc_kyc_status_contact_support',
  cico_fc_kyc_status_back = 'cico_fc_kyc_status_back',
  cico_fc_kyc_status_close = 'cico_fc_kyc_status_close',
  cico_fc_kyc_status_try_again = 'cico_fc_kyc_status_try_again',
  cico_fc_kyc_status_switch_method = 'cico_fc_kyc_status_switch_method',
}

export enum ContractKitEvents {
  init_contractkit_start = 'init_contractkit_start',
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

  wc_copy_request_payload = 'wc_copy_request_payload', // when a user taps to copy the request payload from the bottom sheet
}

export enum DappKitEvents {
  dappkit_parse_deeplink_error = 'dappkit_parse_deeplink_error', // when dappkit fails to parse the deeplink
  dappkit_request_propose = 'dappkit_request_propose', // when the dappkit request screen is displayed to accept/deny a dapp request
  dappkit_request_cancel = 'dappkit_request_cancel', // when user presses the button to cancel the dapp request
  dappkit_copy_request_details = 'dappkit_copy_request_details', // when user presses the button to copy details of a dapp request
  dappkit_request_accept_start = 'dappkit_request_accept_start', // when user presses the button to accept a dapp request
  dappkit_request_accept_success = 'dappkit_request_accept_success', // when the dapp request succeeds
  dappkit_request_accept_error = 'dappkit_request_accept_error', // when the dapp request fails
}

export enum CICOEvents {
  persona_kyc_start = 'persona_kyc_start', // when a user begins the Persona KYC process
  persona_kyc_success = 'persona_kyc_success', // when the onComplete callback is called for a Persona inquiry with success status
  persona_kyc_failed = 'persona_kyc_failed', // when the onComplete callback is called for a Persona inquiry with failed status
  persona_kyc_cancel = 'persona_kyc_cancel', // when the onCancelled callback is called for a Persona inquiry
  persona_kyc_error = 'persona_kyc_error', // when the onError callback is called for a Persona inquiry
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
  dapp_favorite = 'dapp_favorite', // when user favorites a dapp
  dapp_unfavorite = 'dapp_unfavorite', // when user unfavorites a dapp
  dapp_open_info = 'dapp_open_info', // when a user taps on the help icon
  dapp_open_more_info = 'dapp_open_more_info', // when a user taps on the "more" button from inside the help bottom sheet
  dapp_filter = 'dapp_filter', // when a user taps on a filter
  dapp_search = 'dapp_search', // when a user searches on the dapp explorer screen
}

export enum WebViewEvents {
  webview_more_options = 'webview_more_options', // when user taps "triple dot icon" from the webview
  webview_open_in_browser = 'webview_open_in_browser', // when user taps "Open in External Browser" from the webview options
}

export enum CoinbasePayEvents {
  coinbase_pay_flow_start = 'coinbase_pay_flow_start', // When user is navigated to Coinbase Pay experience
  coinbase_pay_flow_exit = 'coinbase_pay_flow_exit', // When user exits Coinbase Pay
}

export enum SwapEvents {
  swap_screen_open = 'swap_screen_open', // When the screen is mounted
  swap_screen_select_token = 'swap_screen_select_token', // When a user selects a token, prompting the token select bottom sheet
  swap_screen_confirm_token = 'swap_screen_confirm_token', // When a user selects a token from the bottom sheet
  swap_screen_max_swap_amount = 'swap_screen_max_swap_amount', // when a user taps on the "max" button to swap their whole balance
  swap_gas_fees_learn_more = 'swap_gas_fees_learn_more', // When a user taps on the learn more text on the max swap amount warning
  swap_screen_review_swap = 'swap_screen_review_swap', // When a user click on the review button to proceed to next step
  swap_feed_detail_view_tx = 'swap_feed_detail_view_tx', // When a user click 'View on CeloExplorer' in the swap feed detail page
  swap_review_screen_open = 'swap_review_screen_open', // When the review screen is mounted
  swap_review_submit = 'swap_review_submit', // When the user submits the swap
  swap_execute_price_change = 'swap_execute_price_change', // When guaranteed is greater than 2% difference than the quoted price.
  swap_execute_success = 'swap_execute_success', // When the swap is executed successfully
  swap_execute_error = 'swap_execute_error', // When the swap returns an error
  swap_learn_more = 'swap_learn_more', // When a user taps on the learn more button on the swap screen
}

export enum CeloNewsEvents {
  celo_news_screen_open = 'celo_news_screen_open', // When the screen is mounted
  celo_news_article_tap = 'celo_news_article_tap', // When a user taps on a news article
  celo_news_bottom_read_more_tap = 'celo_news_bottom_read_more_tap', // When a user taps on the read more button at the bottom of the screen
  celo_news_retry_tap = 'celo_news_retry_tap', // When a user taps on the retry button
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
  | PerformanceEvents
  | NavigationEvents
  | RewardsEvents
  | WalletConnectEvents
  | DappKitEvents
  | CICOEvents
  | DappExplorerEvents
  | WebViewEvents
  | CoinbasePayEvents
  | SwapEvents
  | CeloNewsEvents

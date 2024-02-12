// TODO: TX feed + QR scanner

export enum AppEvents {
  app_launched = 'app_launched',
  app_state_error = 'app_state_error',
  error_displayed = 'error_displayed',
  error_fallback = 'error_fallback',
  user_restart = 'user_restart',
  fetch_balance = 'fetch_balance',
  fetch_balance_error = 'fetch_balance_error',
  redux_keychain_mismatch = 'redux_keychain_mismatch',
  redux_store_recovery_success = 'redux_store_recovery_success',
  redux_no_matching_keychain_account = 'redux_no_matching_keychain_account',
  push_notification_opened = 'push_notification_opened',
  push_notifications_permission_changed = 'push_notifications_permission_changed',
  android_mobile_services_checked = 'android_mobile_services_checked',

  request_tracking_permission_started = 'request_tracking_permission_started',
  request_tracking_permission_declined = 'request_tracking_permission_declined',
  request_tracking_permission_accepted = 'request_tracking_permission_accepted',

  account_funded = 'account_funded',
  account_liquidated = 'account_liquidated',

  in_app_review_impression = 'in_app_review_impression',
  in_app_review_error = 'in_app_review_error',

  multichain_beta_opt_in = 'multichain_beta_opt_in',
  multichain_beta_opt_out = 'multichain_beta_opt_out',
  multichain_beta_contact_support = 'multichain_beta_contact_support',

  handle_deeplink = 'handle_deeplink',
}

export enum HomeEvents {
  hamburger_tapped = 'hamburger_tapped',
  drawer_navigation = 'drawer_navigation',
  drawer_address_copy = 'drawer_address_copy',
  notification_scroll = 'notification_scroll',
  notification_impression = 'notification_impression',
  notification_select = 'notification_select',
  transaction_feed_item_select = 'transaction_feed_item_select',
  transaction_feed_address_copy = 'transaction_feed_address_copy',
  view_token_balances = 'view_token_balances',
  view_nft_home_assets = 'view_nft_home_assets',
  home_action_pressed = 'home_action_pressed',
  notification_bell_pressed = 'notification_bell_pressed',
  notification_center_opened = 'notification_center_opened',
  notification_center_spotlight_dismiss = 'notification_center_spotlight_dismiss',
  hide_balances = 'hide_balances',
  show_balances = 'show_balances',
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
  settings_analytics = 'settings_analytics',

  settings_revoke_phone_number = 'settings_revoke_phone_number',
  settings_revoke_phone_number_confirm = 'settings_revoke_phone_number_confirm',

  settings_set_up_keyless_backup = 'settings_set_up_keyless_backup',
  settings_delete_keyless_backup = 'settings_delete_keyless_backup',
}

export enum KeylessBackupEvents {
  wallet_security_primer_get_started = 'wallet_security_primer_get_started',
  cab_setup_recovery_phrase = 'cab_setup_recovery_phrase',
  cab_sign_in_with_google = 'cab_sign_in_with_google',
  cab_sign_in_with_google_success = 'cab_sign_in_with_google_success',
  cab_sign_in_with_email_screen_cancel = 'cab_sign_in_with_email_screen_cancel',
  cab_get_torus_keyshare_failed = 'cab_get_torus_keyshare_failed',
  cab_enter_phone_number_continue = 'cab_enter_phone_number_continue',
  cab_enter_phone_number_cancel = 'cab_enter_phone_number_cancel',
  cab_intro_continue = 'cab_intro_continue',
  cab_issue_sms_code_start = 'cab_issue_sms_code_start',
  cab_issue_sms_code_success = 'cab_issue_sms_code_success',
  cab_issue_sms_code_error = 'cab_issue_sms_code_error',
  cab_enter_phone_code_cancel = 'cab_enter_phone_code_cancel',
  cab_issue_valora_keyshare_start = 'cab_issue_valora_keyshare_start',
  cab_issue_valora_keyshare_success = 'cab_issue_valora_keyshare_success',
  cab_issue_valora_keyshare_error = 'cab_issue_valora_keyshare_error',
  cab_progress_completed_continue = 'cab_progress_completed_continue',
  cab_progress_failed_later = 'cab_progress_failed_later',
  cab_progress_failed_manual = 'cab_progress_failed_manual',
  cab_post_encrypted_mnemonic_failed = 'cab_post_encrypted_mnemonic_failed',
  cab_torus_keyshare_timeout = 'cab_torus_keyshare_timeout',
  cab_handle_keyless_backup_failed = 'cab_handle_keyless_backup_failed',
  cab_handle_keyless_backup_success = 'cab_handle_keyless_backup_success',
  cab_restore_zero_balance_accept = 'cab_restore_zero_balance_accept',
  cab_restore_zero_balance_bail = 'cab_restore_zero_balance_bail',
  cab_restore_completed_continue = 'cab_restore_completed_continue',
  cab_restore_failed_try_again = 'cab_restore_failed_try_again',
  cab_restore_failed_create_new_wallet = 'cab_restore_failed_create_new_wallet',
  cab_restore_failed_help = 'cab_restore_failed_help',
  cab_phone_verification_help = 'cab_phone_verification_help',
  cab_phone_verification_help_skip = 'cab_phone_verification_help_skip',
  cab_phone_verification_help_go_back = 'cab_phone_verification_help_go_back',
}

export enum OnboardingEvents {
  onboarding_education_scroll = 'onboarding_education_scroll',
  onboarding_education_step_impression = 'onboarding_education_step_impression',

  create_account_start = 'create_account_start',

  restore_account_start = 'restore_account_start',
  restore_account_cancel = 'restore_account_cancel',

  backup_education_start = 'backup_education_start',
  backup_education_scroll = 'backup_education_scroll',
  backup_education_complete = 'backup_education_complete',
  backup_education_cancel = 'backup_education_cancel',

  backup_start = 'backup_start',
  backup_continue = 'backup_continue',
  backup_complete = 'backup_complete',
  backup_more_info = 'backup_more_info',
  backup_delay_confirm = 'backup_delay_confirm',
  backup_delay_cancel = 'backup_delay_cancel',
  backup_cancel = 'backup_cancel',
  backup_error = 'backup_error',

  backup_quiz_start = 'backup_quiz_start',
  backup_quiz_progress = 'backup_quiz_progress',
  backup_quiz_complete = 'backup_quiz_complete',
  backup_quiz_incorrect = 'backup_quiz_incorrect',

  terms_and_conditions_accepted = 'terms_and_conditions_accepted',

  celo_education_start = 'celo_education_start',
  celo_education_scroll = 'celo_education_scroll',
  celo_education_complete = 'celo_education_complete',
  celo_education_cancel = 'celo_education_cancel',

  name_and_picture_set = 'name_and_picture_set',
  name_and_picture_skip = 'name_and_picture_skip',

  pin_set = 'pin_set',
  pin_invalid = 'pin_invalid',
  pin_never_set = 'pin_never_set',

  biometry_opt_in_start = 'biometry_opt_in_start',
  biometry_opt_in_cancel = 'biometry_opt_in_cancel',
  biometry_opt_in_approve = 'biometry_opt_in_approve',
  biometry_opt_in_complete = 'biometry_opt_in_complete',
  biometry_opt_in_error = 'biometry_opt_in_error',

  wallet_import_start = 'wallet_import_start',
  wallet_import_phrase_updated = 'wallet_import_phrase_updated',
  wallet_import_submit = 'wallet_import_submit',
  wallet_import_cancel = 'wallet_import_cancel',
  wallet_import_zero_balance = 'wallet_import_zero_balance',
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
  protect_wallet_help = 'protect_wallet_help',
  protect_wallet_help_dismiss = 'protect_wallet_help_dismiss',
  protect_wallet_copy_phrase = 'protect_wallet_copy_phrase',
  protect_wallet_complete = 'protect_wallet_complete',

  cya_button_press = 'cya_button_press',
  cya_later = 'cya_later',

  link_phone_number = 'link_phone_number',
  link_phone_number_later = 'link_phone_number_later',
}

// Events emitted in the CPV flow
export enum PhoneVerificationEvents {
  phone_verification_skip_confirm = 'phone_verification_skip_confirm',
  phone_verification_learn_more = 'phone_verification_learn_more',
  phone_verification_start = 'phone_verification_start',

  phone_verification_code_request_success = 'phone_verification_code_request_success',
  phone_verification_restore_success = 'phone_verification_restore_success',
  phone_verification_code_verify_start = 'phone_verification_code_verify_start',
  phone_verification_code_verify_success = 'phone_verification_code_verify_success',
  phone_verification_code_verify_error = 'phone_verification_code_verify_error',

  phone_verification_input_help = 'phone_verification_input_help',
  phone_verification_input_help_continue = 'phone_verification_input_help_continue',

  phone_verification_resend_message = 'phone_verification_resend_message',

  phone_verification_revoke_start = 'phone_verification_revoke_start',
  phone_verification_revoke_success = 'phone_verification_revoke_success',
  phone_verification_revoke_error = 'phone_verification_revoke_error',
}

export enum IdentityEvents {
  contacts_import_permission_denied = 'contacts_import_permission_denied',
  contacts_import_start = 'contacts_import_start',
  contacts_import_complete = 'contacts_import_complete',
  contacts_processing_complete = 'contacts_processing_complete',
  contacts_import_error = 'contacts_import_error',

  phone_number_lookup_start = 'phone_number_lookup_start',
  phone_number_lookup_complete = 'phone_number_lookup_complete',
  phone_number_lookup_error = 'phone_number_lookup_error',

  address_lookup_start = 'address_lookup_start',
  address_lookup_complete = 'address_lookup_complete',
  address_lookup_error = 'address_lookup_error',
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
  invite_help_link = 'invite_help_link',
}

export enum EscrowEvents {
  escrow_fetch_start = 'escrow_fetch_start',
  escrow_fetch_complete = 'escrow_fetch_complete',
  escrow_fetch_error = 'escrow_fetch_error',

  escrow_reclaim_confirm = 'escrow_reclaim_confirm',
  escrow_reclaim_cancel = 'escrow_reclaim_cancel',
  escrow_reclaim_start = 'escrow_reclaim_start',
  escrow_reclaim_complete = 'escrow_reclaim_complete',
  escrow_reclaim_error = 'escrow_reclaim_error',
}

export enum SendEvents {
  send_scan = 'send_scan',
  send_select_recipient = 'send_select_recipient',
  send_cancel = 'send_cancel',
  send_amount_back = 'send_amount_back',
  send_amount_continue = 'send_amount_continue',
  send_confirm_back = 'send_confirm_back',
  send_confirm_send = 'send_confirm_send',

  send_secure_start = 'send_secure_start',
  send_secure_back = 'send_secure_back',
  send_secure_cancel = 'send_secure_cancel',

  send_secure_info = 'send_secure_info',
  send_secure_info_dismissed = 'send_secure_info_dismissed',
  send_secure_submit = 'send_secure_submit',
  send_secure_incorrect = 'send_secure_incorrect',
  send_secure_complete = 'send_secure_complete',

  send_tx_start = 'send_tx_start',
  send_tx_complete = 'send_tx_complete',
  send_tx_error = 'send_tx_error',

  token_dropdown_opened = 'token_dropdown_opened',
  max_pressed = 'max_pressed',
  swap_input_pressed = 'swap_input_pressed',

  // related to the alert that is shown when sending to an unknown address
  check_account_alert_shown = 'check_account_alert_shown',
  check_account_do_not_ask_selected = 'check_account_do_not_ask_selected',
  check_account_alert_back = 'check_account_alert_back',
  check_account_alerts_continue = 'check_account_alerts_continue',

  // events specific to send select recipient screen
  send_select_recipient_scan_qr = 'send_select_recipient_scan_qr',
  send_select_recipient_contacts = 'send_select_recipient_contacts',
  send_phone_number_modal_connect = 'send_phone_number_modal_connect',
  send_phone_number_modal_dismiss = 'send_phone_number_modal_dismiss',
  send_contacts_modal_settings = 'send_contacts_modal_settings',
  send_contacts_modal_dismiss = 'send_contacts_modal_dismiss',
  request_contacts_permission_started = 'request_contacts_permission_started',
  request_contacts_permission_completed = 'request_contacts_permission_completed',
  send_select_recipient_invite_press = 'send_select_recipient_invite_press',
  send_select_recipient_send_press = 'send_select_recipient_send_press',
  send_select_recipient_recent_press = 'send_select_recipient_recent_press',
}

export enum QrScreenEvents {
  // Events for the QR screen redesign
  qr_screen_copy_address = 'qr_screen_copy_address',
  qr_scanner_open = 'qr_scanner_open',
  qr_scanned = 'qr_scanned',
}

export enum FeeEvents {
  estimate_fee_failed = 'estimate_fee_failed',
  estimate_fee_success = 'estimate_fee_success',
}

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
  celo_home_info = 'celo_home_info',

  celo_withdraw_completed = 'celo_withdraw_completed',

  celo_chart_tapped = 'celo_chart_tapped',
}

export enum FiatExchangeEvents {
  // The CICO landing page accessible from the Settings Menu
  cico_landing_token_balance = 'cico_landing_token_balance',
  cico_landing_select_flow = 'cico_landing_select_flow',
  cico_landing_how_to_fund = 'cico_landing_how_to_fund',

  // The CICO Amount screen where the user selects the amount of money
  cico_amount_chosen = 'cico_amount_chosen',
  cico_amount_chosen_invalid = 'cico_amount_chosen_invalid',
  cico_amount_back = 'cico_amount_back',

  // Select Provider Screen
  cico_providers_section_impression = 'cico_providers_section_impression',
  cico_providers_section_expand = 'cico_providers_section_expand',
  cico_providers_section_collapse = 'cico_providers_section_collapse',
  cico_providers_quote_selected = 'cico_providers_quote_selected',
  cico_providers_exchanges_selected = 'cico_providers_exchanges_selected',

  cico_providers_fetch_quotes_result = 'cico_providers_fetch_quotes_result',
  cico_providers_back = 'cico_providers_back',
  cico_providers_unavailable_impression = 'cico_providers_unavailable_impression',
  cico_providers_unavailable_selected = 'cico_providers_unavailable_selected',
  cico_providers_new_info_opened = 'cico_providers_new_info_opened',

  // Cash In Success Screen
  cash_in_success = 'cash_in_success',

  // Add fund flow entered through home screen cash in bottom sheet
  cico_add_bottom_sheet_selected = 'cico_add_bottom_sheet_selected',
  cico_add_bottom_sheet_impression = 'cico_add_bottom_sheet_impression',
  cico_add_bottom_sheet_ramp_selected = 'cico_add_bottom_sheet_ramp_selected',
  cico_add_bottom_sheet_ramp_available = 'cico_add_bottom_sheet_ramp_available',

  // Add fund flow via new user get started card
  cico_add_get_started_impression = 'cico_add_get_started_impression',
  cico_add_get_started_selected = 'cico_add_get_started_selected',

  // Funding Education Dialog Screen
  cico_add_funds_info_support = 'cico_add_funds_info_support',
  cico_cash_out_info_support = 'cico_cash_out_info_support',

  // External Exchanges Screen
  external_exchange_link = 'external_exchange_link',
  cico_external_exchanges_back = 'cico_external_exchanges_back',
  cico_cash_out_copy_address = 'cico_cash_out_copy_address',

  // External Exchanges QR Code Screen
  cico_exchange_qr_bottom_sheet_open = 'cico_exchange_qr_bottom_sheet_open',
  cico_exchange_qr_bottom_sheet_close = 'cico_exchange_qr_bottom_sheet_close',
  cico_exchange_qr_bottom_sheet_link_press = 'cico_exchange_qr_bottom_sheet_link_press',
  cico_exchange_qr_back = 'cico_exchange_qr_back',
  cico_exchange_qr_copy_address = 'cico_exchange_qr_copy_address',
  cico_exchange_qr_share = 'cico_exchange_qr_share',

  // Spend Flow
  spend_merchant_link = 'spend_merchant_link',
  cico_spend_select_provider_back = 'cico_spend_select_provider_back',
  cico_non_celo_exchange_send_bar_continue = 'cico_non_celo_exchange_send_bar_continue',

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
  wc_pairing_start = 'wc_pairing_start',
  wc_pairing_success = 'wc_pairing_success',
  wc_pairing_error = 'wc_pairing_error',

  // Events related to WalletConnect sessions (approving/rejecting/removing dapps)
  wc_session_propose = 'wc_session_propose',
  wc_session_approve_start = 'wc_session_approve_start',
  wc_session_approve_success = 'wc_session_approve_success',
  wc_session_approve_error = 'wc_session_approve_error',
  wc_session_reject_start = 'wc_session_reject_start',
  wc_session_reject_success = 'wc_session_reject_success',
  wc_session_reject_error = 'wc_session_reject_error',
  wc_session_remove_start = 'wc_session_remove_start',
  wc_session_remove_success = 'wc_session_remove_success',
  wc_session_remove_error = 'wc_session_remove_error',

  // Events related to WalletConnect requests from approved dapps (signing)
  wc_request_propose = 'wc_request_propose',
  wc_request_accept_start = 'wc_request_accept_start',
  wc_request_accept_success = 'wc_request_accept_success',
  wc_request_accept_error = 'wc_request_accept_error',
  wc_request_deny_start = 'wc_request_deny_start',
  wc_request_deny_success = 'wc_request_deny_success',
  wc_request_deny_error = 'wc_request_deny_error',

  wc_copy_request_payload = 'wc_copy_request_payload',
}

export enum DappKitEvents {
  dappkit_parse_deeplink_error = 'dappkit_parse_deeplink_error',
  dappkit_request_propose = 'dappkit_request_propose',
  dappkit_request_cancel = 'dappkit_request_cancel',
  dappkit_copy_request_details = 'dappkit_copy_request_details',
  dappkit_request_accept_start = 'dappkit_request_accept_start',
  dappkit_request_accept_success = 'dappkit_request_accept_success',
  dappkit_request_accept_error = 'dappkit_request_accept_error',
}

export enum CICOEvents {
  persona_kyc_start = 'persona_kyc_start',
  persona_kyc_success = 'persona_kyc_success',
  persona_kyc_failed = 'persona_kyc_failed',
  persona_kyc_cancel = 'persona_kyc_cancel',
  persona_kyc_error = 'persona_kyc_error',
}

export enum DappExplorerEvents {
  dapp_impression = 'dapp_impression',
  dapp_open = 'dapp_open',
  dapp_close = 'dapp_close',
  dapp_screen_open = 'dapp_screen_open',
  dapp_view_all = 'dapp_view_all',
  dapp_favorite = 'dapp_favorite',
  dapp_unfavorite = 'dapp_unfavorite',
  dapp_filter = 'dapp_filter',
  dapp_rankings_open = 'dapp_rankings_open',
}

export enum WebViewEvents {
  webview_more_options = 'webview_more_options',
  webview_open_in_browser = 'webview_open_in_browser',
}

export enum CoinbasePayEvents {
  coinbase_pay_flow_start = 'coinbase_pay_flow_start',
  coinbase_pay_flow_exit = 'coinbase_pay_flow_exit',
}

export enum SwapEvents {
  swap_screen_open = 'swap_screen_open',
  swap_screen_select_token = 'swap_screen_select_token',
  swap_screen_confirm_token = 'swap_screen_confirm_token',
  swap_screen_max_swap_amount = 'swap_screen_max_swap_amount',
  swap_gas_fees_learn_more = 'swap_gas_fees_learn_more',
  swap_review_submit = 'swap_review_submit',
  swap_execute_success = 'swap_execute_success',
  swap_execute_error = 'swap_execute_error',
  swap_learn_more = 'swap_learn_more',
  swap_price_impact_warning_displayed = 'swap_price_impact_warning_displayed',
  swap_show_info = 'swap_show_info',
  swap_show_fund_your_wallet = 'swap_show_fund_your_wallet',
  swap_add_funds = 'swap_add_funds',
}

export enum CeloNewsEvents {
  celo_news_screen_open = 'celo_news_screen_open',
  celo_news_article_tap = 'celo_news_article_tap',
  celo_news_bottom_read_more_tap = 'celo_news_bottom_read_more_tap',
  celo_news_retry_tap = 'celo_news_retry_tap',
}

export enum TokenBottomSheetEvents {
  search_token = 'search_token',
  token_selected = 'token_selected',
  toggle_tokens_filter = 'toggle_tokens_filter',
}

export enum AssetsEvents {
  show_asset_balance_info = 'show_asset_balance_info',
  view_wallet_assets = 'view_wallet_assets',
  view_collectibles = 'view_collectibles',
  view_dapp_positions = 'view_dapp_positions',
  tap_asset = 'tap_asset',
  tap_claim_rewards = 'tap_claim_rewards',
  tap_token_details_action = 'tap_token_details_action',
  tap_token_details_learn_more = 'tap_token_details_learn_more',
  tap_token_details_bottom_sheet_action = 'tap_token_details_bottom_sheet_action',
  import_token_screen_open = 'import_token_screen_open',
  import_token_submit = 'import_token_submit',
  import_token_paste = 'import_token_paste',
  import_token_error = 'import_token_error',
}

export enum NftEvents {
  nft_error_screen_open = 'nft_error_screen_open',
  nft_media_load = 'nft_media_load',
  nft_gallery_screen_open = 'nft_gallery_screen_open',
}

export enum BuilderHooksEvents {
  hooks_enable_preview_propose = 'hooks_enable_preview_propose',
  hooks_enable_preview_cancel = 'hooks_enable_preview_cancel',
  hooks_enable_preview_confirm = 'hooks_enable_preview_confirm',
  hooks_enable_preview_error = 'hooks_enable_preview_error',
  hooks_disable_preview = 'hooks_disable_preview',
}

export enum DappShortcutsEvents {
  dapp_shortcuts_rewards_screen_open = 'dapp_shortcuts_rewards_screen_open',
  dapp_shortcuts_reward_claim_start = 'dapp_shortcuts_reward_claim_start',
  dapp_shortcuts_reward_claim_success = 'dapp_shortcuts_reward_claim_success',
  dapp_shortcuts_reward_claim_error = 'dapp_shortcuts_reward_claim_error',
  dapp_shortcuts_reward_tx_propose = 'dapp_shortcuts_reward_tx_propose',
  dapp_shortcuts_reward_tx_copy = 'dapp_shortcuts_reward_tx_copy',
  dapp_shortcuts_reward_tx_accepted = 'dapp_shortcuts_reward_tx_accepted',
  dapp_shortcuts_reward_tx_rejected = 'dapp_shortcuts_reward_tx_rejected',
}

export enum TransactionDetailsEvents {
  transaction_details_tap_details = 'transaction_details_tap_details',
  transaction_details_tap_check_status = 'transaction_details_tap_check_status',
  transaction_details_tap_retry = 'transaction_details_tap_retry',
  transaction_details_tap_block_explorer = 'transaction_details_tap_block_explorer',
}

export enum StatsigDynamicConfigs {
  USERNAME_BLOCK_LIST = 'username_block_list',
  WALLET_NETWORK_TIMEOUT_SECONDS = 'wallet_network_timeout_seconds',
  MULTI_CHAIN_FEATURES = 'multi_chain_features',
  DAPP_WEBVIEW_CONFIG = 'dapp_webview_config',
  SWAP_CONFIG = 'swap_config',
  CICO_TOKEN_INFO = 'cico_token_info',
  WALLET_JUMPSTART_CONFIG = 'wallet_jumpstart_config',
}

export enum StatsigFeatureGates {
  SHOW_POSITIONS = 'show_positions',
  SHOW_CLAIM_SHORTCUTS = 'show_claim_shortcuts',
  ALLOW_HOOKS_PREVIEW = 'allow_hooks_preview',
  APP_REVIEW = 'app_review',
  SHOW_IN_APP_NFT_VIEWER = 'show_in_app_nft_viewer',
  SHOW_RECEIVE_AMOUNT_IN_SELECT_PROVIDER = 'show_receive_amount_in_select_provider',
  SHOW_IN_APP_NFT_GALLERY = 'show_in_app_nft_gallery',
  SHOW_NOTIFICATION_CENTER = 'show_notification_center',
  SHOW_CLOUD_ACCOUNT_BACKUP_SETUP = 'show_cloud_account_backup_setup',
  SHOW_CLOUD_ACCOUNT_BACKUP_RESTORE = 'show_cloud_account_backup_restore',
  USE_VIEM_FOR_SEND = 'use_viem_for_send',
  SHOW_ASSET_DETAILS_SCREEN = 'show_asset_details_screen',
  RESTRICT_SUPERCHARGE_FOR_CLAIM_ONLY = 'restrict_supercharge_for_claim_only',
  USE_VIEM_FOR_WALLETCONNECT_TRANSACTIONS = 'use_viem_for_walletconnect_transactions',
  USE_NEW_SEND_FLOW = 'use_new_send_flow',
  SHOW_IMPORT_TOKENS_FLOW = 'show_import_tokens_flow',
  SHOW_HIDE_HOME_BALANCES_TOGGLE = 'show_hide_home_balances_toggle',
  SHOW_MULTICHAIN_BETA_SCREEN = 'show_multichain_beta_screen',
  SHOW_BETA_TAG = 'show_beta_tag',
  SAVE_CONTACTS = 'save_contacts',
  USE_PRICE_HISTORY_FROM_BLOCKCHAIN_API = 'use_price_history_from_blockchain_api',
  SHOW_GET_STARTED = 'show_get_started',
  CLEVERTAP_INBOX = 'clevertap_inbox',
  SHOW_SWAP_TOKEN_FILTERS = 'show_swap_token_filters',
}

export enum StatsigExperiments {
  CHOOSE_YOUR_ADVENTURE = 'choose_your_adventure',
  SWAPPING_NON_NATIVE_TOKENS = 'swapping_non_native_tokens',
  DAPP_RANKINGS = 'dapp_rankings',
  DAPP_MENU_ITEM_COPY = 'dapp_menu_item_copy',
  SWAP_BUY_AMOUNT = 'swap_buy_amount',
}

export type StatsigParameter =
  | string
  | number
  | boolean
  | StatsigParameter[]
  | { [key: string]: StatsigParameter }

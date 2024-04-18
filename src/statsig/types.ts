export enum StatsigDynamicConfigs {
  USERNAME_BLOCK_LIST = 'username_block_list',
  WALLET_NETWORK_TIMEOUT_SECONDS = 'wallet_network_timeout_seconds',
  MULTI_CHAIN_FEATURES = 'multi_chain_features',
  DAPP_WEBVIEW_CONFIG = 'dapp_webview_config',
  SWAP_CONFIG = 'swap_config',
  CICO_TOKEN_INFO = 'cico_token_info',
  WALLET_JUMPSTART_CONFIG = 'wallet_jumpstart_config',
  NFT_CELEBRATION_CONFIG = 'nft_celebration_config',
}

export enum StatsigFeatureGates {
  SHOW_POSITIONS = 'show_positions',
  SHOW_CLAIM_SHORTCUTS = 'show_claim_shortcuts',
  ALLOW_HOOKS_PREVIEW = 'allow_hooks_preview',
  APP_REVIEW = 'app_review',
  SHOW_CLOUD_ACCOUNT_BACKUP_SETUP = 'show_cloud_account_backup_setup',
  SHOW_CLOUD_ACCOUNT_BACKUP_RESTORE = 'show_cloud_account_backup_restore',
  RESTRICT_SUPERCHARGE_FOR_CLAIM_ONLY = 'restrict_supercharge_for_claim_only',
  SHOW_IMPORT_TOKENS_FLOW = 'show_import_tokens_flow',
  SHOW_MULTICHAIN_BETA_SCREEN = 'show_multichain_beta_screen',
  SHOW_BETA_TAG = 'show_beta_tag',
  SAVE_CONTACTS = 'save_contacts',
  USE_PRICE_HISTORY_FROM_BLOCKCHAIN_API = 'use_price_history_from_blockchain_api',
  SHOW_GET_STARTED = 'show_get_started',
  CLEVERTAP_INBOX = 'clevertap_inbox',
  SHOW_SWAP_TOKEN_FILTERS = 'show_swap_token_filters',
  SHUFFLE_SWAP_TOKENS_ORDER = 'shuffle_swap_tokens_order',
  SHOW_NFT_CELEBRATION = 'show_nft_celebration',
  SHOW_NFT_REWARD = 'show_nft_reward',
  SHOW_JUMPSTART_SEND = 'show_jumpstart_send',
  USE_TAB_NAVIGATOR = 'use_tab_navigator',
  SHOW_POINTS = 'show_points',
}

export enum StatsigExperiments {
  SWAPPING_NON_NATIVE_TOKENS = 'swapping_non_native_tokens',
  DAPP_RANKINGS = 'dapp_rankings',
  SWAP_BUY_AMOUNT = 'swap_buy_amount',
  ONBOARDING_PHONE_VERIFICATION = 'onboarding_phone_verification',
}

export type StatsigParameter =
  | string
  | number
  | boolean
  | StatsigParameter[]
  | { [key: string]: StatsigParameter }

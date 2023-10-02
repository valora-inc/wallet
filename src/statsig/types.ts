export enum QRCodeDataType {
  ValoraDeepLink = 'ValoraDeepLink',
  Address = 'Address',
}

export enum QRCodeStyle {
  Legacy = 'Legacy',
  New = 'New',
}

export enum StatsigLayers {
  SEND_RECEIVE_QR_CODE = 'send_receive_qr_code',
}

export enum StatsigDynamicConfigs {
  USERNAME_BLOCK_LIST = 'username_block_list',
  WALLET_NETWORK_TIMEOUT_SECONDS = 'wallet_network_timeout_seconds',
}

export enum StatsigFeatureGates {
  USE_ZENDESK_API_FOR_SUPPORT = 'use_zendesk_api_for_support',
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
  SHOW_MULTI_CHAIN_TRANSFERS = 'show_multi_chain_transfers',
  SHOW_NATIVE_TOKENS = 'show_native_tokens',
  SHOW_ETH_IN_CICO = 'show_eth_in_cico',
  FETCH_MULTI_CHAIN_BALANCES = 'fetch_multi_chain_balances',
  USE_VIEM_FOR_SEND = 'use_viem_for_send',
  MULTI_CHAIN_SEND = 'multi_chain_send',
}

export enum StatsigExperiments {
  ADD_FUNDS_CRYPTO_EXCHANGE_QR_CODE = 'add_funds_crypto_exchange_qr_code',
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

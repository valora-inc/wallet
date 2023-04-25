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
}

export enum StatsigExperiments {
  ADD_FUNDS_CRYPTO_EXCHANGE_QR_CODE = 'add_funds_crypto_exchange_qr_code',
  RECOVERY_PHRASE_IN_ONBOARDING = 'recovery_phrase_in_onboarding',
  CHOOSE_YOUR_ADVENTURE = 'choose_your_adventure',
  HOME_SCREEN_ACTIONS = 'home_screen_actions',
  SWAPPING_NON_NATIVE_TOKENS = 'swapping_non_native_tokens',
  DAPPS_FILTERS_AND_SEARCH = 'dapps_filters_and_search',
}

export type StatsigParameter =
  | string
  | number
  | boolean
  | StatsigParameter[]
  | { [key: string]: StatsigParameter }

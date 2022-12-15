export enum ScrollDirection {
  next = 'next',
  previous = 'previous',
}

export enum BackQuizProgress {
  word_chosen = 'word_chosen',
  backspace = 'backspace',
}

// Origin of Send actions
export enum SendOrigin {
  AppSendFlow = 'app_send_flow', // Sending as part of the app send flow
  AppRequestFlow = 'app_request_flow', // Sending because of a received payment request
  Bidali = 'bidali', // Sending from Bidali
}

// Origin of WalletConnect pairing
export enum WalletConnectPairingOrigin {
  Scan = 'scan',
  Deeplink = 'deeplink',
}

// Origin of WalletConnect/DappKit request
export enum DappRequestOrigin {
  InAppWebView = 'in_app_web_view',
  External = 'external',
}

// Statsig types. TODO(any): consider moving to a statsig/types file
export enum StatsigLayers {
  NAME_AND_PICTURE_SCREEN = 'name_and_picture_screen',
}

export enum StatsigDynamicConfigs {
  USERNAME_BLOCK_LIST = 'username_block_list',
}

export enum StatsigExperiments {
  ADD_FUNDS_CRYPTO_EXCHANGE_QR_CODE = 'add_funds_crypto_exchange_qr_code',
}

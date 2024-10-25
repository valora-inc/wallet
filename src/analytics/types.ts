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
  Bidali = 'bidali', // Sending from Bidali
}

// Origin of WalletConnect pairing
export enum WalletConnectPairingOrigin {
  Scan = 'scan',
  Deeplink = 'deeplink',
}

// Origin of WalletConnect request
export enum DappRequestOrigin {
  InAppWebView = 'in_app_web_view',
  External = 'external',
}

// Origin of Hooks enable preview
export enum HooksEnablePreviewOrigin {
  Scan = 'scan',
  Deeplink = 'deeplink',
}

export type TransactionOrigin =
  | 'send'
  | 'swap'
  | 'earn-deposit'
  | 'earn-swap-deposit'
  | 'earn-withdraw'
  | 'earn-claim-rewards'
  | 'jumpstart-send'
  | 'jumpstart-claim'
  | 'wallet-connect'
  | 'shortcut'

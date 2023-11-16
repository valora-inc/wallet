import {
  QRCodeDataType,
  QRCodeStyle,
  StatsigDynamicConfigs,
  StatsigExperiments,
  StatsigFeatureGates,
  StatsigLayers,
} from 'src/statsig/types'
import networkConfig from 'src/web3/networkConfig'

export const LayerParams = {
  // TODO(ACT-659): refactor to imitate defaultExperimentParamValues (more type safe, less boilerplate)
  [StatsigLayers.SEND_RECEIVE_QR_CODE]: {
    qrCodeStyle: {
      paramName: 'qrCodeStyle',
      defaultValue: QRCodeStyle.Legacy,
    },
    qrCodeDataType: {
      paramName: 'qrCodeDataType',
      defaultValue: QRCodeDataType.ValoraDeepLink,
    },
  },
}

export const FeatureGates = {
  [StatsigFeatureGates.USE_ZENDESK_API_FOR_SUPPORT]: false,
  [StatsigFeatureGates.SHOW_POSITIONS]: false,
  [StatsigFeatureGates.SHOW_CLAIM_SHORTCUTS]: false,
  [StatsigFeatureGates.ALLOW_HOOKS_PREVIEW]: true,
  [StatsigFeatureGates.APP_REVIEW]: false,
  [StatsigFeatureGates.SHOW_IN_APP_NFT_VIEWER]: false,
  [StatsigFeatureGates.SHOW_RECEIVE_AMOUNT_IN_SELECT_PROVIDER]: false,
  [StatsigFeatureGates.SHOW_IN_APP_NFT_GALLERY]: false,
  [StatsigFeatureGates.SHOW_NOTIFICATION_CENTER]: false,
  [StatsigFeatureGates.SHOW_CLOUD_ACCOUNT_BACKUP_SETUP]: false,
  [StatsigFeatureGates.SHOW_CLOUD_ACCOUNT_BACKUP_RESTORE]: false,
  [StatsigFeatureGates.USE_VIEM_FOR_SEND]: false,
  [StatsigFeatureGates.MULTI_CHAIN_SEND]: false,
  [StatsigFeatureGates.SHOW_ASSET_DETAILS_SCREEN]: false,
  [StatsigFeatureGates.RESTRICT_SUPERCHARGE_FOR_CLAIM_ONLY]: false,
  [StatsigFeatureGates.USE_VIEM_FOR_SWAP]: false,
  [StatsigFeatureGates.USE_VIEM_FOR_WALLETCONNECT_TRANSACTIONS]: false,
  [StatsigFeatureGates.USE_NEW_RECIPIENT_SCREEN]: false,
  [StatsigFeatureGates.USE_NEW_SEND_FLOW]: false,
  [StatsigFeatureGates.SHOW_IMPORT_TOKENS_FLOW]: false,
  [StatsigFeatureGates.SHOW_HIDE_HOME_BALANCES_TOGGLE]: false,
  [StatsigFeatureGates.USE_CICO_CURRENCY_BOTTOM_SHEET]: false,
}

export const ExperimentConfigs = {
  // NOTE: the keys of defaultValues MUST be parameter names
  [StatsigExperiments.CHOOSE_YOUR_ADVENTURE]: {
    experimentName: StatsigExperiments.CHOOSE_YOUR_ADVENTURE,
    defaultValues: {
      onboardingNameScreenEnabled: true,
      chooseAdventureEnabled: false,
      cashInBottomSheetEnabled: true,
    },
  },
  [StatsigExperiments.SWAPPING_NON_NATIVE_TOKENS]: {
    experimentName: StatsigExperiments.SWAPPING_NON_NATIVE_TOKENS,
    defaultValues: {
      swappingNonNativeTokensEnabled: false,
    },
  },
  [StatsigExperiments.DAPP_RANKINGS]: {
    experimentName: StatsigExperiments.DAPP_RANKINGS,
    defaultValues: {
      dappRankingsEnabled: false,
    },
  },
  [StatsigExperiments.DAPP_MENU_ITEM_COPY]: {
    experimentName: StatsigExperiments.DAPP_MENU_ITEM_COPY,
    defaultValues: {
      discoverCopyEnabled: false,
    },
  },
  [StatsigExperiments.SWAP_BUY_AMOUNT]: {
    experimentName: StatsigExperiments.SWAP_BUY_AMOUNT,
    defaultValues: {
      swapBuyAmountEnabled: true,
    },
  },
}

export const DynamicConfigs = {
  [StatsigDynamicConfigs.USERNAME_BLOCK_LIST]: {
    configName: StatsigDynamicConfigs.USERNAME_BLOCK_LIST,
    defaultValues: {
      blockedAdjectives: [] as string[],
      blockedNouns: [] as string[],
    },
  },
  [StatsigDynamicConfigs.WALLET_NETWORK_TIMEOUT_SECONDS]: {
    configName: StatsigDynamicConfigs.WALLET_NETWORK_TIMEOUT_SECONDS,
    defaultValues: {
      default: 15,
      cico: 30,
    },
  },
  [StatsigDynamicConfigs.MULTI_CHAIN_FEATURES]: {
    configName: StatsigDynamicConfigs.MULTI_CHAIN_FEATURES,
    defaultValues: {
      showCico: [networkConfig.defaultNetworkId],
      showBalances: [networkConfig.defaultNetworkId],
      showSend: [networkConfig.defaultNetworkId],
      showSwap: [networkConfig.defaultNetworkId],
      showTransfers: [networkConfig.defaultNetworkId],
    },
  },
  [StatsigDynamicConfigs.DAPP_WEBVIEW_CONFIG]: {
    configName: StatsigDynamicConfigs.DAPP_WEBVIEW_CONFIG,
    defaultValues: {
      disabledMediaPlaybackRequiresUserActionOrigins: [] as string[],
    },
  },
  [StatsigDynamicConfigs.SWAP_CONFIG]: {
    configName: StatsigDynamicConfigs.SWAP_CONFIG,
    defaultValues: {
      maxSlippagePercentage: '0.3',
    },
  },
}

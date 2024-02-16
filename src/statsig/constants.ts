import { StatsigDynamicConfigs, StatsigExperiments, StatsigFeatureGates } from 'src/statsig/types'
import { Network, NetworkId } from 'src/transactions/types'
import networkConfig from 'src/web3/networkConfig'

export const FeatureGates = {
  [StatsigFeatureGates.SHOW_POSITIONS]: false,
  [StatsigFeatureGates.SHOW_CLAIM_SHORTCUTS]: false,
  [StatsigFeatureGates.ALLOW_HOOKS_PREVIEW]: true,
  [StatsigFeatureGates.APP_REVIEW]: false,
  [StatsigFeatureGates.SHOW_IN_APP_NFT_VIEWER]: false,
  [StatsigFeatureGates.SHOW_IN_APP_NFT_GALLERY]: false,
  [StatsigFeatureGates.SHOW_NOTIFICATION_CENTER]: false,
  [StatsigFeatureGates.SHOW_CLOUD_ACCOUNT_BACKUP_SETUP]: false,
  [StatsigFeatureGates.SHOW_CLOUD_ACCOUNT_BACKUP_RESTORE]: false,
  [StatsigFeatureGates.SHOW_ASSET_DETAILS_SCREEN]: false,
  [StatsigFeatureGates.RESTRICT_SUPERCHARGE_FOR_CLAIM_ONLY]: false,
  [StatsigFeatureGates.USE_VIEM_FOR_WALLETCONNECT_TRANSACTIONS]: false,
  [StatsigFeatureGates.SHOW_IMPORT_TOKENS_FLOW]: false,
  [StatsigFeatureGates.SHOW_HIDE_HOME_BALANCES_TOGGLE]: false,
  [StatsigFeatureGates.SHOW_MULTICHAIN_BETA_SCREEN]: false,
  [StatsigFeatureGates.SHOW_BETA_TAG]: false,
  [StatsigFeatureGates.SAVE_CONTACTS]: false,
  [StatsigFeatureGates.USE_PRICE_HISTORY_FROM_BLOCKCHAIN_API]: false,
  [StatsigFeatureGates.SHOW_GET_STARTED]: false,
  [StatsigFeatureGates.CLEVERTAP_INBOX]: false,
  [StatsigFeatureGates.SHOW_SWAP_TOKEN_FILTERS]: false,
  [StatsigFeatureGates.SHUFFLE_SWAP_TOKENS_ORDER]: false,
  [StatsigFeatureGates.SHOW_NFT_CELEBRATION]: false,
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
  [StatsigExperiments.DAPP_RANKINGS]: {
    experimentName: StatsigExperiments.DAPP_RANKINGS,
    defaultValues: {
      dappRankingsEnabled: false,
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
      showWalletConnect: [networkConfig.defaultNetworkId],
      showApprovalTxsInHomefeed: [],
      showNfts: [networkConfig.defaultNetworkId],
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
      popularTokenIds: [] as string[],
    },
  },
  [StatsigDynamicConfigs.CICO_TOKEN_INFO]: {
    configName: StatsigDynamicConfigs.CICO_TOKEN_INFO,
    defaultValues: {
      tokenInfo: {} as { [tokenId: string]: { cicoOrder: number } },
    },
  },
  [StatsigDynamicConfigs.WALLET_JUMPSTART_CONFIG]: {
    configName: StatsigDynamicConfigs.WALLET_JUMPSTART_CONFIG,
    defaultValues: {} as { [key in Network]?: { contractAddress?: string } },
  },
  [StatsigDynamicConfigs.NFT_CELEBRATION_CONFIG]: {
    configName: StatsigDynamicConfigs.NFT_CELEBRATION_CONFIG,
    defaultValues: {} as { networkId?: NetworkId; contractAddress?: string },
  },
}

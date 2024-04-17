import { StatsigDynamicConfigs, StatsigExperiments, StatsigFeatureGates } from 'src/statsig/types'
import { NetworkId } from 'src/transactions/types'
import networkConfig from 'src/web3/networkConfig'

export const FeatureGates = {
  [StatsigFeatureGates.SHOW_POSITIONS]: false,
  [StatsigFeatureGates.SHOW_CLAIM_SHORTCUTS]: false,
  [StatsigFeatureGates.ALLOW_HOOKS_PREVIEW]: true,
  [StatsigFeatureGates.APP_REVIEW]: false,
  [StatsigFeatureGates.SHOW_CLOUD_ACCOUNT_BACKUP_SETUP]: false,
  [StatsigFeatureGates.SHOW_CLOUD_ACCOUNT_BACKUP_RESTORE]: false,
  [StatsigFeatureGates.RESTRICT_SUPERCHARGE_FOR_CLAIM_ONLY]: false,
  [StatsigFeatureGates.SHOW_IMPORT_TOKENS_FLOW]: false,
  [StatsigFeatureGates.SHOW_MULTICHAIN_BETA_SCREEN]: false,
  [StatsigFeatureGates.SHOW_BETA_TAG]: false,
  [StatsigFeatureGates.SAVE_CONTACTS]: false,
  [StatsigFeatureGates.USE_PRICE_HISTORY_FROM_BLOCKCHAIN_API]: false,
  [StatsigFeatureGates.SHOW_GET_STARTED]: false,
  [StatsigFeatureGates.CLEVERTAP_INBOX]: false,
  [StatsigFeatureGates.SHOW_SWAP_TOKEN_FILTERS]: false,
  [StatsigFeatureGates.SHUFFLE_SWAP_TOKENS_ORDER]: false,
  [StatsigFeatureGates.SHOW_NFT_CELEBRATION]: false,
  [StatsigFeatureGates.SHOW_NFT_REWARD]: false,
  [StatsigFeatureGates.SHOW_JUMPSTART_SEND]: false,
  [StatsigFeatureGates.USE_TAB_NAVIGATOR]: false,
  [StatsigFeatureGates.SHOW_POINTS]: false,
}

export const ExperimentConfigs = {
  // NOTE: the keys of defaultValues MUST be parameter names
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
  [StatsigExperiments.ONBOARDING_PHONE_VERIFICATION]: {
    experimentName: StatsigExperiments.ONBOARDING_PHONE_VERIFICATION,
    defaultValues: {
      skipVerification: false,
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
      showPositions: [networkConfig.defaultNetworkId],
      showShortcuts: [networkConfig.defaultNetworkId],
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
    defaultValues: {
      jumpstartContracts: {} as {
        [key in NetworkId]?: {
          contractAddress?: string
          depositERC20GasEstimate: string
          retiredContractAddresses?: string[]
        }
      },
      maxAllowedSendAmountUsd: 100,
    },
  },
  [StatsigDynamicConfigs.NFT_CELEBRATION_CONFIG]: {
    configName: StatsigDynamicConfigs.NFT_CELEBRATION_CONFIG,
    defaultValues: {
      celebratedNft: {} as { networkId?: NetworkId; contractAddress?: string },
      deepLink: '',
      rewardExpirationDate: new Date(0).toISOString(),
      rewardReminderDate: new Date(0).toISOString(),
    },
  },
}

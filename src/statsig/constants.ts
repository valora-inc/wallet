import { SelectProviderExchangesLink, SelectProviderExchangesText } from 'src/fiatExchanges/types'
import {
  QRCodeDataType,
  QRCodeStyle,
  StatsigDynamicConfigs,
  StatsigExperiments,
  StatsigFeatureGates,
  StatsigLayers,
} from 'src/statsig/types'

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
  [StatsigFeatureGates.APP_REVIEW]: false,
  [StatsigFeatureGates.SHOW_IN_APP_NFT_VIEWER]: false,
}

export const ExperimentConfigs = {
  // NOTE: the keys of defaultValues MUST be parameter names
  [StatsigExperiments.ADD_FUNDS_CRYPTO_EXCHANGE_QR_CODE]: {
    experimentName: StatsigExperiments.ADD_FUNDS_CRYPTO_EXCHANGE_QR_CODE,
    defaultValues: {
      addFundsExchangesText: SelectProviderExchangesText.CryptoExchange,
      addFundsExchangesLink: SelectProviderExchangesLink.ExternalExchangesScreen,
    },
  },
  [StatsigExperiments.RECOVERY_PHRASE_IN_ONBOARDING]: {
    experimentName: StatsigExperiments.RECOVERY_PHRASE_IN_ONBOARDING,
    defaultValues: {
      enableForcedBackup: true,
      showRecoveryPhraseInOnboarding: false,
      showCloudBackupFakeDoor: false,
      useNewBackupFlowCopy: false,
      showBackupAlert: false,
      useNewBackupHomeCard: false,
    },
  },
  [StatsigExperiments.CHOOSE_YOUR_ADVENTURE]: {
    experimentName: StatsigExperiments.CHOOSE_YOUR_ADVENTURE,
    defaultValues: {
      onboardingNameScreenEnabled: true,
      chooseAdventureEnabled: false,
      cashInBottomSheetEnabled: true,
    },
  },
  [StatsigExperiments.HOME_SCREEN_ACTIONS]: {
    experimentName: StatsigExperiments.HOME_SCREEN_ACTIONS,
    defaultValues: {
      showAddWithdrawOnMenu: true,
      showSwapOnMenu: true,
      showHomeActions: false,
      showHomeNavBar: true,
      showQrScanner: false,
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
}

export const DynamicConfigs = {
  [StatsigDynamicConfigs.USERNAME_BLOCK_LIST]: {
    configName: StatsigDynamicConfigs.USERNAME_BLOCK_LIST,
    defaultValues: {
      blockedAdjectives: [] as string[],
      blockedNouns: [] as string[],
    },
  },
}

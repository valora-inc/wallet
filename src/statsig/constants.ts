import { SelectProviderExchangesLink, SelectProviderExchangesText } from 'src/fiatExchanges/types'
import { QRCodeDataType, QRCodeStyle, StatsigExperiments, StatsigLayers } from 'src/statsig/types'

export const LayerParams = {
  // TODO(Charlie): refactor to imitate defaultExperimentParamValues (more type safe, less boilerplate)
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

// names and default values for experiments
//  keys of defaultValues MUST be parameter names for the experiment
export const ExperimentConfigs = {
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
}

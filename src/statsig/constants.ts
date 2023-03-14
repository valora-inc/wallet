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

// for each experiment, obj mapping param name to default value
export const defaultExperimentParamValues = {
  [StatsigExperiments.RECOVERY_PHRASE_IN_ONBOARDING]: {
    enableForcedBackup: true,
    showRecoveryPhraseInOnboarding: false,
    showCloudBackupFakeDoor: false,
    useNewBackupFlowCopy: false,
    showBackupAlert: false,
    useNewBackupHomeCard: false,
  },
  [StatsigExperiments.ADD_FUNDS_CRYPTO_EXCHANGE_QR_CODE]: {
    addFundsExchangesText: SelectProviderExchangesText.CryptoExchange,
    addFundsExchangesLink: SelectProviderExchangesLink.ExternalExchangesScreen,
  },
}

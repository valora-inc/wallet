// TODO(any): consider making it more type safe
import { SelectProviderExchangesLink, SelectProviderExchangesText } from 'src/fiatExchanges/types'
import { QRCodeDataType, QRCodeStyle, StatsigExperiments, StatsigLayers } from 'src/statsig/types'

export const LayerParams = {
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

export const ExperimentParams = {
  [StatsigExperiments.ADD_FUNDS_CRYPTO_EXCHANGE_QR_CODE]: {
    addFundsExchangesText: {
      paramName: 'addFundsExchangesText',
      defaultValue: SelectProviderExchangesText.CryptoExchange,
    },
    addFundsExchangesLink: {
      paramName: 'addFundsExchangesLink',
      defaultValue: SelectProviderExchangesLink.ExternalExchangesScreen,
    },
  },
}

import { PaymentMethod } from 'src/fiatExchanges/utils'
import { CiCoCurrency } from 'src/utils/currencies'

export enum SelectProviderExchangesText {
  CryptoExchange = 'CryptoExchange',
  DepositFrom = 'DepositFrom',
}

export enum SelectProviderExchangesLink {
  ExternalExchangesScreen = 'ExternalExchangesScreen',
  ExchangeQRScreen = 'ExchangeQRScreen',
}

export interface ProviderSelectionAnalyticsData {
  centralizedExchangesAvailable: boolean
  coinbasePayAvailable: boolean
  totalOptions: number
  paymentMethodsAvailable: Record<PaymentMethod, boolean>
  transferCryptoAmount: number
  cryptoType: CiCoCurrency
  lowestFeeKycRequired: boolean | undefined
  lowestFeeCryptoAmount: number | undefined
  lowestFeeProvider: string | undefined
  lowestFeePaymentMethod: PaymentMethod | undefined
}

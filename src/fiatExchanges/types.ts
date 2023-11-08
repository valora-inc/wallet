import { PaymentMethod } from 'src/fiatExchanges/utils'
import { Network } from 'src/transactions/types'
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
  cryptoType: string
  lowestFeeKycRequired: boolean | undefined
  lowestFeeCryptoAmount: number | undefined
  lowestFeeProvider: string | undefined
  lowestFeePaymentMethod: PaymentMethod | undefined
}

export const CiCoCurrencyNetworkMap: Record<CiCoCurrency, Network> = {
  [CiCoCurrency.CELO]: Network.Celo,
  [CiCoCurrency.cEUR]: Network.Celo,
  [CiCoCurrency.cUSD]: Network.Celo,
  [CiCoCurrency.cREAL]: Network.Celo,
  [CiCoCurrency.ETH]: Network.Ethereum,
}

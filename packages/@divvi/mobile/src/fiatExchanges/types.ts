import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { UserLocationData } from 'src/networkInfo/saga'

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
  totalOptions: number
  paymentMethodsAvailable: Record<PaymentMethod, boolean>
  transferCryptoAmount: number
  cryptoType: string
  lowestFeeKycRequired: boolean | undefined
  lowestFeeCryptoAmount: number | undefined
  lowestFeeProvider: string | undefined
  lowestFeePaymentMethod: PaymentMethod | undefined
  networkId: string | undefined
}

export type FiatExchangeFlowType = typeof FiatExchangeFlow
export enum FiatExchangeFlow {
  CashIn = 'CashIn',
  CashOut = 'CashOut',
  Spend = 'Spend',
}

export type CICOFlowType = typeof CICOFlow
export enum CICOFlow {
  CashIn = 'CashIn',
  CashOut = 'CashOut',
}

export enum PaymentMethod {
  Bank = 'Bank',
  Card = 'Card',
  MobileMoney = 'MobileMoney', // legacy mobile money
  FiatConnectMobileMoney = 'FiatConnectMobileMoney',
  Airtime = 'Airtime',
}

export type SimplexQuote = {
  user_id: string
  quote_id: string
  wallet_id: string
  digital_money: {
    currency: string
    amount: number
  }
  fiat_money: {
    currency: string
    base_amount: number
    total_amount: number
  }
  valid_until: string
  supported_digital_currencies: string[]
}

export type GetCicoQuotesRequest = {
  tokenId: string
  fiatCurrency: LocalCurrencyCode
  address: string
  userLocation: UserLocationData
} & (
  | {
      txType: 'cashIn'
      fiatAmount: string
    }
  | {
      txType: 'cashOut'
      cryptoAmount: string
    }
)

export interface CicoQuote {
  paymentMethod: 'Bank' | 'Card' | 'Airtime' | 'MobileMoney'
  url?: string
  fiatCurrency: LocalCurrencyCode
  tokenId: string
  txType: 'cashIn' | 'cashOut'
  fiatAmount: string
  cryptoAmount: string
  fiatFee?: string
  provider: {
    id: string
    displayName: string
    logoUrl: string
    logoWideUrl: string
  }
  additionalInfo?: {
    mobileCarrier?: 'Safaricom' | 'MTN' // mobile carrier used for airtime
    simplexQuote?: SimplexQuote | undefined // raw quote from Simplex, there is a wallet dependency on this
  }
}

export interface GetCicoQuotesResponse {
  quotes: CicoQuote[]
}

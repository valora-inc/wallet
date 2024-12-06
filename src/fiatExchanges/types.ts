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

export enum FiatExchangeFlow {
  CashIn = 'CashIn',
  CashOut = 'CashOut',
  Spend = 'Spend',
}

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

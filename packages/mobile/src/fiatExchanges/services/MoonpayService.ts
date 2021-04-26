import { CURRENCY_ENUM } from '@celo/utils'
import { PaymentMethod } from 'src/fiatExchanges/FiatExchangeOptions'
import { CicoService } from 'src/fiatExchanges/services/CicoService.abstract'
import networkConfig from 'src/geth/networkConfig'

export class MoonpayService extends CicoService {
  static getInstance() {
    if (!this.instance) {
      this.instance = new MoonpayService()
    }
    return this.instance
  }

  private static instance: MoonpayService

  private apiKey: string
  private baseUrl: string

  constructor() {
    super()

    this.apiKey = networkConfig.moonpayApiKey
    this.baseUrl = networkConfig.moonpayApiUrl
  }

  getFeesPolicy(paymentMethod: PaymentMethod) {
    // From: https://support.moonpay.com/hc/en-gb/articles/360011931517-How-much-does-it-cost-to-buy-cryptocurrency-with-MoonPay-
    if (paymentMethod === PaymentMethod.Card) {
      return {
        percentage: 4.5,
        minimum: 3.99,
        extraNetwork: true,
      }
    }
    if (paymentMethod === PaymentMethod.Bank) {
      return {
        percentage: 1,
        minimum: 3.99,
        extraNetwork: true,
      }
    }
  }

  getFees(
    cryptoAsset: CURRENCY_ENUM,
    fiatAsset: string,
    requestedFiatAmount: number,
    paymentMethod: PaymentMethod
  ) {
    const cryptoAssetName = this.currencyEnumToCurrency(cryptoAsset)
    return this.get(`/currencies/${cryptoAssetName.toLowerCase()}/buy_quote`, {
      baseCurrencyCode: fiatAsset.toLowerCase(),
      baseCurrencyAmount: requestedFiatAmount,
      paymentMethod:
        paymentMethod === PaymentMethod.Bank ? 'sepa_bank_transfer' : 'credit_debit_card',
    })
      .then((response) => response.json())
      .then(({ feeAmount: fee = null }) => ({ fee }))
  }

  private get(path: string, body: { [key: string]: string | number }) {
    const params = Object.entries({ ...body, apiKey: this.apiKey })
      .map(([key, value]) => encodeURI(`${key}=${value}`))
      .join('&')
    return fetch(`${this.baseUrl}${path}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}

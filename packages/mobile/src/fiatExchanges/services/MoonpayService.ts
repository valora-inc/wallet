import networkConfig from 'src/geth/networkConfig'
import { CicoService } from 'src/fiatExchanges/services/CicoService.abstract'

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

  getFees(cryptoAsset: string, fiatAsset: string, requestedFiatAmount: number) {
    return this.get(`/currencies/${cryptoAsset.toLowerCase()}/buy_quote`, {
      baseCurrencyCode: fiatAsset.toLowerCase(),
      baseCurrencyAmount: requestedFiatAmount,
      paymentMethod: 'credit_debit_card',
    })
      .then((response) => response.json())
      .then(({ feeAmount: fee }) => ({ fee }))
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

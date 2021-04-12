import networkConfig from 'src/geth/networkConfig'
import { PaymentMethod } from 'src/fiatExchanges/FiatExchangeOptions'
import { CicoService } from 'src/fiatExchanges/services/CicoService.abstract'

export class TransakService extends CicoService {
  static getInstance() {
    if (!this.instance) {
      this.instance = new TransakService()
    }
    return this.instance
  }

  private static instance: TransakService

  private baseUrl: string

  constructor() {
    super()

    this.baseUrl = networkConfig.transakApiUrl
  }

  getFeesPolicy(paymentMethod: PaymentMethod) {
    // From: https://www.notion.so/On-ramp-Buy-Crypto-976ee96fc0764628ba990b550b1310d3
    if (paymentMethod === PaymentMethod.CARD) {
      return {
        percentage: 3.9,
        extraPercentage: 0.3,
        minimum: 5,
      }
    }
    if (paymentMethod === PaymentMethod.BANK) {
      return {
        percentage: [0.25, 0.5],
      }
    }
  }

  getFees(cryptoAsset: string, fiatAsset: string, requestedFiatAmount: number) {
    return this.get('/currencies/price', {
      fiatCurrency: fiatAsset,
      cryptoCurrency: cryptoAsset,
      isBuyOrSell: 'BUY',
      fiatAmount: requestedFiatAmount,
    })
      .then((response) => response.json())
      .then(({ response: { totalFee: fee } }) => ({ fee }))
  }

  private get(path: string, body: { [key: string]: string | number }) {
    const params = Object.entries(body)
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

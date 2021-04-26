import { CURRENCY_ENUM } from '@celo/utils'
import { PaymentMethod } from 'src/fiatExchanges/FiatExchangeOptions'
import { CicoService, RequestBody } from 'src/fiatExchanges/services/CicoService.abstract'
import networkConfig from 'src/geth/networkConfig'

export class XanpoolService extends CicoService {
  static getInstance() {
    if (!this.instance) {
      this.instance = new XanpoolService()
    }
    return this.instance
  }

  private static instance: XanpoolService

  private baseUrl: string

  constructor() {
    super()

    this.baseUrl = networkConfig.xanpoolApiUrl
  }

  getFeesPolicy(paymentMethod: PaymentMethod) {
    // No global fees policy
    return undefined
  }

  getFees(
    cryptoAsset: CURRENCY_ENUM,
    fiatAsset: string,
    requestedFiatAmount: number,
    paymentMethod: PaymentMethod
  ) {
    return this.post('/api/transactions/estimate', {
      type: 'buy',
      cryptoCurrency: this.currencyEnumToCurrency(cryptoAsset),
      currency: fiatAsset,
      method: 'paynow',
      fiat: requestedFiatAmount,
    })
      .then((response) => response.json())
      .then(({ serviceCharge, cryptoPrice }) => ({ fee: serviceCharge * cryptoPrice }))
    // .then((response) => response.json())
    // .then(({ response: { totalFee: fee } }) => ({ fee }))
  }

  private post(path: string, body: { [key: string]: any }) {
    return fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  }
}

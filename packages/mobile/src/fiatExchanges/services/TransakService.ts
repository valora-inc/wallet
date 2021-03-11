import networkConfig from 'src/geth/networkConfig'
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
    console.log(111111, `${this.baseUrl}${path}?${params}`)
    return fetch(`${this.baseUrl}${path}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}

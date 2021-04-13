import { PaymentMethod } from 'src/fiatExchanges/FiatExchangeOptions'

type Range = number[]

export interface RequestBody {
  [key: string]: string | number
}

export interface CicoServiceFeesPolicy {
  percentage?: Range | number
  extraPercentage?: number
  minimum?: number
  extraNetwork?: boolean
}

export abstract class CicoService {
  abstract getFees(
    cryptoAsset: string,
    fiatAsset: string,
    requestedFiatAmount: number,
    paymentMethod: PaymentMethod
  ): Promise<{ fee: number }>

  abstract getFeesPolicy?(paymentMethod: PaymentMethod): CicoServiceFeesPolicy | undefined

  protected bodyToParams(body: RequestBody) {
    return Object.entries(body)
      .map(([key, value]) => encodeURI(`${key}=${value}`))
      .join('&')
  }
}

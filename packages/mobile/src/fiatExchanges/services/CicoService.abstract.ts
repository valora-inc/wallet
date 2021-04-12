import { PaymentMethod } from 'src/fiatExchanges/FiatExchangeOptions'

type Range = number[]

export interface CicoServiceFeesPolicy {
  percentage?: Range | number
  extraPercentage?: number
  minimum?: number
}

export abstract class CicoService {
  abstract getFees(
    cryptoAsset: string,
    fiatAsset: string,
    requestedFiatAmount: number
  ): Promise<{ fee: number }>

  abstract getFeesPolicy?(paymentMethod: PaymentMethod): CicoServiceFeesPolicy | undefined
}

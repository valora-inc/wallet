import { PaymentMethod } from 'src/fiatExchanges/FiatExchangeOptions'
import { CURRENCY_ENUM } from '@celo/utils'

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
    cryptoAsset: CURRENCY_ENUM,
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

  protected currencyEnumToCurrency(currency: CURRENCY_ENUM): string {
    return (
      {
        [CURRENCY_ENUM.DOLLAR]: 'CUSD',
        [CURRENCY_ENUM.GOLD]: 'CELO',
      }[currency] || currency
    )
  }
}

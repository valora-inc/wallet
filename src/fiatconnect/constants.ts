import { FiatAccountSchema } from '@fiatconnect/fiatconnect-types'
import { LocalCurrencyCode } from 'src/localCurrency/consts'

export const CURRENCIES_WITH_FEE_DISCLAIMER: Partial<
  Record<FiatAccountSchema, Set<LocalCurrencyCode>>
> = {
  [FiatAccountSchema.AccountNumber]: new Set([
    LocalCurrencyCode.NGN,
    LocalCurrencyCode.PHP,
    LocalCurrencyCode.INR,
    LocalCurrencyCode.GHS,
    LocalCurrencyCode.KES,
  ]),
  [FiatAccountSchema.MobileMoney]: new Set([
    LocalCurrencyCode.UGX,
    LocalCurrencyCode.TZS,
    LocalCurrencyCode.ZMW,
    LocalCurrencyCode.XOF,
    LocalCurrencyCode.SLL,
    LocalCurrencyCode.GNF,
    LocalCurrencyCode.GMD,
    LocalCurrencyCode.GHS,
    LocalCurrencyCode.KES,
  ]),
}

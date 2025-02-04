import { CryptoType, FiatType } from '@fiatconnect/fiatconnect-types'
import { LocalCurrencyCode } from 'src/localCurrency/consts'

export const FIATCONNECT_CURRENCY_TO_WALLET_CURRENCY: Record<FiatType, LocalCurrencyCode> = {
  [FiatType.ARS]: LocalCurrencyCode.ARS,
  [FiatType.BOB]: LocalCurrencyCode.BOB,
  [FiatType.BRL]: LocalCurrencyCode.BRL,
  [FiatType.CLP]: LocalCurrencyCode.CLP,
  [FiatType.CNY]: LocalCurrencyCode.CNY,
  [FiatType.COP]: LocalCurrencyCode.COP,
  [FiatType.EUR]: LocalCurrencyCode.EUR,
  [FiatType.FKP]: LocalCurrencyCode.FKP,
  [FiatType.GBP]: LocalCurrencyCode.GBP,
  [FiatType.GHS]: LocalCurrencyCode.GHS,
  [FiatType.GNF]: LocalCurrencyCode.GNF,
  [FiatType.GYD]: LocalCurrencyCode.GYD,
  [FiatType.INR]: LocalCurrencyCode.INR,
  [FiatType.KES]: LocalCurrencyCode.KES,
  [FiatType.MXN]: LocalCurrencyCode.MXN,
  [FiatType.NGN]: LocalCurrencyCode.NGN,
  [FiatType.PAB]: LocalCurrencyCode.PAB,
  [FiatType.PEN]: LocalCurrencyCode.PEN,
  [FiatType.PHP]: LocalCurrencyCode.PHP,
  [FiatType.PYG]: LocalCurrencyCode.PYG,
  [FiatType.RWF]: LocalCurrencyCode.RWF,
  [FiatType.SRD]: LocalCurrencyCode.SRD,
  [FiatType.UGX]: LocalCurrencyCode.UGX,
  [FiatType.USD]: LocalCurrencyCode.USD,
  [FiatType.UYU]: LocalCurrencyCode.UYU,
  [FiatType.VES]: LocalCurrencyCode.VES,
  [FiatType.XAF]: LocalCurrencyCode.XAF,
  [FiatType.XOF]: LocalCurrencyCode.XOF,
  [FiatType.ZAR]: LocalCurrencyCode.ZAR,
}

export const WALLET_CRYPTO_TO_FIATCONNECT_CRYPTO: Record<string, CryptoType | undefined> = {
  CELO: CryptoType.CELO,
  cEUR: CryptoType.cEUR,
  cUSD: CryptoType.cUSD,
  cREAL: CryptoType.cREAL,
}

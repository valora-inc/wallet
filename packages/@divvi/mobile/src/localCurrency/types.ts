import { LocalCurrencyCode } from 'src/localCurrency/consts'

export interface CurrencyInfo {
  localCurrencyCode: LocalCurrencyCode
  localExchangeRate: string | null
}

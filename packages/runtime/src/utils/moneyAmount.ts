import BigNumber from 'bignumber.js'

export interface LocalMoneyAmount {
  value: BigNumber.Value
  currencyCode: string
  exchangeRate: BigNumber.Value
}

/**
 * @deprecated Use TokenAmount instead
 */
export interface MoneyAmount {
  value: BigNumber.Value
  currencyCode: string
  localAmount?: LocalMoneyAmount | null
}

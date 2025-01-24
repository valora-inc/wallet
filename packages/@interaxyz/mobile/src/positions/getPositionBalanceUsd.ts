import BigNumber from 'bignumber.js'
import { Position } from 'src/positions/types'

export function getPositionBalanceUsd(position: Position): BigNumber {
  let balanceUsd
  if (position.type === 'app-token') {
    const balance = new BigNumber(position.balance)
    balanceUsd = balance.multipliedBy(position.priceUsd)
  } else {
    balanceUsd = new BigNumber(position.balanceUsd)
  }

  return balanceUsd
}

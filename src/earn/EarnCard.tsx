import BigNumber from 'bignumber.js'
import React, { useMemo } from 'react'
import EarnActivePools from 'src/earn/EarnActivePools'
import EarnEntrypoint from 'src/earn/EarnEntrypoint'
import { earnPositionsSelector } from 'src/positions/selectors'
import { useSelector } from 'src/redux/hooks'

export function EarnCardDiscover() {
  const pools = useSelector(earnPositionsSelector)
  const poolsSupplied = useMemo(
    () => pools.filter((pool) => new BigNumber(pool.balance).gt(0)).length,
    [pools]
  )

  return poolsSupplied > 0 ? <EarnActivePools /> : <EarnEntrypoint />
}

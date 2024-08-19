import BigNumber from 'bignumber.js'
import React, { useMemo } from 'react'
import { View } from 'react-native'
import ItemSeparator from 'src/components/ItemSeparator'
import EarnActivePool from 'src/earn/EarnActivePool'
import EarnActivePools from 'src/earn/EarnActivePools'
import EarnCta from 'src/earn/EarnCta'
import EarnEntrypoint from 'src/earn/EarnEntrypoint'
import { earnPositionsSelector } from 'src/positions/selectors'
import { useSelector } from 'src/redux/hooks'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { Spacing } from 'src/styles/styles'
import { useTokenInfo } from 'src/tokens/hooks'

interface Props {
  depositTokenId: string
  poolTokenId: string
}

export function EarnCardDiscover({ depositTokenId, poolTokenId }: Props) {
  const showMultiplePools = getFeatureGate(StatsigFeatureGates.SHOW_MULTIPLE_EARN_POOLS)
  const poolToken = useTokenInfo(poolTokenId)

  const pools = useSelector(earnPositionsSelector)
  const poolsSupplied = useMemo(
    () => pools.filter((pool) => new BigNumber(pool.balance).gt(0)).length,
    [pools]
  )

  if (showMultiplePools) {
    return poolsSupplied > 0 ? <EarnActivePools /> : <EarnEntrypoint />
  }

  const showStablecoinEarn = getFeatureGate(StatsigFeatureGates.SHOW_STABLECOIN_EARN)

  if (showStablecoinEarn) {
    return poolToken && poolToken.balance.gt(0) ? (
      <EarnActivePool
        cta="ExitAndDeposit"
        depositTokenId={depositTokenId}
        poolTokenId={poolTokenId}
      />
    ) : (
      <EarnCta depositTokenId={depositTokenId} />
    )
  }
  return null
}

export function EarnCardTokenDetails({ depositTokenId, poolTokenId }: Props) {
  const showStablecoinEarn = getFeatureGate(StatsigFeatureGates.SHOW_STABLECOIN_EARN)
  const poolToken = useTokenInfo(poolTokenId)

  return showStablecoinEarn && poolToken && poolToken.balance.gt(0) ? (
    <>
      <ItemSeparator />
      <View style={{ margin: Spacing.Regular16 }}>
        <EarnActivePool cta="ViewPools" depositTokenId={depositTokenId} poolTokenId={poolTokenId} />
      </View>
    </>
  ) : null
}

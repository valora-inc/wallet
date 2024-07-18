import React from 'react'
import { View } from 'react-native'
import ItemSeparator from 'src/components/ItemSeparator'
import EarnActivePool from 'src/earn/EarnActivePool'
import EarnActivePools from 'src/earn/EarnActivePools'
import EarnCta from 'src/earn/EarnCta'
import EarnEntrypoint from 'src/earn/EarnEntrypoint'
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

  if (showMultiplePools) {
    // For now directly using the poolTokenId, which is hardcoded to AAVE arb USDC.
    // TODO(ACT-1268): use info from getEarnPositions to see if the user is part
    // of any pools.
    return poolToken && poolToken.balance.gt(0) ? <EarnActivePools /> : <EarnEntrypoint />
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

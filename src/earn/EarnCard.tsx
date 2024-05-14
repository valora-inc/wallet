import React from 'react'
import { View } from 'react-native'
import ItemSeparator from 'src/components/ItemSeparator'
import EarnActivePool from 'src/earn/EarnActivePool'
import EarnCta from 'src/earn/EarnCta'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { Spacing } from 'src/styles/styles'
import { useTokenInfo } from 'src/tokens/hooks'

interface Props {
  depositTokenId: string
  poolTokenId: string
}

export function EarnCardDiscover({ depositTokenId, poolTokenId }: Props) {
  const showStablecoinEarn = getFeatureGate(StatsigFeatureGates.SHOW_STABLECOIN_EARN)
  const poolToken = useTokenInfo(poolTokenId)

  if (showStablecoinEarn) {
    return poolToken && poolToken.balance.gt(0) ? (
      <EarnActivePool
        cta="ExitAndDeposit"
        depositTokenId={depositTokenId}
        poolTokenId={poolTokenId}
      />
    ) : (
      <EarnCta />
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

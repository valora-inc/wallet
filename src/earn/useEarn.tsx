import React from 'react'
import EarnActivePool from 'src/earn/EarnActivePool'
import EarnCta from 'src/earn/EarnCta'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { useTokenInfo } from 'src/tokens/hooks'
import networkConfig from 'src/web3/networkConfig'

const useEarn = () => {
  const Earn = () => {
    const showStablecoinEarn = getFeatureGate(StatsigFeatureGates.SHOW_STABLECOIN_EARN)
    const poolToken = useTokenInfo(networkConfig.aaveArbUsdcTokenId)
    if (showStablecoinEarn) {
      return poolToken && poolToken.balance.gt(0) ? <EarnActivePool /> : <EarnCta />
    }
    return null
  }

  return { Earn }
}

export default useEarn

import { useMemo } from 'react'
import { useAsync } from 'react-async-hook'
import { prepareWithdrawAndClaimTransactions } from 'src/earn/prepareTransactions'
import { PrepareWithdrawAndClaimParams } from 'src/earn/types'
import { fetchExchanges } from 'src/fiatExchanges/utils'
import { isAppSwapsEnabledSelector } from 'src/navigator/selectors'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import { earnPositionsSelector } from 'src/positions/selectors'
import { EarnPosition } from 'src/positions/types'
import { useSelector } from 'src/redux/hooks'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { useCashInTokens, useSwappableTokens } from 'src/tokens/hooks'
import { TokenBalances } from 'src/tokens/slice'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import networkConfig from 'src/web3/networkConfig'

const TAG = 'earn/hooks'

export function usePrepareWithdrawAndClaimTransactions(params: PrepareWithdrawAndClaimParams) {
  return useAsync(() => prepareWithdrawAndClaimTransactions(params), [], {
    onError: (err) => {
      const error = ensureError(err)
      Logger.error(TAG, 'usePrepareWithdrawAndClaimTransactions', error)
    },
  })
}

export function useEarnPositionProviderName(providerId: string) {
  const pools = useSelector(earnPositionsSelector)
  const providerName = pools.find((pool) => pool.appId === providerId)?.appName
  if (!providerName) {
    Logger.warn(TAG, 'providerName not found', providerId)
  }
  return providerName
}

// Helper hook to get position given a positionId. Defaults to the aave position
// while we're in the interim period of building the multiple pool flow
export function useEarnPosition(positionId: string = networkConfig.aaveArbUsdcTokenId) {
  const pools = useSelector(earnPositionsSelector)
  return useMemo(() => {
    const pool = pools.find((pool) => pool.positionId === positionId)
    if (!pool) {
      Logger.warn(TAG, 'pool not found', positionId)
    }
    return pool
  }, [pools, positionId])
}

export function useDepositEntrypointInfo({
  allTokens,
  pool,
}: {
  allTokens: TokenBalances
  pool: EarnPosition
}) {
  const { networkId, dataProps } = pool

  const { swappableFromTokens } = useSwappableTokens()
  const cashInTokens = useCashInTokens()
  const isSwapEnabled = useSelector(isAppSwapsEnabledSelector)
  const userLocation = useSelector(userLocationDataSelector)

  const canDeposit = useMemo(() => {
    return allTokens[dataProps.depositTokenId]?.balance?.gt(0) ?? false
  }, [pool, allTokens])
  const canSameChainSwapToDeposit = useMemo(() => {
    return (
      isSwapEnabled &&
      !!swappableFromTokens.find(
        (tokenInfo) =>
          tokenInfo.networkId === networkId && tokenInfo.tokenId !== dataProps.depositTokenId
      )
    )
  }, [pool, isSwapEnabled, swappableFromTokens])
  const canCrossChainSwap = useMemo(() => {
    return (
      getFeatureGate(StatsigFeatureGates.ALLOW_CROSS_CHAIN_SWAPS) &&
      isSwapEnabled &&
      !!swappableFromTokens.find((tokenInfo) => tokenInfo.networkId !== networkId)
    )
  }, [pool, isSwapEnabled, swappableFromTokens])
  const canCashIn = useMemo(() => {
    return !!cashInTokens.find((tokenInfo) => tokenInfo.tokenId === dataProps.depositTokenId)
  }, [pool, cashInTokens])

  const asyncExchanges = useAsync(async () => {
    try {
      const availableExchanges = await fetchExchanges(
        userLocation.countryCodeAlpha2,
        dataProps.depositTokenId
      )

      return availableExchanges
    } catch (error) {
      return []
    }
  }, [])
  const exchanges = asyncExchanges.result ?? []
  return { canDeposit, canSameChainSwapToDeposit, canCrossChainSwap, canCashIn, exchanges }
}

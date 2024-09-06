import { useMemo } from 'react'
import { useAsync } from 'react-async-hook'
import { prepareWithdrawAndClaimTransactions } from 'src/earn/prepareTransactions'
import { PrepareWithdrawAndClaimParams } from 'src/earn/types'
import { earnPositionsSelector } from 'src/positions/selectors'
import { useSelector } from 'src/redux/hooks'
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

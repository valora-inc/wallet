import { useMemo } from 'react'
import { useAsync } from 'react-async-hook'
import { prepareWithdrawAndClaimTransactions } from 'src/earn/prepareTransactions'
import { earnPositionsSelector } from 'src/positions/selectors'
import { Token } from 'src/positions/types'
import { useSelector } from 'src/redux/hooks'
import { useTokenInfo } from 'src/tokens/hooks'
import { TokenBalance } from 'src/tokens/slice'
import Logger from 'src/utils/Logger'
import networkConfig from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'
import { isAddress } from 'viem'

const TAG = 'earn/hooks'

export function useAaveRewardsInfoAndPrepareTransactions({
  poolTokenId,
  depositTokenId,
  feeCurrencies,
  rewardsTokens,
}: {
  poolTokenId: string
  depositTokenId: string
  feeCurrencies: TokenBalance[]
  rewardsTokens: Token[]
}) {
  const poolTokenInfo = useTokenInfo(poolTokenId)
  const depositTokenInfo = useTokenInfo(depositTokenId)
  const walletAddress = useSelector(walletAddressSelector)

  const asyncPreparedTransactions = useAsync(
    async () => {
      if (
        !walletAddress ||
        !isAddress(walletAddress) ||
        !poolTokenInfo?.address ||
        !isAddress(poolTokenInfo.address) ||
        !depositTokenInfo
      ) {
        // should never happen
        throw new Error('Invalid wallet or pool token address')
      }

      return prepareWithdrawAndClaimTransactions({
        amount: poolTokenInfo.balance.toString(),
        token: depositTokenInfo,
        walletAddress,
        feeCurrencies,
        rewardsTokens,
        poolTokenAddress: poolTokenInfo.address,
      })
    },
    [],
    {
      onError: (error) => {
        Logger.warn(`${TAG}/useAaveRewardsInfoAndPrepareTransactions`, error)
      },
    }
  )
  return { asyncPreparedTransactions }
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

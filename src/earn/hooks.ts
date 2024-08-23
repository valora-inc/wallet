import { useAsync } from 'react-async-hook'
import { fetchAaveRewards } from 'src/earn/poolInfo'
import { prepareWithdrawAndClaimTransactions } from 'src/earn/prepareTransactions'
import { earnPositionsSelector } from 'src/positions/selectors'
import { useSelector } from 'src/redux/hooks'
import { useTokenInfo, useTokensList } from 'src/tokens/hooks'
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
}: {
  poolTokenId: string
  depositTokenId: string
  feeCurrencies: TokenBalance[]
}) {
  const poolTokenInfo = useTokenInfo(poolTokenId)
  const depositTokenInfo = useTokenInfo(depositTokenId)
  const walletAddress = useSelector(walletAddressSelector)
  const allTokens = useTokensList()

  const asyncRewardsInfo = useAsync(
    async () => {
      if (!poolTokenInfo) {
        throw new Error(`Token with id ${poolTokenId} not found`)
      }

      if (!poolTokenInfo.address || !isAddress(poolTokenInfo.address)) {
        throw new Error(`Token with id ${poolTokenId} does not contain a valid address`)
      }

      if (!walletAddress || !isAddress(walletAddress)) {
        throw new Error(`Invalid wallet address: ${walletAddress}`)
      }

      return fetchAaveRewards({
        walletAddress,
        assetAddress: poolTokenInfo.address,
        contractAddress: networkConfig.arbAaveIncentivesV3ContractAddress,
        networkId: poolTokenInfo.networkId,
        allTokens,
      })
    },
    [],
    {
      onError: (error) => {
        Logger.warn(`${TAG}/useAaveRewardsInfoAndPrepareTransactions`, error)
      },
    }
  )

  const asyncPreparedTransactions = useAsync(
    async () => {
      if (!asyncRewardsInfo.result) {
        return
      }

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
        rewards: asyncRewardsInfo.result,
        poolTokenAddress: poolTokenInfo.address,
      })
    },
    [asyncRewardsInfo.result],
    {
      onError: (error) => {
        Logger.warn(`${TAG}/useAaveRewardsInfoAndPrepareTransactions`, error)
      },
    }
  )
  return { asyncRewardsInfo, asyncPreparedTransactions }
}

export function useEarnPosition(providerId: string) {
  const pools = useSelector(earnPositionsSelector)
  const providerName = pools.find((pool) => pool.appId === providerId)?.appName
  if (!providerName) {
    Logger.warn(TAG, 'providerName not found', providerId)
  }
  return providerName
}

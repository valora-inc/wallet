import { useAsync } from 'react-async-hook'
import { fetchAavePoolInfo, fetchAaveRewards } from 'src/earn/poolInfo'
import { useSelector } from 'src/redux/hooks'
import { useTokenInfo, useTokensList } from 'src/tokens/hooks'
import Logger from 'src/utils/Logger'
import networkConfig, { networkIdToNetwork } from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'
import { isAddress } from 'viem'

const TAG = 'earn/hooks'

export function useAavePoolInfo({ depositTokenId }: { depositTokenId: string }) {
  const depositToken = useTokenInfo(depositTokenId)
  const asyncPoolInfo = useAsync(
    async () => {
      if (!depositToken || !depositToken.address) {
        throw new Error(`Token with id ${depositTokenId} not found`)
      }

      if (!isAddress(depositToken.address)) {
        throw new Error(`Token with id ${depositTokenId} does not contain a valid address`)
      }

      return fetchAavePoolInfo({
        assetAddress: depositToken.address,
        contractAddress: networkConfig.arbAavePoolV3ContractAddress,
        network: networkIdToNetwork[depositToken.networkId],
      })
    },
    [],
    {
      onError: (error) => {
        Logger.warn(`${TAG}/useAavePoolInfo`, error.message)
      },
    }
  )

  return asyncPoolInfo
}

export function useAaveRewardsInfo({ poolTokenId }: { poolTokenId: string }) {
  const poolTokenInfo = useTokenInfo(poolTokenId)
  const walletAddress = useSelector(walletAddressSelector)
  const allTokens = useTokensList()

  return useAsync(
    async () => {
      if (!poolTokenInfo || !poolTokenInfo.address) {
        throw new Error(`Token with id ${networkConfig.aaveArbUsdcTokenId} not found`)
      }

      if (!isAddress(poolTokenInfo.address)) {
        throw new Error(
          `Token with id ${networkConfig.arbUsdcTokenId} does not contain a valid address`
        )
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
        Logger.warn(`${TAG}/useAaveRewardsInfo`, error.message)
      },
    }
  )
}

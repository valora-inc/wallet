import { useAsync } from 'react-async-hook'
import { fetchAavePoolInfo, fetchAaveRewards } from 'src/earn/aaveInfo'
import { useSelector } from 'src/redux/hooks'
import { useTokenInfo, useTokensList } from 'src/tokens/hooks'
import networkConfig, { networkIdToNetwork } from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'
import { isAddress } from 'viem'

export function useAaveCollectInfo() {
  const arbUsdcTokenInfo = useTokenInfo(networkConfig.arbUsdcTokenId)
  const aaveArbUsdcTokenInfo = useTokenInfo(networkConfig.aaveArbUsdcTokenId)
  const allTokens = useTokensList()
  const walletAddress = useSelector(walletAddressSelector)

  return useAsync(async () => {
    if (
      !arbUsdcTokenInfo ||
      !aaveArbUsdcTokenInfo ||
      !arbUsdcTokenInfo.address ||
      !aaveArbUsdcTokenInfo.address
    ) {
      throw new Error('Token info not found')
    }

    if (!isAddress(arbUsdcTokenInfo.address)) {
      throw new Error(`Token with id ${arbUsdcTokenInfo} does not contain a valid address`)
    }
    if (!isAddress(aaveArbUsdcTokenInfo.address)) {
      throw new Error(`Token with id ${aaveArbUsdcTokenInfo} does not contain a valid address`)
    }

    if (!walletAddress) {
      throw new Error('Wallet address not found')
    }
    const [aaveRewardsInfo, aavePoolInfo] = await Promise.all([
      fetchAaveRewards({
        walletAddress,
        assetAddress: aaveArbUsdcTokenInfo.address,
        contractAddress: networkConfig.arbAaveRewardsControllerV3ContractAddress,
        networkId: arbUsdcTokenInfo.networkId,
        allTokens,
      }),
      fetchAavePoolInfo({
        assetAddress: arbUsdcTokenInfo.address,
        contractAddress: networkConfig.arbAavePoolV3ContractAddress,
        network: networkIdToNetwork[arbUsdcTokenInfo.networkId],
      }),
    ])

    return {
      tokenInfo: arbUsdcTokenInfo,
      poolTokenInfo: aaveArbUsdcTokenInfo,
      poolApy: (aavePoolInfo.apy * 100).toFixed(2),
      rewardsInfo: aaveRewardsInfo,
    }
  }, [])
}

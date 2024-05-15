import BigNumber from 'bignumber.js'
import AavePool from 'src/abis/AavePoolV3'
import { TokenBalance } from 'src/tokens/slice'
import { Network, NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import { publicClient } from 'src/viem'
import { networkIdToNetwork } from 'src/web3/networkConfig'
import { Address } from 'viem'
const RewardsController = require('@aave/periphery-v3/artifacts/contracts/rewards/RewardsController.sol/RewardsController.json')

const TAG = 'earn/poolInfo'

const COMPOUND_PERIOD = 365 * 24 * 60 * 60 // 1 year in seconds

export async function fetchAavePoolInfo({
  assetAddress,
  contractAddress,
  network,
}: {
  assetAddress: Address
  contractAddress: Address
  network: Network
}) {
  try {
    Logger.debug(TAG, 'Fetching Aave pool info for asset', {
      assetAddress,
      contractAddress,
      network,
    })
    const result = await publicClient[network].readContract({
      abi: AavePool,
      address: contractAddress,
      functionName: 'getReserveData',
      args: [assetAddress],
    })

    // The chain data is in RAY units (1e27) and non compounded
    // https://docs.aave.com/developers/guides/rates-guide#formatting-rates
    const apr = new BigNumber(result.currentLiquidityRate.toString()).div(1e27).toNumber()
    const apy = (1 + apr / COMPOUND_PERIOD) ** COMPOUND_PERIOD - 1
    return { apy }
  } catch (error) {
    const err = ensureError(error)
    Logger.error(TAG, 'Failed to fetch Aave pool info', err)
    throw err
  }
}

export async function fetchAaveRewards({
  walletAddress,
  assetAddress,
  contractAddress,
  networkId,
  allTokens,
}: {
  walletAddress: string
  assetAddress: Address
  contractAddress: Address
  networkId: NetworkId
  allTokens: TokenBalance[]
}) {
  try {
    const network = networkIdToNetwork[networkId]
    Logger.debug(TAG, 'Fetching Aave reward info', {
      assetAddress,
      contractAddress,
      network,
    })
    const result = (await publicClient[network].readContract({
      abi: RewardsController.abi,
      address: contractAddress,
      functionName: 'getAllUserRewards',
      args: [[assetAddress], walletAddress],
    })) as [Address[], string[]]
    const rewards: { amount: BigNumber; tokenInfo: TokenBalance }[] = []
    result[0].forEach((rewardAddress, index) => {
      const tokenId = `${networkId}:${rewardAddress.toLowerCase()}`
      const tokenInfo = allTokens.find((token) => token.tokenId === tokenId)
      if (!tokenInfo) {
        Logger.warn(TAG, `Token info not found for rewards ${tokenId}`)
      } else {
        rewards.push({
          amount: new BigNumber(result[1][index]).div(1e18),
          tokenInfo,
        })
      }
    })
    return rewards
  } catch (error) {
    const err = ensureError(error)
    Logger.error(TAG, 'Failed to fetch Aave rewards info', err)
    throw err
  }
}

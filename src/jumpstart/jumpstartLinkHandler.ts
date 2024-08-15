import walletJumpstart from 'src/abis/IWalletJumpstart'
import { NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import { publicClient } from 'src/viem'
import networkConfig, { networkIdToNetwork } from 'src/web3/networkConfig'
import { Address, Hash, Hex, encodePacked, keccak256 } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const TAG = 'WalletJumpstart'

export async function jumpstartLinkHandler(
  networkId: NetworkId,
  contractAddress: Address,
  privateKey: Hex,
  userAddress: Address
): Promise<Hash[]> {
  const results = await Promise.all([
    executeClaims(contractAddress, userAddress, 'erc20', privateKey, networkId),
    executeClaims(contractAddress, userAddress, 'erc721', privateKey, networkId),
  ])

  const transactionHashes = results.flatMap((result) => result.transactionHashes)
  const hasClaimedAssets = results.some((result) => result.hasClaimedAssets)

  if (transactionHashes.length === 0) {
    if (hasClaimedAssets) {
      throw new Error(`Already claimed all jumpstart rewards for ${networkId}`)
    }
    throw new Error(`Failed to claim any jumpstart reward for ${networkId}`)
  }

  return transactionHashes
}

async function executeClaims(
  contractAddress: Address,
  userAddress: Address,
  assetType: 'erc20' | 'erc721',
  privateKey: Hex,
  networkId: NetworkId
): Promise<{ transactionHashes: Hash[]; hasClaimedAssets: boolean }> {
  const client = publicClient[networkIdToNetwork[networkId]]
  const account = privateKeyToAccount(privateKey)
  const beneficiary = account.address

  let index = 0
  const transactionHashes: Hash[] = []
  let hasClaimedAssets = false
  while (true) {
    try {
      const [_token, _depositor, _amount, claimed] = await client.readContract({
        address: contractAddress,
        abi: walletJumpstart.abi,
        functionName: assetType === 'erc20' ? 'erc20Claims' : 'erc721Claims',
        args: [beneficiary, BigInt(index)],
      })

      if (claimed) {
        hasClaimedAssets = true
        continue
      }

      const signature = await account.signMessage({
        message: {
          raw: keccak256(
            encodePacked(
              ['address', 'address', 'uint256'],
              [beneficiary, userAddress, BigInt(index)]
            )
          ),
        },
      })

      const response = await claimReward({
        index: index.toString(),
        beneficiary,
        signature,
        sendTo: userAddress,
        assetType,
        networkId,
      })

      const transactionHash = response?.result?.transactionHash

      if (transactionHash) {
        transactionHashes.push(transactionHash)
      }
    } catch (error: any) {
      if (error.message.includes('Execution reverted for an unknown reason')) {
        // we cycle through indexes to claim all claimable assets. the
        // readContract call will throw an error when we reach the end of the
        // list and the index does not have a matching claimable asset.
        Logger.debug(
          `${TAG}@executeClaims`,
          `Expected "execution reverted" error while claiming jumpstart rewards at index ${index}`,
          error
        )
      } else {
        Logger.error(TAG, 'Error claiming jumpstart reward', error)
      }
      return { transactionHashes, hasClaimedAssets }
    } finally {
      index++
    }
  }
}

interface RewardInfo {
  index: string
  beneficiary: string
  signature: string
  sendTo: string
  assetType: 'erc20' | 'erc721'
  networkId: NetworkId
}

async function claimReward(rewardInfo: RewardInfo) {
  const queryParams = new URLSearchParams({ ...rewardInfo }).toString()
  const requestUrl = `${networkConfig.walletJumpstartUrl}?${queryParams}`
  const response = await fetchWithTimeout(requestUrl, { method: 'POST' }, 60_000)
  if (!response.ok) {
    throw new Error(
      `Failure response claiming wallet jumpstart reward. ${response.status}  ${response.statusText}`
    )
  }
  return response.json()
}

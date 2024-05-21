import { Contract } from '@celo/connect'
import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import walletJumpstart from 'src/abis/IWalletJumpstart'
import { NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import { getWeb3Async } from 'src/web3/contracts'
import networkConfig from 'src/web3/networkConfig'
import { getContract } from 'src/web3/utils'
import { Hash } from 'viem'

const TAG = 'WalletJumpstart'

export async function jumpstartLinkHandler(
  networkId: NetworkId,
  contractAddress: string,
  privateKey: string,
  userAddress: string
): Promise<Hash[]> {
  if (networkId !== networkConfig.defaultNetworkId) {
    // TODO: make it multichain (RET-1019)
    throw new Error(`Unsupported network id: ${networkId}`)
  }

  const kit = newKitFromWeb3(await getWeb3Async())
  kit.connection.addAccount(privateKey)
  const accounts: string[] = kit.connection.getLocalAccounts()
  const publicKey = accounts[0]

  const jumpstart: Contract = await getContract(walletJumpstart.abi, contractAddress)

  const results = await Promise.all([
    executeClaims(kit, jumpstart, publicKey, userAddress, 'erc20', privateKey, networkId),
    executeClaims(kit, jumpstart, publicKey, userAddress, 'erc721', privateKey, networkId),
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

export async function executeClaims(
  kit: ContractKit,
  jumpstart: Contract,
  beneficiary: string,
  userAddress: string,
  assetType: 'erc20' | 'erc721',
  privateKey: string,
  networkId: NetworkId
): Promise<{ transactionHashes: Hash[]; hasClaimedAssets: boolean }> {
  let index = 0
  const transactionHashes: Hash[] = []
  let hasClaimedAssets = false
  while (true) {
    try {
      const info =
        assetType === 'erc20'
          ? await jumpstart.methods.erc20Claims(beneficiary, index).call()
          : await jumpstart.methods.erc721Claims(beneficiary, index).call()

      if (info.claimed) {
        hasClaimedAssets = true
        continue
      }

      const messageHash = kit.web3.utils.soliditySha3(
        { type: 'address', value: beneficiary },
        { type: 'address', value: userAddress },
        { type: 'uint256', value: index.toString() }
      )

      if (!messageHash) {
        throw new Error('messageHash is null')
      }

      const { signature } = await kit.web3.eth.accounts.sign(messageHash, privateKey)

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
      if (error.message === 'execution reverted') {
        // This happens when using an index that doesn't exist.
        // For example, index 0 if there are no rewards or index 1 if there's only one.
        Logger.debug(
          TAG,
          'Expected "execution reverted" error while claiming jumpstart rewards',
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

export interface RewardInfo {
  index: string
  beneficiary: string
  signature: string
  sendTo: string
  assetType: 'erc20' | 'erc721'
  networkId: NetworkId
}

export async function claimReward(rewardInfo: RewardInfo) {
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

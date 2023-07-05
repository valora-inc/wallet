import { Contract } from '@celo/connect'
import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import jumpstartAbi from 'src/abis/WalletJumpStart.json'
import Logger from 'src/utils/Logger'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import { getWeb3Async } from 'src/web3/contracts'
import networkConfig from 'src/web3/networkConfig'
import { getContract } from 'src/web3/utils'

const TAG = 'WalletJumpstart'

export async function jumpstartLinkHandler(privateKey: string, userAddress: string) {
  const kit = newKitFromWeb3(await getWeb3Async())
  kit.connection.addAccount(privateKey)
  const accounts: string[] = kit.connection.getLocalAccounts()
  const publicKey = accounts[0]

  const jumpstart: Contract = await getContract(jumpstartAbi, networkConfig.walletJumpstartAddress)

  await executeClaims(kit, jumpstart, publicKey, userAddress, 'erc20', privateKey)
  await executeClaims(kit, jumpstart, publicKey, userAddress, 'erc721', privateKey)
}

export async function executeClaims(
  kit: ContractKit,
  jumpstart: Contract,
  beneficiary: string,
  userAddress: string,
  assetType: 'erc20' | 'erc721',
  privateKey: string
) {
  let index = 0
  while (true) {
    try {
      const info =
        assetType === 'erc20'
          ? await jumpstart.methods.erc20Claims(beneficiary, index).call()
          : await jumpstart.methods.erc721Claims(beneficiary, index).call()
      if (info.claimed) {
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

      await claimReward({
        index: index.toString(),
        beneficiary,
        signature,
        sendTo: userAddress,
        assetType,
      })
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
      return
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
}

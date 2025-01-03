import walletJumpstart from 'src/abis/IWalletJumpstart'
import { TAG } from 'src/send/saga'
import { NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { publicClient } from 'src/viem'
import { networkIdToNetwork } from 'src/web3/networkConfig'
import { Address, Hash, parseEventLogs } from 'viem'

export async function fetchClaimStatus(
  jumpstartContractAddress: Address,
  networkId: NetworkId,
  transactionHash: Hash
) {
  const viemClient = publicClient[networkIdToNetwork[networkId]]

  const transactionReceipt = await viemClient.getTransactionReceipt({
    hash: transactionHash,
  })

  const parsedLogs = parseEventLogs({
    abi: walletJumpstart.abi,
    eventName: ['ERC20Deposited'],
    logs: transactionReceipt.logs,
  })

  if (parsedLogs.length != 1) {
    throw new Error('Unexpected number of matching logs')
  }

  const { beneficiary, index } = parsedLogs[0].args

  Logger.debug(TAG, 'Decoded event', { beneficiary, index })

  const erc20Claim = await viemClient.readContract({
    address: jumpstartContractAddress as Address,
    abi: walletJumpstart.abi,
    functionName: 'erc20Claims',
    args: [beneficiary, index],
  })

  const claimed = erc20Claim[3]

  Logger.debug(TAG, `Reward deposited in ${transactionHash} ${claimed ? 'was' : 'was NOT'} claimed`)

  return { beneficiary, index: Number(index), claimed }
}

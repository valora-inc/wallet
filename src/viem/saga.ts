import BigNumber from 'bignumber.js'
import erc20 from 'src/abis/IERC20.json'
import { tokenAmountInSmallestUnit } from 'src/tokens/saga'
import Logger from 'src/utils/Logger'
import { publicClient } from 'src/viem'
import { getViemWallet } from 'src/web3/contracts'
import networkConfig from 'src/web3/networkConfig'
import { call } from 'typed-redux-saga'
import { getAddress } from 'viem'

// example usage
// todo(ACT-786): build on this when implementing viem version of sendAndMonitorTransaction
export function* send(
  recipientAddress: string,
  amount: BigNumber,
  tokenAddress: string,
  comment: string
) {
  const wallet = yield* call(getViemWallet, networkConfig.viemChain.celo)
  Logger.debug('tokenAddress', tokenAddress, getAddress(tokenAddress))
  const convertedAmount: string = yield* call(tokenAmountInSmallestUnit, amount, tokenAddress)
  Logger.debug('convertedAmount', convertedAmount)

  const { request } = yield* call([publicClient.celo, 'simulateContract'], {
    address: getAddress(tokenAddress),
    abi: erc20.abi,
    functionName: 'transfer',
    account: wallet.account,
    args: [recipientAddress, convertedAmount],
  })

  const hash = yield* call([wallet, 'writeContract'], request)

  return hash
}

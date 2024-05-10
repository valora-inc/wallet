import BigNumber from 'bignumber.js'
import aavePool from 'src/abis/AavePoolV3'
import erc20 from 'src/abis/IERC20'
import { TokenBalance } from 'src/tokens/slice'
import { publicClient } from 'src/viem'
import { TransactionRequest, prepareTransactions } from 'src/viem/prepareTransactions'
import { networkIdToNetwork } from 'src/web3/networkConfig'
import { Address, encodeFunctionData, parseUnits } from 'viem'

export async function prepareSupplyTransactions({
  amount,
  token,
  walletAddress,
  feeCurrencies,
  poolContractAddress,
}: {
  amount: string
  token: TokenBalance
  walletAddress: Address
  feeCurrencies: TokenBalance[]
  poolContractAddress: Address
}) {
  const baseTransactions: TransactionRequest[] = []

  // amount in smallest unit
  const amountToSupply = parseUnits(amount, token.decimals)

  if (!token.address) {
    // should never happen
    throw new Error('Cannot use a token without address')
  }

  const approvedAllowanceForSpender = await publicClient[
    networkIdToNetwork[token.networkId]
  ].readContract({
    address: token.address as Address,
    abi: erc20.abi,
    functionName: 'allowance',
    args: [walletAddress, token.address as Address],
  })

  if (approvedAllowanceForSpender < amountToSupply) {
    const data = encodeFunctionData({
      abi: erc20.abi,
      functionName: 'approve',
      args: [poolContractAddress, amountToSupply],
    })

    const approveTx: TransactionRequest = {
      from: walletAddress,
      to: token.address as Address,
      data,
    }
    baseTransactions.push(approveTx)
  }

  const supplyTx: TransactionRequest = {
    from: walletAddress,
    to: poolContractAddress,
    data: encodeFunctionData({
      abi: aavePool,
      functionName: 'supply',
      args: [token.address as Address, amountToSupply, walletAddress, 0],
    }),
  }

  baseTransactions.push(supplyTx)

  return prepareTransactions({
    feeCurrencies,
    baseTransactions,
    spendToken: token,
    spendTokenAmount: new BigNumber(amount),
  })
}

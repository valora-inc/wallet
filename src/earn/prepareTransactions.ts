import BigNumber from 'bignumber.js'
import aavePool from 'src/abis/AavePoolV3'
import erc20 from 'src/abis/IERC20'
import { TokenBalance } from 'src/tokens/slice'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import { publicClient } from 'src/viem'
import { TransactionRequest, prepareTransactions } from 'src/viem/prepareTransactions'
import networkConfig, { networkIdToNetwork } from 'src/web3/networkConfig'
import { Address, encodeFunctionData, isAddress, parseUnits } from 'viem'

type SimulatedTransactionResponse = {
  status: 'OK'
  simulatedTransactions: {
    status: 'success' | 'failure'
    blockNumber: string
    gasNeeded: number
    gasUsed: number
    gasPrice: string
  }[]
}

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

  if (!token.address || !isAddress(token.address)) {
    // should never happen
    throw new Error(`Cannot use a token without address. Token id: ${token.tokenId}`)
  }

  const approvedAllowanceForSpender = await publicClient[
    networkIdToNetwork[token.networkId]
  ].readContract({
    address: token.address,
    abi: erc20.abi,
    functionName: 'allowance',
    args: [walletAddress, poolContractAddress],
  })

  if (approvedAllowanceForSpender < amountToSupply) {
    const data = encodeFunctionData({
      abi: erc20.abi,
      functionName: 'approve',
      args: [poolContractAddress, amountToSupply],
    })

    const approveTx: TransactionRequest = {
      from: walletAddress,
      to: token.address,
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
      args: [token.address, amountToSupply, walletAddress, 0],
    }),
  }

  baseTransactions.push(supplyTx)

  const response = await fetchWithTimeout(networkConfig.simulateTransactionsUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transactions: baseTransactions,
      networkId: token.networkId,
    }),
  })

  if (!response.ok) {
    throw new Error(
      `Failed to simulate transactions. status ${response.status}, text: ${await response.text()}`
    )
  }

  // extract fee of the supply transaction and set gas fields
  const { simulatedTransactions }: SimulatedTransactionResponse = await response.json()

  if (simulatedTransactions.length !== baseTransactions.length) {
    throw new Error(
      `Expected ${baseTransactions.length} simulated transactions, got ${simulatedTransactions.length}, response: ${JSON.stringify(simulatedTransactions)}`
    )
  }

  const supplySimulatedTx = simulatedTransactions[simulatedTransactions.length - 1]

  if (supplySimulatedTx.status !== 'success') {
    throw new Error(
      `Failed to simulate supply transaction. response: ${JSON.stringify(simulatedTransactions)}`
    )
  }

  baseTransactions[baseTransactions.length - 1].gas = BigInt(supplySimulatedTx.gasNeeded)
  baseTransactions[baseTransactions.length - 1]._estimatedGasUse = BigInt(supplySimulatedTx.gasUsed)

  return prepareTransactions({
    feeCurrencies,
    baseTransactions,
    spendToken: token,
    spendTokenAmount: new BigNumber(amount),
  })
}

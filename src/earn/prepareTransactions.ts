import BigNumber from 'bignumber.js'
import { useAsyncCallback } from 'react-async-hook'
import aaveIncentivesV3Abi from 'src/abis/AaveIncentivesV3'
import aavePool from 'src/abis/AavePoolV3'
import erc20 from 'src/abis/IERC20'
import { RewardsInfo } from 'src/earn/types'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import { TokenBalance } from 'src/tokens/slice'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import { publicClient } from 'src/viem'
import { TransactionRequest, prepareTransactions } from 'src/viem/prepareTransactions'
import networkConfig, { networkIdToNetwork } from 'src/web3/networkConfig'
import { Address, encodeFunctionData, isAddress, parseUnits } from 'viem'

const TAG = 'earn/prepareTransactions'

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

  const { depositGasPadding } = getDynamicConfigParams(
    DynamicConfigs[StatsigDynamicConfigs.EARN_STABLECOIN_CONFIG]
  )

  baseTransactions[baseTransactions.length - 1].gas = BigInt(
    supplySimulatedTx.gasNeeded + depositGasPadding
  )
  baseTransactions[baseTransactions.length - 1]._estimatedGasUse = BigInt(supplySimulatedTx.gasUsed)

  return prepareTransactions({
    feeCurrencies,
    baseTransactions,
    spendToken: token,
    spendTokenAmount: new BigNumber(amount),
  })
}

/**
 * Hook to prepare transactions for supplying crypto.
 */
export function usePrepareSupplyTransactions() {
  const prepareTransactions = useAsyncCallback(prepareSupplyTransactions, {
    onError: (err) => {
      const error = ensureError(err)
      Logger.error(TAG, 'usePrepareSupplyTransactions', error)
    },
  })

  return {
    prepareTransactionsResult: prepareTransactions.result,
    refreshPreparedTransactions: prepareTransactions.execute,
    clearPreparedTransactions: prepareTransactions.reset,
    prepareTransactionError: prepareTransactions.error,
  }
}

export async function prepareWithdrawAndClaimTransactions({
  amount,
  token,
  walletAddress,
  feeCurrencies,
  rewards,
  poolTokenAddress,
}: {
  amount: string
  token: TokenBalance
  poolTokenAddress: Address
  walletAddress: Address
  feeCurrencies: TokenBalance[]
  rewards: RewardsInfo[]
}) {
  const baseTransactions: TransactionRequest[] = []

  if (!token.address || !isAddress(token.address)) {
    // should never happen
    throw new Error(`Cannot use a token without address. Token id: ${token.tokenId}`)
  }

  const amountToWithdraw = parseUnits(amount, token.decimals)

  baseTransactions.push({
    from: walletAddress,
    to: networkConfig.arbAavePoolV3ContractAddress,
    data: encodeFunctionData({
      abi: aavePool,
      functionName: 'withdraw',
      args: [token.address, amountToWithdraw, walletAddress],
    }),
  })

  rewards.forEach(({ amount, tokenInfo }) => {
    const amountToClaim = parseUnits(amount, tokenInfo.decimals)

    if (!tokenInfo.address || !isAddress(tokenInfo.address)) {
      // should never happen
      throw new Error(`Cannot use a token without address. Token id: ${token.tokenId}`)
    }

    baseTransactions.push({
      from: walletAddress,
      to: networkConfig.arbAaveIncentivesV3ContractAddress,
      data: encodeFunctionData({
        abi: aaveIncentivesV3Abi,
        functionName: 'claimRewardsToSelf',
        args: [[poolTokenAddress], amountToClaim, tokenInfo.address],
      }),
    })
  })

  return prepareTransactions({
    feeCurrencies,
    baseTransactions,
  })
}

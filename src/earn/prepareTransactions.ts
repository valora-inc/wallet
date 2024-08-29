import BigNumber from 'bignumber.js'
import { useAsyncCallback } from 'react-async-hook'
import aaveIncentivesV3Abi from 'src/abis/AaveIncentivesV3'
import aavePool from 'src/abis/AavePoolV3'
import { RewardsInfo } from 'src/earn/types'
import { isGasSubsidizedForNetwork } from 'src/earn/utils'
import { triggerShortcutRequest } from 'src/positions/saga'
import { RawShortcutTransaction } from 'src/positions/slice'
import { rawShortcutTransactionsToTransactionRequests } from 'src/positions/transactions'
import { EarnPosition } from 'src/positions/types'
import { TokenBalance } from 'src/tokens/slice'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import { TransactionRequest, prepareTransactions } from 'src/viem/prepareTransactions'
import networkConfig from 'src/web3/networkConfig'
import { Address, encodeFunctionData, isAddress, maxUint256, parseUnits } from 'viem'

const TAG = 'earn/prepareTransactions'

export async function prepareSupplyTransactions({
  amount,
  token,
  walletAddress,
  feeCurrencies,
  pool,
  hooksApiUrl,
}: {
  amount: string
  token: TokenBalance
  walletAddress: Address
  feeCurrencies: TokenBalance[]
  pool: EarnPosition
  hooksApiUrl: string
}) {
  const { transactions }: { transactions: RawShortcutTransaction[] } = await triggerShortcutRequest(
    hooksApiUrl,
    {
      address: walletAddress,
      appId: pool.appId,
      networkId: pool.networkId,
      shortcutId: 'deposit',
      tokens: [
        {
          tokenId: token.tokenId,
          amount,
        },
      ],
      ...pool.shortcutTriggerArgs?.deposit,
    }
  )

  return prepareTransactions({
    feeCurrencies,
    baseTransactions: rawShortcutTransactionsToTransactionRequests(transactions),
    spendToken: token,
    spendTokenAmount: new BigNumber(amount).shiftedBy(token.decimals),
    isGasSubsidized: isGasSubsidizedForNetwork(token.networkId),
    origin: 'earn-deposit',
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
    isPreparingTransactions: prepareTransactions.loading,
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

  const amountToWithdraw = maxUint256 // Withdraws entire balance https://docs.aave.com/developers/core-contracts/pool#withdraw

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
    isGasSubsidized: isGasSubsidizedForNetwork(token.networkId),
    origin: 'earn-withdraw',
  })
}

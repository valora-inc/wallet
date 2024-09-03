import BigNumber from 'bignumber.js'
import _ from 'lodash'
import { useAsyncCallback } from 'react-async-hook'
import { PrepareWithdrawAndClaimParams } from 'src/earn/types'
import { isGasSubsidizedForNetwork } from 'src/earn/utils'
import { triggerShortcutRequest } from 'src/positions/saga'
import { RawShortcutTransaction } from 'src/positions/slice'
import { rawShortcutTransactionsToTransactionRequests } from 'src/positions/transactions'
import { EarnPosition } from 'src/positions/types'
import { TokenBalance } from 'src/tokens/slice'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import { prepareTransactions } from 'src/viem/prepareTransactions'
import { Address } from 'viem'

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
  pool,
  walletAddress,
  feeCurrencies,
  hooksApiUrl,
  positionsWithClaimableRewards,
}: PrepareWithdrawAndClaimParams) {
  const { transactions: withdrawTransactions }: { transactions: RawShortcutTransaction[] } =
    await triggerShortcutRequest(hooksApiUrl, {
      address: walletAddress,
      appId: pool.appId,
      networkId: pool.networkId,
      shortcutId: 'withdraw',
      tokens: [
        {
          tokenId: pool.dataProps.withdrawTokenId,
          amount: pool.balance,
        },
      ],
      ...pool.shortcutTriggerArgs?.withdraw,
    })
  const claimTransactions = await Promise.all(
    positionsWithClaimableRewards.map(async (position): Promise<RawShortcutTransaction[]> => {
      const { transactions }: { transactions: RawShortcutTransaction[] } =
        await triggerShortcutRequest(hooksApiUrl, {
          address: walletAddress,
          appId: pool.appId,
          networkId: pool.networkId,
          shortcutId: 'claim-rewards',
          ...position.shortcutTriggerArgs?.['claim-rewards'],
        })
      return transactions
    })
  )

  return prepareTransactions({
    feeCurrencies,
    baseTransactions: rawShortcutTransactionsToTransactionRequests([
      ...withdrawTransactions,
      ..._.flatten(claimTransactions),
    ]),
    isGasSubsidized: isGasSubsidizedForNetwork(pool.networkId),
    origin: 'earn-withdraw',
  })
}

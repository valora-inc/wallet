import BigNumber from 'bignumber.js'
import _ from 'lodash'
import { useAsyncCallback } from 'react-async-hook'
import { EarnEnterMode, PrepareWithdrawAndClaimParams } from 'src/earn/types'
import { isGasSubsidizedForNetwork } from 'src/earn/utils'
import { triggerShortcutRequest } from 'src/positions/saga'
import { RawShortcutTransaction } from 'src/positions/slice'
import { rawShortcutTransactionsToTransactionRequests } from 'src/positions/transactions'
import { EarnPosition } from 'src/positions/types'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import { SwapTransaction } from 'src/swap/types'
import { TokenBalance } from 'src/tokens/slice'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import { prepareTransactions } from 'src/viem/prepareTransactions'
import { Address } from 'viem'

const TAG = 'earn/prepareTransactions'

export async function prepareDepositTransactions({
  amount,
  token,
  walletAddress,
  feeCurrencies,
  pool,
  hooksApiUrl,
  shortcutId,
}: {
  amount: string
  token: TokenBalance
  walletAddress: Address
  feeCurrencies: TokenBalance[]
  pool: EarnPosition
  hooksApiUrl: string
  shortcutId: EarnEnterMode
}) {
  const { enableAppFee } = getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.SWAP_CONFIG])
  const args =
    shortcutId === 'deposit'
      ? {
          tokens: [
            {
              tokenId: token.tokenId,
              amount,
            },
          ],
        }
      : {
          swapFromToken: {
            tokenId: token.tokenId,
            amount,
            decimals: token.decimals,
            address: token.address,
            isNative: token.isNative ?? false,
          },
          enableAppFee,
        }

  const {
    transactions,
    dataProps,
  }: { transactions: RawShortcutTransaction[]; dataProps?: { swapTransaction: SwapTransaction } } =
    await triggerShortcutRequest(hooksApiUrl, {
      address: walletAddress,
      appId: pool.appId,
      networkId: pool.networkId,
      shortcutId,
      ...args,
      ...pool.shortcutTriggerArgs?.[shortcutId],
    })

  if (shortcutId === 'swap-deposit' && !dataProps?.swapTransaction) {
    Logger.error(
      `${TAG}/prepareDepositTransactions`,
      'Swap transaction not found in swap-deposit shortcut response',
      { dataProps }
    )
    throw new Error('Swap transaction not found in swap-deposit shortcut response')
  }

  return {
    prepareTransactionsResult: await prepareTransactions({
      feeCurrencies,
      baseTransactions: rawShortcutTransactionsToTransactionRequests(transactions),
      spendToken: token,
      spendTokenAmount: new BigNumber(amount).shiftedBy(token.decimals),
      isGasSubsidized: isGasSubsidizedForNetwork(token.networkId),
      origin: `earn-${shortcutId}`,
    }),
    swapTransaction: dataProps?.swapTransaction,
  }
}

export async function prepareWithdrawAndClaimTransactions({
  pool,
  walletAddress,
  feeCurrencies,
  hooksApiUrl,
  rewardsPositions,
  amount,
  useMax = true,
}: PrepareWithdrawAndClaimParams) {
  const { dataProps, balance, appId, networkId, shortcutTriggerArgs } = pool
  const { transactions: withdrawTransactions }: { transactions: RawShortcutTransaction[] } =
    await triggerShortcutRequest(hooksApiUrl, {
      address: walletAddress,
      appId,
      networkId,
      shortcutId: 'withdraw',
      tokens: [
        {
          tokenId: dataProps.withdrawTokenId,
          amount: useMax ? balance : amount,
          useMax,
        },
      ],
      ...shortcutTriggerArgs?.withdraw,
    })
  const claimTransactions = await Promise.all(
    rewardsPositions.map(async (position): Promise<RawShortcutTransaction[]> => {
      const { transactions }: { transactions: RawShortcutTransaction[] } =
        await triggerShortcutRequest(hooksApiUrl, {
          address: walletAddress,
          appId,
          networkId,
          shortcutId: 'claim-rewards',
          ...position.shortcutTriggerArgs?.['claim-rewards'],
        })
      return transactions
    })
  )
  Logger.debug(TAG, 'prepareWithdrawAndClaimTransactions', {
    withdrawTransactions,
    claimTransactions,
    pool,
  })
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

export async function prepareWithdrawTransactions({
  amount,
  token,
  walletAddress,
  feeCurrencies,
  pool,
  hooksApiUrl,
  shortcutId,
  useMax,
}: {
  amount: string
  token: TokenBalance
  walletAddress: Address
  feeCurrencies: TokenBalance[]
  pool: EarnPosition
  hooksApiUrl: string
  shortcutId: EarnEnterMode
  useMax: boolean
}) {
  const { dataProps } = pool
  const { transactions }: { transactions: RawShortcutTransaction[] } = await triggerShortcutRequest(
    hooksApiUrl,
    {
      address: walletAddress,
      appId: pool.appId,
      networkId: pool.networkId,
      shortcutId,
      tokens: [
        {
          tokenId: dataProps.withdrawTokenId,
          amount,
          useMax,
        },
      ],
      ...pool.shortcutTriggerArgs?.[shortcutId],
    }
  )

  return {
    prepareTransactionsResult: await prepareTransactions({
      feeCurrencies,
      baseTransactions: rawShortcutTransactionsToTransactionRequests(transactions),
      isGasSubsidized: isGasSubsidizedForNetwork(token.networkId),
      origin: `earn-${shortcutId}`,
    }),
    swapTransaction: undefined,
  }
}

export function usePrepareTransactions(mode: EarnEnterMode) {
  const prepareTransactions = useAsyncCallback(
    mode === 'withdraw' ? prepareWithdrawTransactions : prepareDepositTransactions,
    {
      onError: (err) => {
        const error = ensureError(err)
        Logger.error(TAG, 'usePrepareWithdrawTransactions', error)
      },
    }
  )

  return {
    prepareTransactionsResult: prepareTransactions.result,
    refreshPreparedTransactions: prepareTransactions.execute,
    clearPreparedTransactions: prepareTransactions.reset,
    prepareTransactionError: prepareTransactions.error,
    isPreparingTransactions: prepareTransactions.loading,
  }
}

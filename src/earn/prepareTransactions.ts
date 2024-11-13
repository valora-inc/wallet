import BigNumber from 'bignumber.js'
import { EarnActiveMode } from 'src/earn/types'
import { isGasSubsidizedForNetwork } from 'src/earn/utils'
import { triggerShortcutRequest } from 'src/positions/saga'
import { RawShortcutTransaction } from 'src/positions/slice'
import { rawShortcutTransactionsToTransactionRequests } from 'src/positions/transactions'
import { EarnPosition, Position } from 'src/positions/types'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import { SwapTransaction } from 'src/swap/types'
import { TokenBalance } from 'src/tokens/slice'
import Logger from 'src/utils/Logger'
import { prepareTransactions } from 'src/viem/prepareTransactions'
import { Address } from 'viem'

const TAG = 'earn/prepareTransactions'

// Used on EarnEnterAmount.tsx
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
  shortcutId: Extract<EarnActiveMode, 'deposit' | 'swap-deposit'>
}) {
  const { appId, networkId } = pool
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
      appId,
      networkId,
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

// Used on EarnEnterAmount.tsx and the usePrepareEnterAmountTransactionsCallback hook expects a swapTransaction even if it's undefined
export async function prepareWithdrawTransactionsWithSwap({
  amount,
  walletAddress,
  feeCurrencies,
  pool,
  hooksApiUrl,
  useMax,
}: {
  amount: string
  walletAddress: Address
  feeCurrencies: TokenBalance[]
  pool: EarnPosition
  hooksApiUrl: string
  useMax: boolean
}) {
  const prepareTransactionsResult = await prepareWithdrawTransactions({
    amount,
    walletAddress,
    feeCurrencies,
    pool,
    hooksApiUrl,
    useMax,
  })

  Logger.debug(TAG, 'prepareWithdrawTransactionsWithSwap', {
    prepareTransactionsResult,
    pool,
  })

  return {
    prepareTransactionsResult,
    swapTransaction: undefined,
  }
}

// Used on the EarnConfirmationScreen.tsx
export async function prepareWithdrawAndClaimTransactions({
  walletAddress,
  feeCurrencies,
  pool,
  hooksApiUrl,
  rewardsPositions,
}: {
  walletAddress: Address
  feeCurrencies: TokenBalance[]
  pool: EarnPosition
  hooksApiUrl: string
  rewardsPositions: Position[]
}) {
  const { appId, balance, dataProps, networkId, shortcutTriggerArgs } = pool
  const { transactions: withdrawTransactions }: { transactions: RawShortcutTransaction[] } =
    await triggerShortcutRequest(hooksApiUrl, {
      address: walletAddress,
      appId,
      networkId,
      shortcutId: 'withdraw',
      tokens: [
        {
          tokenId: dataProps.withdrawTokenId,
          amount: balance,
          useMax: true,
        },
      ],
      ...shortcutTriggerArgs?.withdraw,
    })

  // Conditionally populate claimTransactions based on withdrawalIncludesClaim
  const claimTransactions = dataProps.withdrawalIncludesClaim
    ? []
    : await Promise.all(
        rewardsPositions.map(async (position): Promise<RawShortcutTransaction[]> => {
          const { transactions }: { transactions?: RawShortcutTransaction[] } =
            await triggerShortcutRequest(hooksApiUrl, {
              address: walletAddress,
              appId,
              networkId,
              shortcutId: 'claim-rewards',
              ...position.shortcutTriggerArgs?.['claim-rewards'],
            })
          return transactions ?? [] // Default to an empty array if rewardsPositions is undefined
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
      ...claimTransactions.flat(),
    ]),
    isGasSubsidized: isGasSubsidizedForNetwork(networkId),
    origin: 'earn-withdraw',
  })
}

export async function prepareWithdrawTransactions({
  amount,
  walletAddress,
  feeCurrencies,
  pool,
  hooksApiUrl,
  useMax,
}: {
  amount: string
  walletAddress: Address
  feeCurrencies: TokenBalance[]
  pool: EarnPosition
  hooksApiUrl: string
  useMax: boolean
}) {
  const { appId, balance, dataProps, networkId, shortcutTriggerArgs } = pool
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
  Logger.debug(TAG, 'prepareWithdrawTransactions', {
    withdrawTransactions,
    pool,
  })

  return prepareTransactions({
    feeCurrencies,
    baseTransactions: rawShortcutTransactionsToTransactionRequests(withdrawTransactions),
    isGasSubsidized: isGasSubsidizedForNetwork(networkId),
    origin: 'earn-withdraw',
  })
}

export async function prepareClaimTransactions({
  pool,
  walletAddress,
  feeCurrencies,
  hooksApiUrl,
  rewardsPositions = [],
}: {
  pool: EarnPosition
  walletAddress: Address
  feeCurrencies: TokenBalance[]
  hooksApiUrl: string
  rewardsPositions?: Position[]
}) {
  const { appId, networkId } = pool

  const claimTransactions = await Promise.all(
    rewardsPositions.map(async (position): Promise<RawShortcutTransaction[]> => {
      const { transactions }: { transactions?: RawShortcutTransaction[] } =
        await triggerShortcutRequest(hooksApiUrl, {
          address: walletAddress,
          appId,
          networkId,
          shortcutId: 'claim-rewards',
          ...position.shortcutTriggerArgs?.['claim-rewards'],
        })
      return transactions ?? []
    })
  )

  Logger.debug(TAG, 'prepareClaimTransactions', {
    claimTransactions,
    pool,
  })

  return prepareTransactions({
    feeCurrencies,
    baseTransactions: rawShortcutTransactionsToTransactionRequests(claimTransactions.flat()),
    isGasSubsidized: isGasSubsidizedForNetwork(networkId),
    origin: 'earn-claim-rewards',
  })
}

import BigNumber from 'bignumber.js'
import { TransactionRequestCIP42 } from 'node_modules/viem/_types/chains/celo/types'
import erc20 from 'src/abis/IERC20'
import { STATIC_GAS_PADDING } from 'src/config'
import { TokenBalance, TokenBalanceWithAddress } from 'src/tokens/slice'
import Logger from 'src/utils/Logger'
import { estimateFeesPerGas } from 'src/viem/estimateFeesPerGas'
import { publicClient } from 'src/viem/index'
import {
  Address,
  EstimateGasExecutionError,
  InsufficientFundsError,
  encodeFunctionData,
  ExecutionRevertedError,
} from 'viem'
import stableToken from 'src/abis/StableToken'

const TAG = 'viem/prepareTransactions'

export interface PreparedTransactionsPossible {
  type: 'possible'
  transactions: TransactionRequestCIP42[]
  feeCurrency: TokenBalance
}

export interface PreparedTransactionsNeedDecreaseSpendAmountForGas {
  type: 'need-decrease-spend-amount-for-gas'
  maxGasFee: BigNumber
  feeCurrency: TokenBalance
  decreasedSpendAmount: BigNumber
}

export interface PreparedTransactionsNotEnoughBalanceForGas {
  type: 'not-enough-balance-for-gas'
  feeCurrencies: TokenBalance[]
}

export type PreparedTransactionsResult =
  | PreparedTransactionsPossible
  | PreparedTransactionsNeedDecreaseSpendAmountForGas
  | PreparedTransactionsNotEnoughBalanceForGas

export function getMaxGasFee(txs: TransactionRequestCIP42[]): BigNumber {
  let maxGasFee = BigInt(0)
  for (const tx of txs) {
    if (!tx.gas || !tx.maxFeePerGas) {
      throw new Error('Missing gas or maxFeePerGas')
    }
    maxGasFee += BigInt(tx.gas) * BigInt(tx.maxFeePerGas)
  }
  return new BigNumber(maxGasFee.toString())
}

export function getFeeCurrencyAddress(feeCurrency: TokenBalance) {
  return !feeCurrency.isNative ? (feeCurrency.address as Address) : undefined
}

/**
 * Try estimating gas for a transaction
 *
 * Returns null if execution reverts due to insufficient funds or transfer value exceeds balance of sender. This means
 *   checks comparing the user's balance to send/swap amounts need to be done somewhere else to be able to give
 *   coherent error messages to the user when they lack the funds to perform a transaction.
 *
 * Throws other kinds of errors (e.g. if execution is reverted for some other reason)
 *
 * @param baseTransaction
 * @param maxFeePerGas
 * @param feeCurrencySymbol
 * @param feeCurrencyAddress
 * @param maxPriorityFeePerGas
 */
export async function tryEstimateTransaction({
  baseTransaction,
  maxFeePerGas,
  feeCurrencySymbol,
  feeCurrencyAddress,
  maxPriorityFeePerGas,
}: {
  baseTransaction: TransactionRequestCIP42
  maxFeePerGas: bigint
  feeCurrencySymbol: string
  feeCurrencyAddress?: Address
  maxPriorityFeePerGas?: bigint
}) {
  const tx = {
    ...baseTransaction,
    maxFeePerGas,
    maxPriorityFeePerGas,
    // Don't include the feeCurrency field if not present.
    // See https://github.com/wagmi-dev/viem/blob/e0149711da5894ac5f0719414b4ecc06ccaecb7b/src/chains/celo/serializers.ts#L164-L168
    ...(feeCurrencyAddress && { feeCurrency: feeCurrencyAddress }),
  }

  // TODO maybe cache this? and add static padding when using non-native fee currency
  try {
    tx.gas = await publicClient.celo.estimateGas({
      ...tx,
      account: tx.from,
    })
    Logger.info(TAG, `estimateGas results`, {
      feeCurrency: tx.feeCurrency,
      gas: tx.gas,
      maxFeePerGas,
      maxPriorityFeePerGas,
    })
  } catch (e) {
    if (
      e instanceof EstimateGasExecutionError &&
      (e.cause instanceof InsufficientFundsError ||
        (e.cause instanceof ExecutionRevertedError && // viem does not reliably label node errors as InsufficientFundsError when the user has enough to pay for the transfer, but not for the transfer + gas
          /transfer value exceeded balance of sender/.test(e.cause.details)))
    ) {
      // too much gas was needed
      Logger.warn(TAG, `Couldn't estimate gas with feeCurrency ${feeCurrencySymbol}`, e)
      return null
    }
    throw e
  }

  return tx
}

export async function tryEstimateTransactions(
  baseTransactions: TransactionRequestCIP42[],
  feeCurrency: TokenBalance
) {
  const transactions: TransactionRequestCIP42[] = []

  const feeCurrencyAddress = getFeeCurrencyAddress(feeCurrency)
  const { maxFeePerGas, maxPriorityFeePerGas } = await estimateFeesPerGas(
    publicClient.celo,
    feeCurrencyAddress
  )

  for (const baseTx of baseTransactions) {
    if (baseTx.gas) {
      // We have an estimate of gas already and don't want to recalculate it
      // e.g. if this is a swap transaction that depends on an approval transaction that hasn't been submitted yet, so simulation would fail
      transactions.push({
        ...baseTx,
        maxFeePerGas,
        maxPriorityFeePerGas,
        // Don't include the feeCurrency field if not present.
        // See https://github.com/wagmi-dev/viem/blob/e0149711da5894ac5f0719414b4ecc06ccaecb7b/src/chains/celo/serializers.ts#L164-L168
        ...(feeCurrencyAddress && { feeCurrency: feeCurrencyAddress }),
        // We assume the provided gas value is with the native fee currency
        // If it's not, we add the static padding
        gas: baseTx.gas + BigInt(feeCurrency.isNative ? 0 : STATIC_GAS_PADDING),
      })
    } else {
      const tx = await tryEstimateTransaction({
        baseTransaction: baseTx,
        feeCurrencySymbol: feeCurrency.symbol,
        feeCurrencyAddress,
        maxFeePerGas,
        maxPriorityFeePerGas,
      })
      if (!tx) {
        return null
      }
      transactions.push(tx)
    }
  }

  return transactions
}

/**
 * Prepare transactions to submit to the blockchain.
 *
 * Adds "maxFeePerGas" and "maxPriorityFeePerGas" fields to base transactions. Adds "gas" field to base
 *  transactions if they do not already include them.
 *
 * NOTE: throws if spendTokenAmount exceeds the user's balance of that token.
 *
 * @param feeCurrencies
 * @param spendToken
 * @param spendTokenAmount
 * @param decreasedAmountGasFeeMultiplier
 * @param baseTransactions
 */
export async function prepareTransactions({
  feeCurrencies,
  spendToken,
  spendTokenAmount,
  decreasedAmountGasFeeMultiplier,
  baseTransactions,
}: {
  feeCurrencies: TokenBalance[]
  spendToken: TokenBalanceWithAddress
  spendTokenAmount: BigNumber
  decreasedAmountGasFeeMultiplier: number
  baseTransactions: (TransactionRequestCIP42 & { gas?: bigint })[]
}): Promise<PreparedTransactionsResult> {
  if (spendTokenAmount.isGreaterThan(spendToken.balance.shiftedBy(spendToken.decimals))) {
    throw new Error(
      `Cannot prepareTransactions for amount greater than balance. Amount: ${spendTokenAmount}, Balance: ${spendToken.balance}, Decimals: ${spendToken.decimals}`
    )
  }
  const maxGasFees: Array<{ feeCurrency: TokenBalance; maxGasFeeInDecimal: BigNumber }> = []
  for (const feeCurrency of feeCurrencies) {
    if (feeCurrency.balance.isLessThanOrEqualTo(0)) {
      // No balance, try next fee currency
      continue
    }
    const estimatedTransactions = await tryEstimateTransactions(baseTransactions, feeCurrency)
    if (!estimatedTransactions) {
      // Not enough balance to pay for gas, try next fee currency
      continue
    }
    const maxGasFee = getMaxGasFee(estimatedTransactions)
    const maxGasFeeInDecimal = maxGasFee.shiftedBy(-feeCurrency.decimals)
    maxGasFees.push({ feeCurrency, maxGasFeeInDecimal })
    if (maxGasFeeInDecimal.isGreaterThan(feeCurrency.balance)) {
      // Not enough balance to pay for gas, try next fee currency
      continue
    }
    const spendAmountDecimal = spendTokenAmount.shiftedBy(-spendToken.decimals)
    if (
      spendToken.tokenId === feeCurrency.tokenId &&
      spendAmountDecimal.plus(maxGasFeeInDecimal).isGreaterThan(spendToken.balance)
    ) {
      // Not enough balance to pay for gas, try next fee currency
      continue
    }

    // This is the one we can use
    return {
      type: 'possible',
      transactions: estimatedTransactions,
      feeCurrency,
    } satisfies PreparedTransactionsPossible
  }

  // So far not enough balance to pay for gas
  // let's see if we can decrease the spend amount
  const result = maxGasFees.find(({ feeCurrency }) => feeCurrency.tokenId === spendToken.tokenId)
  if (!result || result.maxGasFeeInDecimal.isGreaterThan(result.feeCurrency.balance)) {
    // Can't decrease the spend amount
    return {
      type: 'not-enough-balance-for-gas',
      feeCurrencies,
    } satisfies PreparedTransactionsNotEnoughBalanceForGas
  }

  // We can decrease the spend amount to pay for gas,
  // We'll ask the user if they want to proceed
  const adjustedMaxGasFee = result.maxGasFeeInDecimal.times(decreasedAmountGasFeeMultiplier)
  const maxAmount = spendToken.balance.minus(adjustedMaxGasFee)

  return {
    type: 'need-decrease-spend-amount-for-gas',
    maxGasFee: adjustedMaxGasFee,
    feeCurrency: result.feeCurrency,
    decreasedSpendAmount: maxAmount,
  } satisfies PreparedTransactionsNeedDecreaseSpendAmountForGas
}

/**
 * Prepare a transaction for sending an ERC-20 token with the 'transfer' method.
 *
 * @param fromWalletAddress the address of the wallet sending the transaction
 * @param toWalletAddress the address of the wallet receiving the token
 * @param sendToken the token to send
 * @param amount the amount of the token to send, denominated in the smallest units for that token
 * @param feeCurrencies the balances of the currencies to consider using for paying the transaction fee
 *
 * @param prepareTxs a function that prepares the transactions (for unit testing-- should use default everywhere else)
 */
export async function prepareERC20TransferTransaction(
  {
    fromWalletAddress,
    toWalletAddress,
    sendToken,
    amount,
    feeCurrencies,
  }: {
    fromWalletAddress: string
    toWalletAddress: string
    sendToken: TokenBalanceWithAddress
    amount: bigint
    feeCurrencies: TokenBalance[]
  },
  prepareTxs = prepareTransactions // for unit testing
): Promise<PreparedTransactionsResult> {
  const baseSendTx: TransactionRequestCIP42 = {
    from: fromWalletAddress as Address,
    to: sendToken.address as Address,
    data: encodeFunctionData({
      abi: erc20.abi,
      functionName: 'transfer',
      args: [toWalletAddress as Address, amount],
    }),
    type: 'cip42',
  }
  return prepareTxs({
    feeCurrencies,
    spendToken: sendToken,
    spendTokenAmount: new BigNumber(amount.toString()),
    decreasedAmountGasFeeMultiplier: 1,
    baseTransactions: [baseSendTx],
  })
}

/**
 * Prepare a transaction for sending an ERC-20 token with the 'transfer' method.
 *
 * @param fromWalletAddress the address of the wallet sending the transaction
 * @param toWalletAddress the address of the wallet receiving the token
 * @param sendToken the token to send. MUST support transferWithComment method
 * @param amount the amount of the token to send, denominated in the smallest units for that token
 * @param feeCurrencies the balances of the currencies to consider using for paying the transaction fee
 * @param comment the comment to include with the token transfer. Defaults to empty string if not provided
 *
 * @param prepareTxs a function that prepares the transactions (for unit testing-- should use default everywhere else)
 */
export async function prepareTransferWithCommentTransaction(
  {
    fromWalletAddress,
    toWalletAddress,
    sendToken,
    amount,
    feeCurrencies,
    comment,
  }: {
    fromWalletAddress: string
    toWalletAddress: string
    sendToken: TokenBalanceWithAddress
    amount: bigint
    feeCurrencies: TokenBalance[]
    comment?: string
  },
  prepareTxs = prepareTransactions // for unit testing
): Promise<PreparedTransactionsResult> {
  const baseSendTx: TransactionRequestCIP42 = {
    from: fromWalletAddress as Address,
    to: sendToken.address as Address,
    data: encodeFunctionData({
      abi: stableToken.abi,
      functionName: 'transferWithComment',
      args: [toWalletAddress as Address, amount, comment ?? ''],
    }),
    type: 'cip42',
  }
  return prepareTxs({
    feeCurrencies,
    spendToken: sendToken,
    spendTokenAmount: new BigNumber(amount.toString()),
    decreasedAmountGasFeeMultiplier: 1,
    baseTransactions: [baseSendTx],
  })
}

// TODO(ACT-956) create helper for native transfers

/**
 * Given prepared transactions, get the fee currency and amount in decimals
 *
 * @param prepareTransactionsResult
 */
export function getFeeCurrencyAndAmount(
  prepareTransactionsResult: PreparedTransactionsResult | undefined
): { feeAmount: BigNumber | undefined; feeCurrency: TokenBalance | undefined } {
  let feeAmountSmallestUnits = undefined
  let feeCurrency = undefined
  if (prepareTransactionsResult?.type === 'possible') {
    feeCurrency = prepareTransactionsResult.feeCurrency
    feeAmountSmallestUnits = getMaxGasFee(prepareTransactionsResult.transactions)
  } else if (prepareTransactionsResult?.type === 'need-decrease-spend-amount-for-gas') {
    feeCurrency = prepareTransactionsResult.feeCurrency
    feeAmountSmallestUnits = prepareTransactionsResult.maxGasFee
  }
  return {
    feeAmount:
      feeAmountSmallestUnits &&
      feeCurrency &&
      feeAmountSmallestUnits.shiftedBy(-feeCurrency.decimals),
    feeCurrency,
  }
}

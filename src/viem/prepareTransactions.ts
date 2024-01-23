import BigNumber from 'bignumber.js'
import { TransactionRequestCIP42 } from 'node_modules/viem/_types/chains/celo/types'
import erc20 from 'src/abis/IERC20'
import stableToken from 'src/abis/StableToken'
import { STATIC_GAS_PADDING } from 'src/config'
import { NativeTokenBalance, TokenBalance, TokenBalanceWithAddress } from 'src/tokens/slice'
import Logger from 'src/utils/Logger'
import { estimateFeesPerGas } from 'src/viem/estimateFeesPerGas'
import { publicClient } from 'src/viem/index'
import { networkIdToNetwork } from 'src/web3/networkConfig'
import {
  Address,
  Client,
  EstimateGasExecutionError,
  ExecutionRevertedError,
  InsufficientFundsError,
  InvalidInputRpcError,
  TransactionRequestBase,
  TransactionRequestEIP1559,
  encodeFunctionData,
} from 'viem'
import { estimateGas } from 'viem/actions'

const TAG = 'viem/prepareTransactions'

// Supported transaction types
export type TransactionRequest = (TransactionRequestCIP42 | TransactionRequestEIP1559) & {
  // Custom fields needed for showing the user the estimated gas fee
  // underscored to denote that they are not part of the TransactionRequest fields from viem
  // and only intended for internal use in Valora
  _estimatedGasUse?: bigint
  _baseFeePerGas?: bigint
}

export interface PreparedTransactionsPossible {
  type: 'possible'
  transactions: TransactionRequest[]
  feeCurrency: TokenBalance
}

export interface PreparedTransactionsNeedDecreaseSpendAmountForGas {
  type: 'need-decrease-spend-amount-for-gas'
  feeCurrency: TokenBalance
  maxGasFeeInDecimal: BigNumber
  estimatedGasFeeInDecimal: BigNumber
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

export function getMaxGasFee(txs: TransactionRequest[]): BigNumber {
  let maxGasFee = BigInt(0)
  for (const tx of txs) {
    if (!tx.gas || !tx.maxFeePerGas) {
      throw new Error('Missing gas or maxFeePerGas')
    }
    maxGasFee += BigInt(tx.gas) * BigInt(tx.maxFeePerGas)
  }
  return new BigNumber(maxGasFee.toString())
}

export function getEstimatedGasFee(txs: TransactionRequest[]): BigNumber {
  let estimatedGasFee = BigInt(0)
  for (const tx of txs) {
    // Use _estimatedGasUse if available, otherwise use gas
    const estimatedGas = tx._estimatedGasUse ?? tx.gas
    if (!estimatedGas) {
      throw new Error('Missing _estimatedGasUse or gas')
    }
    if (!tx._baseFeePerGas || !tx.maxFeePerGas) {
      throw new Error('Missing _baseFeePerGas or maxFeePerGas')
    }
    const expectedFeePerGas = tx._baseFeePerGas + (tx.maxPriorityFeePerGas ?? BigInt(0))
    estimatedGasFee +=
      estimatedGas * (expectedFeePerGas < tx.maxFeePerGas ? expectedFeePerGas : tx.maxFeePerGas)
  }
  return new BigNumber(estimatedGasFee.toString())
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
 * @param client
 * @param baseTransaction
 * @param maxFeePerGas
 * @param feeCurrencySymbol
 * @param feeCurrencyAddress
 * @param maxPriorityFeePerGas
 */
export async function tryEstimateTransaction({
  client,
  baseTransaction,
  maxFeePerGas,
  maxPriorityFeePerGas,
  baseFeePerGas,
  feeCurrencySymbol,
  feeCurrencyAddress,
}: {
  client: Client
  baseTransaction: TransactionRequest
  maxFeePerGas: bigint
  maxPriorityFeePerGas?: bigint
  baseFeePerGas: bigint
  feeCurrencySymbol: string
  feeCurrencyAddress?: Address
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
    tx.gas = await estimateGas(client, {
      ...(tx as TransactionRequestBase),
      account: tx.from,
    })
    tx._baseFeePerGas = baseFeePerGas
    Logger.info(TAG, `estimateGas results`, {
      feeCurrency: tx.feeCurrency,
      gas: tx.gas,
      maxFeePerGas,
      maxPriorityFeePerGas,
      baseFeePerGas,
    })
  } catch (e) {
    if (
      e instanceof EstimateGasExecutionError &&
      (e.cause instanceof InsufficientFundsError ||
        (e.cause instanceof ExecutionRevertedError && // viem does not reliably label node errors as InsufficientFundsError when the user has enough to pay for the transfer, but not for the transfer + gas
          (/transfer value exceeded balance of sender/.test(e.cause.details) ||
            /transfer amount exceeds balance/.test(e.cause.details))) ||
        (e.cause instanceof InvalidInputRpcError &&
          /gas required exceeds allowance/.test(e.cause.details)))
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
  baseTransactions: TransactionRequest[],
  feeCurrency: TokenBalance
) {
  const transactions: TransactionRequest[] = []

  const network = networkIdToNetwork[feeCurrency.networkId]
  const client = publicClient[network]
  const feeCurrencyAddress = getFeeCurrencyAddress(feeCurrency)
  const { maxFeePerGas, maxPriorityFeePerGas, baseFeePerGas } = await estimateFeesPerGas(
    client,
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
        _estimatedGasUse: baseTx._estimatedGasUse
          ? baseTx._estimatedGasUse + BigInt(feeCurrency.isNative ? 0 : STATIC_GAS_PADDING)
          : undefined,
        _baseFeePerGas: baseFeePerGas,
      })
    } else {
      const tx = await tryEstimateTransaction({
        client,
        baseTransaction: baseTx,
        feeCurrencySymbol: feeCurrency.symbol,
        feeCurrencyAddress,
        maxFeePerGas,
        maxPriorityFeePerGas,
        baseFeePerGas,
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
 * NOTE: throws if spendTokenAmount exceeds the user's balance of that token, unless throwOnSpendTokenAmountExceedsBalance is false
 *
 * @param feeCurrencies
 * @param spendToken
 * @param spendTokenAmount
 * @param decreasedAmountGasFeeMultiplier
 * @param baseTransactions
 * @param throwOnSpendTokenAmountExceedsBalance
 */
export async function prepareTransactions({
  feeCurrencies,
  spendToken,
  spendTokenAmount = new BigNumber(0),
  decreasedAmountGasFeeMultiplier,
  baseTransactions,
  throwOnSpendTokenAmountExceedsBalance = true,
}: {
  feeCurrencies: TokenBalance[]
  spendToken?: TokenBalance
  spendTokenAmount?: BigNumber
  decreasedAmountGasFeeMultiplier: number
  baseTransactions: (TransactionRequest & { gas?: bigint })[]
  throwOnSpendTokenAmountExceedsBalance?: boolean
}): Promise<PreparedTransactionsResult> {
  if (!spendToken && spendTokenAmount.isGreaterThan(0)) {
    throw new Error(
      `prepareTransactions requires a spendToken if spendTokenAmount is greater than 0. spendTokenAmount: ${spendTokenAmount.toString()}`
    )
  }
  if (
    throwOnSpendTokenAmountExceedsBalance &&
    spendToken &&
    spendTokenAmount.isGreaterThan(spendToken.balance.shiftedBy(spendToken.decimals))
  ) {
    throw new Error(
      `Cannot prepareTransactions for amount greater than balance. Amount: ${spendTokenAmount.toString()}, Balance: ${spendToken.balance.toString()}, Decimals: ${
        spendToken.decimals
      }`
    )
  }
  const gasFees: Array<{
    feeCurrency: TokenBalance
    maxGasFeeInDecimal: BigNumber
    estimatedGasFeeInDecimal: BigNumber
  }> = []
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
    const estimatedGasFee = getEstimatedGasFee(estimatedTransactions)
    const estimatedGasFeeInDecimal = estimatedGasFee?.shiftedBy(-feeCurrency.decimals)
    gasFees.push({ feeCurrency, maxGasFeeInDecimal, estimatedGasFeeInDecimal })
    if (maxGasFeeInDecimal.isGreaterThan(feeCurrency.balance)) {
      // Not enough balance to pay for gas, try next fee currency
      continue
    }
    const spendAmountDecimal = spendTokenAmount.shiftedBy(-(spendToken?.decimals ?? 0))
    if (
      spendToken &&
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
  // let's see if we can decrease the spend amount, if provided
  // if no spend amount is provided, we conclude that the user does not have enough balance to pay for gas
  const result = gasFees.find(({ feeCurrency }) => feeCurrency.tokenId === spendToken?.tokenId)
  if (
    !spendToken ||
    !result ||
    result.maxGasFeeInDecimal.isGreaterThan(result.feeCurrency.balance)
  ) {
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
    feeCurrency: result.feeCurrency,
    maxGasFeeInDecimal: adjustedMaxGasFee,
    estimatedGasFeeInDecimal: result.estimatedGasFeeInDecimal,
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
  const baseSendTx: TransactionRequest = {
    from: fromWalletAddress as Address,
    to: sendToken.address as Address,
    data: encodeFunctionData({
      abi: erc20.abi,
      functionName: 'transfer',
      args: [toWalletAddress as Address, amount],
    }),
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
  const baseSendTx: TransactionRequest = {
    from: fromWalletAddress as Address,
    to: sendToken.address as Address,
    data: encodeFunctionData({
      abi: stableToken.abi,
      functionName: 'transferWithComment',
      args: [toWalletAddress as Address, amount, comment ?? ''],
    }),
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
 * Prepare a transaction for sending native asset.
 *
 * @param fromWalletAddress - sender address
 * @param toWalletAddress - recipient address
 * @param amount the amount of the token to send, denominated in the smallest units for that token
 * @param feeCurrencies - tokens to consider using for paying the transaction fee
 * @param sendToken - native asset to send. MUST be native asset (e.g. sendable using the 'value' field of a transaction, like ETH or CELO)
 *
 * @param prepareTxs a function that prepares the transactions (for unit testing-- should use default everywhere else)
 **/
export function prepareSendNativeAssetTransaction(
  {
    fromWalletAddress,
    toWalletAddress,
    amount,
    feeCurrencies,
    sendToken,
  }: {
    fromWalletAddress: string
    toWalletAddress: string
    amount: bigint
    feeCurrencies: TokenBalance[]
    sendToken: NativeTokenBalance
  },
  prepareTxs = prepareTransactions
): Promise<PreparedTransactionsResult> {
  const baseSendTx: TransactionRequest = {
    from: fromWalletAddress as Address,
    to: toWalletAddress as Address,
    value: amount,
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
 * Given prepared transactions, get the fee currency and amount in decimals
 *
 * @param prepareTransactionsResult
 */
export function getFeeCurrencyAndAmount(
  prepareTransactionsResult: PreparedTransactionsResult | undefined
): { feeAmount: BigNumber | undefined; feeCurrency: TokenBalance | undefined } {
  let feeAmountInDecimal = undefined
  let feeCurrency = undefined
  if (prepareTransactionsResult?.type === 'possible') {
    feeCurrency = prepareTransactionsResult.feeCurrency
    feeAmountInDecimal = getMaxGasFee(prepareTransactionsResult.transactions).shiftedBy(
      -feeCurrency.decimals
    )
  } else if (prepareTransactionsResult?.type === 'need-decrease-spend-amount-for-gas') {
    feeCurrency = prepareTransactionsResult.feeCurrency
    feeAmountInDecimal = prepareTransactionsResult.maxGasFeeInDecimal
  }
  return {
    feeAmount: feeAmountInDecimal,
    feeCurrency,
  }
}

/**
 * Given prepared transaction(s), get the fee currency set.
 *
 * NOTE: throws if the fee currency is not the same for all transactions
 */
export function getFeeCurrency(preparedTransactions: TransactionRequest[]): Address | undefined
export function getFeeCurrency(preparedTransaction: TransactionRequest): Address | undefined
export function getFeeCurrency(x: TransactionRequest[] | TransactionRequest): Address | undefined {
  const preparedTransactions = Array.isArray(x) ? x : [x]

  const feeCurrencies = preparedTransactions.map(_getFeeCurrency)
  // The prepared transactions should always use the same fee currency
  // throw if that's not the case
  if (
    feeCurrencies.length > 1 &&
    feeCurrencies.some((feeCurrency) => feeCurrency !== feeCurrencies[0])
  ) {
    throw new Error('Unexpected usage of multiple fee currencies for prepared transactions')
  }

  return feeCurrencies[0]
}

function _getFeeCurrency(prepareTransaction: TransactionRequest): Address | undefined {
  if ('feeCurrency' in prepareTransaction) {
    return prepareTransaction.feeCurrency
  }

  return undefined
}

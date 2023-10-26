import { TokenBalance, TokenBalanceWithAddress } from 'src/tokens/slice'
import { TransactionRequestCIP42 } from 'node_modules/viem/_types/chains/celo/types'
import BigNumber from 'bignumber.js'
import { Address, encodeFunctionData, EstimateGasExecutionError, Hex, zeroAddress } from 'viem'
import { estimateFeesPerGas } from 'src/viem/estimateFeesPerGas'
import { publicClient } from 'src/viem/index'
import { STATIC_GAS_PADDING } from 'src/config'
import Logger from 'src/utils/Logger'
import { Field, SwapTransaction } from 'src/swap/types'
import erc20 from 'src/abis/IERC20'

// Apply a multiplier for the decreased swap amount to account for the
// varying gas costs of different swap providers (or even the same swap)
const DECREASED_SWAP_AMOUNT_GAS_COST_MULTIPLIER = 1.2

interface PreparedTransactionsPossible {
  type: 'possible'
  transactions: TransactionRequestCIP42[]
}

export interface PreparedTransactionsNeedDecreaseSpendAmountForGas {
  type: 'need-decrease-spend-amount-for-gas'
  maxGasCost: BigNumber
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

export function getMaxGasCost(txs: TransactionRequestCIP42[]): BigNumber {
  let maxGasCost = BigInt(0)
  for (const tx of txs) {
    if (!tx.gas || !tx.maxFeePerGas) {
      throw new Error('Missing gas or maxFeePerGas')
    }
    maxGasCost += BigInt(tx.gas) * BigInt(tx.maxFeePerGas)
  }
  return new BigNumber(maxGasCost.toString())
}

function getFeeCurrencyAddress(feeCurrency: TokenBalance) {
  return !feeCurrency.isNative ? (feeCurrency.address as Address) : undefined
}

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
  } catch (e) {
    if (e instanceof EstimateGasExecutionError) {
      // Likely too much gas was needed
      Logger.warn(
        'SwapScreen@useSwapQuote',
        `Couldn't estimate gas with feeCurrency ${feeCurrencySymbol}`,
        e
      )
      return null
    }
    throw e
  }

  return tx
}

async function tryEstimateTransactions(
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

export async function prepareTransactions({
  feeCurrencies,
  spendToken,
  spendTokenAmount,
  decreasedAmountGasCostMultiplier,
  baseTransactions,
}: {
  feeCurrencies: TokenBalance[]
  spendToken: TokenBalanceWithAddress
  spendTokenAmount: BigNumber
  decreasedAmountGasCostMultiplier: number
  baseTransactions: (TransactionRequestCIP42 & { gas?: bigint })[]
}): Promise<PreparedTransactionsResult> {
  const maxGasCosts: Array<{ feeCurrency: TokenBalance; maxGasCostInDecimal: BigNumber }> = []
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
    const maxGasCost = getMaxGasCost(estimatedTransactions)
    const maxGasCostInDecimal = maxGasCost.shiftedBy(-feeCurrency.decimals)
    maxGasCosts.push({ feeCurrency, maxGasCostInDecimal })
    if (maxGasCostInDecimal.isGreaterThan(feeCurrency.balance)) {
      // Not enough balance to pay for gas, try next fee currency
      continue
    }
    const spendAmountDecimal = spendTokenAmount.shiftedBy(-spendToken.decimals)
    if (
      spendToken.tokenId === feeCurrency.tokenId &&
      spendAmountDecimal.plus(maxGasCostInDecimal).isGreaterThan(spendToken.balance)
    ) {
      // Not enough balance to pay for gas, try next fee currency
      continue
    }

    // This is the one we can use
    return {
      type: 'possible',
      transactions: estimatedTransactions,
    } satisfies PreparedTransactionsPossible
  }

  // So far not enough balance to pay for gas
  // let's see if we can decrease the spend amount
  const result = maxGasCosts.find(({ feeCurrency }) => feeCurrency.tokenId === spendToken.tokenId)
  if (!result || result.maxGasCostInDecimal.isGreaterThan(result.feeCurrency.balance)) {
    // Can't decrease the spend amount
    return {
      type: 'not-enough-balance-for-gas',
      feeCurrencies,
    } satisfies PreparedTransactionsNotEnoughBalanceForGas
  }

  // We can decrease the spend amount to pay for gas,
  // We'll ask the user if they want to proceed
  const adjustedMaxGasCost = result.maxGasCostInDecimal.times(decreasedAmountGasCostMultiplier)
  const maxAmount = spendToken.balance.minus(adjustedMaxGasCost)

  return {
    type: 'need-decrease-spend-amount-for-gas',
    maxGasCost: adjustedMaxGasCost,
    feeCurrency: result.feeCurrency,
    decreasedSpendAmount: maxAmount,
  } satisfies PreparedTransactionsNeedDecreaseSpendAmountForGas
}

function createBaseSwapTransactions(
  fromToken: TokenBalanceWithAddress,
  updatedField: Field,
  unvalidatedSwapTransaction: SwapTransaction
) {
  const baseTransactions: TransactionRequestCIP42[] = []

  const { guaranteedPrice, buyAmount, sellAmount, allowanceTarget, from, to, value, data, gas } =
    unvalidatedSwapTransaction
  const amountType: string =
    updatedField === Field.TO ? ('buyAmount' as const) : ('sellAmount' as const)

  const amountToApprove =
    amountType === 'buyAmount'
      ? BigInt(new BigNumber(buyAmount).times(guaranteedPrice).toFixed(0, 0))
      : BigInt(sellAmount)

  // Approve transaction if the sell token is ERC-20
  if (allowanceTarget !== zeroAddress && fromToken.address) {
    const data = encodeFunctionData({
      abi: erc20.abi,
      functionName: 'approve',
      args: [allowanceTarget as Address, amountToApprove],
    })

    const approveTx: TransactionRequestCIP42 = {
      from: from as Address,
      to: fromToken.address as Address,
      data,
    }
    baseTransactions.push(approveTx)
  }

  const swapTx: TransactionRequestCIP42 & { gas: bigint } = {
    from: from as Address,
    to: to as Address,
    value: BigInt(value ?? 0),
    data: data as Hex,
    // This may not be entirely accurate for now
    // without the approval transaction being executed first.
    // See https://www.notion.so/valora-inc/Fee-currency-selection-logic-4c207244893748bd85e23b754334f42d?pvs=4#8b7c27d31ebf4fca981f81e9411f86ee
    // We control this from our API.
    gas: BigInt(gas),
  }
  baseTransactions.push(swapTx)

  return {
    amountToApprove,
    baseTransactions,
  }
}

export async function prepareSwapTransactions(
  fromToken: TokenBalanceWithAddress,
  updatedField: Field,
  unvalidatedSwapTransaction: SwapTransaction,
  price: string,
  feeCurrencies: TokenBalance[]
): Promise<PreparedTransactionsResult> {
  const { amountToApprove, baseTransactions } = createBaseSwapTransactions(
    fromToken,
    updatedField,
    unvalidatedSwapTransaction
  )
  return prepareTransactions({
    feeCurrencies,
    spendToken: fromToken,
    spendTokenAmount: new BigNumber(amountToApprove.toString()),
    decreasedAmountGasCostMultiplier: DECREASED_SWAP_AMOUNT_GAS_COST_MULTIPLIER,
    baseTransactions,
  })
}

/**
 * Prepare a transaction for sending an ERC-20 token with the 'transfer' method.
 *
 * Works for ERC-20 transfers only.
 */
export async function prepareERC20TransferTransaction(
  fromWalletAddress: string,
  toWalletAddress: string,
  sendToken: TokenBalanceWithAddress,
  amountWei: bigint,
  feeCurrencies: TokenBalance[]
): Promise<PreparedTransactionsResult> {
  const baseSendTx: TransactionRequestCIP42 = {
    from: fromWalletAddress as Address,
    to: sendToken.address as Address,
    data: encodeFunctionData({
      abi: erc20.abi,
      functionName: 'transfer',
      args: [toWalletAddress as Address, amountWei],
    }),
    type: 'cip42',
  }
  return prepareTransactions({
    feeCurrencies,
    spendToken: sendToken,
    spendTokenAmount: new BigNumber(amountWei.toString()),
    decreasedAmountGasCostMultiplier: 1,
    baseTransactions: [baseSendTx],
  })
}

// TODO(ACT-955) create helpers for native transfers and Celo-specific transferWithComment

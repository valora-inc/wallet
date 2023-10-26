import { TokenBalance, TokenBalanceWithAddress } from 'src/tokens/slice'
import { TransactionRequestCIP42 } from 'node_modules/viem/_types/chains/celo/types'
import BigNumber from 'bignumber.js'
import { Address, EstimateGasExecutionError } from 'viem'
import { estimateFeesPerGas } from 'src/viem/estimateFeesPerGas'
import { publicClient } from 'src/viem/index'
import { STATIC_GAS_PADDING } from 'src/config'
import Logger from 'src/utils/Logger'

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

function getMaxGasCost(txs: TransactionRequestCIP42[]): BigNumber {
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

async function tryEstimateTransaction({
  baseTransaction,
  maxFeePerGas,
  feeCurrencyAddress,
  maxPriorityFeePerGas,
}: {
  baseTransaction: TransactionRequestCIP42
  maxFeePerGas: bigint
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
        `Couldn't estimate gas with feeCurrencyAddress ${feeCurrencyAddress}`,
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

  for (const [index, baseTx] of baseTransactions.entries()) {
    // We can only truly estimate the gas for the first transaction
    if (index === 0) {
      const tx = await tryEstimateTransaction({
        baseTransaction: baseTx,
        feeCurrencyAddress,
        maxFeePerGas,
        maxPriorityFeePerGas,
      })
      if (!tx) {
        return null
      }
      transactions.push(tx)
    } else {
      if (!baseTx.gas) {
        throw new Error(
          'When multiple transactions are provided, all transactions but the first one must have a gas value'
        )
      }
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

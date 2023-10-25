import { TokenBalance, TokenBalanceWithAddress } from 'src/tokens/slice'
import { TransactionRequestCIP42 } from 'node_modules/viem/_types/chains/celo/types'
import BigNumber from 'bignumber.js'
import { Address, EstimateGasExecutionError } from 'viem'
import { estimateFeesPerGas } from 'src/viem/estimateFeesPerGas'
import { publicClient } from 'src/viem/index'
import { STATIC_GAS_PADDING } from 'src/config'
import Logger from 'src/utils/Logger'

const TAG = 'viem/prepareTransactions'

interface PreparedTransactionsPossible {
  type: 'possible'
  transactions: TransactionRequestCIP42[]
}

export interface PreparedTransactionsNeedDecreaseSpendAmountForGas {
  type: 'need-decrease-spend-amount-for-gas'
  maxGasCost: BigNumber
  feeCurrency: TokenBalance
  decreasedAmount: BigNumber
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

function allTruthy<T>(arr: (T | undefined | null)[]): arr is T[] {
  return arr.every((x) => !!x)
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
    const feeCurrencyAddress = !feeCurrency.isNative ? (feeCurrency.address as Address) : undefined
    const transactions: (TransactionRequestCIP42 | null)[] = await Promise.all(
      baseTransactions.map(async (baseTransaction) => {
        const { maxFeePerGas, maxPriorityFeePerGas } = await estimateFeesPerGas(
          publicClient.celo,
          feeCurrencyAddress
        )
        const transaction = {
          ...baseTransaction,
          maxFeePerGas,
          maxPriorityFeePerGas,
          feeCurrency: feeCurrencyAddress,
        }
        if (baseTransaction.gas) {
          transaction.gas =
            baseTransaction.gas + BigInt(feeCurrency.isNative ? 0 : STATIC_GAS_PADDING)
        } else {
          try {
            baseTransaction.gas = await publicClient.celo.estimateGas({
              ...baseTransaction,
              account: baseTransaction.from,
            })
          } catch (e) {
            if (e instanceof EstimateGasExecutionError) {
              // likely too much gas was needed
              Logger.warn(
                TAG,
                `Couldn't estimate gas for transaction with feeCurrency ${feeCurrency.symbol} (${feeCurrency.tokenId}), trying next feeCurrency`,
                e
              )
              return null
            }
            throw e
          }
        }
        return transaction
      })
    )
    if (!allTruthy(transactions)) {
      // gas estimation failed for some transaction, try next fee currency
      continue
    }
    const maxGasCost = getMaxGasCost(transactions)
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
      transactions,
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
    decreasedAmount: maxAmount,
  } satisfies PreparedTransactionsNeedDecreaseSpendAmountForGas
}

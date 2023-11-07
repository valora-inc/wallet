import { useState } from 'react'
import {
  PreparedTransactionsResult,
  prepareERC20TransferTransaction,
  prepareTransferWithCommentTransaction,
} from 'src/viem/prepareTransactions'
import { TokenBalance, tokenBalanceHasAddress } from 'src/tokens/slice'
import BigNumber from 'bignumber.js'
import { useAsyncCallback } from 'react-async-hook'
import { tokenSupportsComments } from 'src/tokens/utils'
import Logger from 'src/utils/Logger'
import { tokenAmountInSmallestUnit } from 'src/tokens/saga'

const TAG = 'src/send/usePrepareSendTransactions'

// just exported for testing
export async function _prepareSendTransactionsCallback({
  amount,
  token,
  recipientAddress,
  walletAddress,
  feeCurrencies,
}: {
  amount: BigNumber
  token: TokenBalance
  recipientAddress: string
  walletAddress: string
  feeCurrencies: TokenBalance[]
}) {
  if (amount.isLessThanOrEqualTo(0)) {
    return
  }
  if (tokenBalanceHasAddress(token)) {
    const transactionParams = {
      fromWalletAddress: walletAddress,
      toWalletAddress: recipientAddress,
      sendToken: token,
      amount: BigInt(tokenAmountInSmallestUnit(amount, token.decimals)),
      feeCurrencies,
    }
    if (tokenSupportsComments(token)) {
      return prepareTransferWithCommentTransaction(transactionParams)
    } else {
      return prepareERC20TransferTransaction(transactionParams)
    }
  }
  // TODO(ACT-956): non-ERC20 native asset case
}

/**
 * Hook to prepare transactions for sending crypto.
 */
export function usePrepareSendTransactions() {
  const [prepareTransactionsResult, setPrepareTransactionsResult] = useState<
    PreparedTransactionsResult | undefined
  >()

  const prepareTransactions = useAsyncCallback(_prepareSendTransactionsCallback, {
    onError: (error) => {
      Logger.error(TAG, `prepareTransactionsOutput: ${error}`)
    },
    onSuccess: setPrepareTransactionsResult,
  })
  return {
    prepareTransactionsResult,
    refreshPreparedTransactions: prepareTransactions.execute,
    clearPreparedTransactions: () => {
      setPrepareTransactionsResult(undefined)
    },
  }
}

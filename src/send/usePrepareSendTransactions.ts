import { useState } from 'react'
import {
  PreparedTransactionsResult,
  prepareERC20TransferTransaction,
  prepareSendNativeAssetTransaction,
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
  comment,
}: {
  amount: BigNumber
  token: TokenBalance
  recipientAddress: string
  walletAddress: string
  feeCurrencies: TokenBalance[]
  comment?: string
}) {
  if (amount.isLessThanOrEqualTo(0)) {
    return
  }
  const baseTransactionParams = {
    // not including sendToken yet because of typing. need to check whether token has address field or not first, required for erc-20 transfers
    fromWalletAddress: walletAddress,
    toWalletAddress: recipientAddress,
    amount: BigInt(tokenAmountInSmallestUnit(amount, token.decimals)),
    feeCurrencies,
  }
  if (tokenBalanceHasAddress(token)) {
    const transactionParams = { ...baseTransactionParams, sendToken: token, comment }
    if (tokenSupportsComments(token)) {
      return prepareTransferWithCommentTransaction(transactionParams)
    } else {
      return prepareERC20TransferTransaction(transactionParams)
    }
  } else {
    return prepareSendNativeAssetTransaction({
      ...baseTransactionParams,
      sendToken: token,
    })
  }
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

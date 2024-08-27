import BigNumber from 'bignumber.js'
import { useAsyncCallback } from 'react-async-hook'
import { tokenAmountInSmallestUnit } from 'src/tokens/saga'
import { TokenBalance, isNativeTokenBalance, tokenBalanceHasAddress } from 'src/tokens/slice'
import { tokenSupportsComments } from 'src/tokens/utils'
import Logger from 'src/utils/Logger'
import {
  prepareERC20TransferTransaction,
  prepareSendNativeAssetTransaction,
  prepareTransferWithCommentTransaction,
} from 'src/viem/prepareTransactions'

const TAG = 'src/send/usePrepareSendTransactions'

export async function prepareSendTransactionsCallback({
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
    // NOTE: CELO will be sent as ERC-20. This makes analytics easier, but if gas prices increase later on and/or we
    //   gain analytics coverage for native CELO transfers, we could switch to sending CELO as native asset to save on gas
    const transactionParams = { ...baseTransactionParams, sendToken: token, comment }
    if (tokenSupportsComments(token)) {
      return prepareTransferWithCommentTransaction(transactionParams)
    } else {
      return prepareERC20TransferTransaction(transactionParams)
    }
  } else if (isNativeTokenBalance(token)) {
    return prepareSendNativeAssetTransaction({
      ...baseTransactionParams,
      sendToken: token,
    })
  } else {
    Logger.error(
      TAG,
      `Token does not have address AND is not native. token: ${JSON.stringify(token)}}`
    )
  }
}

/**
 * Hook to prepare transactions for sending crypto.
 */
export function usePrepareSendTransactions() {
  const prepareTransactions = useAsyncCallback(prepareSendTransactionsCallback, {
    onError: (error) => {
      Logger.error(TAG, `prepareTransactionsOutput: ${error}`)
    },
  })

  return {
    prepareTransactionsResult: prepareTransactions.result,
    refreshPreparedTransactions: prepareTransactions.execute,
    clearPreparedTransactions: prepareTransactions.reset,
    prepareTransactionError: prepareTransactions.error,
  }
}

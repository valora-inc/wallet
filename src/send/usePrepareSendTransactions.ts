import { useState } from 'react'
import {
  PreparedTransactionsResult,
  prepareERC20TransferTransaction,
} from 'src/viem/prepareTransactions'
import { TokenBalance, tokenBalanceHasAddress } from 'src/tokens/slice'
import BigNumber from 'bignumber.js'
import { useAsyncCallback } from 'react-async-hook'
import { tokenSupportsComments } from 'src/tokens/utils'
import Logger from 'src/utils/Logger'
import { tokenAmountInSmallestUnit } from 'src/tokens/saga'

const TAG = 'src/send/usePrepareSendTransactions'

// just exported for testing
export async function _prepareSendTransactions({
  amount,
  token,
  recipientAddress,
  walletAddress,
  isDekRegistered,
  feeCurrencies,
}: {
  amount: BigNumber
  token: TokenBalance
  recipientAddress: string
  walletAddress: string
  isDekRegistered: boolean
  feeCurrencies: TokenBalance[]
}) {
  const includeRegisterDekTx = !isDekRegistered && tokenSupportsComments(token)

  if (amount.isLessThanOrEqualTo(0)) {
    return
  }
  if (tokenBalanceHasAddress(token)) {
    if (!includeRegisterDekTx) {
      return prepareERC20TransferTransaction({
        fromWalletAddress: walletAddress,
        toWalletAddress: recipientAddress,
        sendToken: token,
        amount: BigInt(tokenAmountInSmallestUnit(amount, token.decimals)),
        feeCurrencies,
      })
    }
    // TODO(ACT-955): case where we need to register DEK too
  }
  // TODO(ACT-956): non-ERC20 native asset case
}

/**
 * Hook to prepare transactions for sending crypto.
 *
 * @param _prepareSendTransactionsCallback: do not use unless testing!
 */
export function usePrepareSendTransactions(
  _prepareSendTransactionsCallback = _prepareSendTransactions // just for testing
) {
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

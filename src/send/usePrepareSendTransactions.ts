import { useEffect, useState } from 'react'
import {
  getMaxGasCost,
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
export function _getOnSuccessCallback({
  setFeeCurrency,
  setPrepareTransactionsResult,
  setFeeAmount,
  setCalculatingFeeAmount,
}: {
  setFeeCurrency: (token: TokenBalance | undefined) => void
  setPrepareTransactionsResult: (result: PreparedTransactionsResult | undefined) => void
  setFeeAmount: (amount: BigNumber | undefined) => void
  setCalculatingFeeAmount: (calculating: boolean) => void
}) {
  return (result: PreparedTransactionsResult | undefined) => {
    setPrepareTransactionsResult(result)
    if (result?.type === 'possible') {
      setFeeCurrency(result.feeCurrency)
      setFeeAmount(
        getMaxGasCost(result.transactions).dividedBy(
          new BigNumber(10).exponentiatedBy(result.feeCurrency.decimals)
        )
      )
    } else {
      setFeeCurrency(undefined)
      setFeeAmount(undefined)
    }
    setCalculatingFeeAmount(false)
  }
}

// just exported for testing
export async function _prepareSendTransactionsCallback({
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

export function usePrepareSendTransactions(
  prepareSendTransactionsCallback = _prepareSendTransactionsCallback // just for testing
) {
  const [prepareTransactionsResult, setPrepareTransactionsResult] = useState<
    PreparedTransactionsResult | undefined
  >()
  const [feeCurrency, setFeeCurrency] = useState<TokenBalance | undefined>()
  const [calculatingFeeAmount, setCalculatingFeeAmount] = useState(false)

  const [feeAmount, setFeeAmount] = useState<BigNumber | undefined>()
  const prepareTransactions = useAsyncCallback(prepareSendTransactionsCallback, {
    onError: (error) => {
      Logger.error(TAG, `prepareTransactionsOutput: ${error}`)
      setCalculatingFeeAmount(false)
    },
    onSuccess: _getOnSuccessCallback({
      setFeeCurrency,
      setPrepareTransactionsResult,
      setFeeAmount,
      setCalculatingFeeAmount,
    }),
  })
  useEffect(() => {
    if (prepareTransactions.loading) setCalculatingFeeAmount(true)
    // switches to false in onSuccess hook after other state updates
  }, [prepareTransactions.loading])
  return {
    feeCurrency,
    feeAmount,
    prepareTransactionsResult,
    prepareTransactionsLoading: prepareTransactions.loading || calculatingFeeAmount, // prepareTransactions.loading flips to false before onSuccess runs and updates state. use this to continue showing loading indicators while state is updated.
    refreshPreparedTransactions: prepareTransactions.execute,
    clearPreparedTransactions: () => {
      setPrepareTransactionsResult(undefined)
      setFeeCurrency(undefined)
      setFeeAmount(undefined)
    },
  }
}

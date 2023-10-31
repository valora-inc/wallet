import { useState } from 'react'
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

// just exported for testing
export function _getOnSuccessCallback({
  setFeeCurrency,
  setPrepareTransactionsResult,
  setFeeAmount,
}: {
  setFeeCurrency: (token: TokenBalance | undefined) => void
  setPrepareTransactionsResult: (result: PreparedTransactionsResult | undefined) => void
  setFeeAmount: (amount: BigNumber | undefined) => void
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
  }
}

export function usePrepareSendTransactions() {
  const [prepareTransactionsResult, setPrepareTransactionsResult] = useState<
    PreparedTransactionsResult | undefined
  >()
  const [feeCurrency, setFeeCurrency] = useState<TokenBalance | undefined>()
  const [feeAmount, setFeeAmount] = useState<BigNumber | undefined>()

  const prepareTransactions = useAsyncCallback(
    async (
      amount: BigNumber,
      token: TokenBalance,
      recipientAddress: string,
      walletAddress: string,
      isDekRegistered: boolean,
      feeCurrencies: TokenBalance[]
    ) => {
      const includeRegisterDekTx = !isDekRegistered && tokenSupportsComments(token)

      if (!amount || amount.eq(0) || !walletAddress) {
        return
      }
      if (tokenBalanceHasAddress(token)) {
        if (!includeRegisterDekTx) {
          Logger.info(
            'src/send/SendEnterAmount',
            `preparing transactions with amount ${amount.toString()}`
          )
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
    },
    {
      onError: (error) => {
        Logger.error('src/send/SendEnterAmount', `prepareTransactionsOutput: ${error}`)
      },
      onSuccess: _getOnSuccessCallback({
        setFeeCurrency: setFeeCurrency,
        setPrepareTransactionsResult: setPrepareTransactionsResult,
        setFeeAmount: setFeeAmount,
      }),
    }
  )
  return {
    feeCurrency,
    feeAmount,
    prepareTransactionsResult,
    prepareTransactionsLoading: prepareTransactions.loading,
    refreshPreparedTransactions: prepareTransactions.execute,
    clearPreparedTransactions: () => {
      setPrepareTransactionsResult(undefined)
      setFeeCurrency(undefined)
      setFeeAmount(undefined)
    },
  }
}

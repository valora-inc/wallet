import { _getOnSuccessCallback } from 'src/send/usePrepareSendTransactions'
import { PreparedTransactionsResult } from 'src/viem/prepareTransactions'
import { mockCeloTokenBalance } from 'test/values'
import BigNumber from 'bignumber.js'

describe('usePrepareSendTransactions', () => {
  describe('_getOnSuccessCallback', () => {
    const mockFeeCurrency = { ...mockCeloTokenBalance, decimals: 2 }

    it('sets prepareTransactionsResult, feeCurrency, and feeAmount if result type is possible', () => {
      const setFeeCurrency = jest.fn()
      const setPrepareTransactionsResult = jest.fn()
      const setFeeAmount = jest.fn()
      const result: PreparedTransactionsResult = {
        type: 'possible',
        transactions: [
          {
            from: '0xfrom',
            to: '0xto',
            data: '0xdata',
            type: 'cip42',
            gas: BigInt(500),
            maxFeePerGas: BigInt(1),
            maxPriorityFeePerGas: undefined,
          },
          {
            from: '0xfrom',
            to: '0xto',
            data: '0xdata',
            type: 'cip42',
            gas: BigInt(100),
            maxFeePerGas: BigInt(1),
            maxPriorityFeePerGas: undefined,
          },
        ],
        feeCurrency: mockFeeCurrency,
      }
      const onSuccess = _getOnSuccessCallback({
        setFeeCurrency,
        setPrepareTransactionsResult,
        setFeeAmount,
      })
      onSuccess(result)
      expect(setPrepareTransactionsResult).toHaveBeenCalledWith(result)
      expect(setFeeCurrency).toHaveBeenCalledWith(mockFeeCurrency)
      expect(setFeeAmount).toHaveBeenCalledWith(new BigNumber(6))
    })

    it('sets preparedTransactionsResult and clears feeCurrency, feeAmount if transaction result type is not possible', () => {
      const result: PreparedTransactionsResult = {
        type: 'not-enough-balance-for-gas',
        feeCurrencies: [mockFeeCurrency],
      }
      const setFeeCurrency = jest.fn()
      const setPrepareTransactionsResult = jest.fn()
      const setFeeAmount = jest.fn()
      const onSuccess = _getOnSuccessCallback({
        setFeeCurrency,
        setFeeAmount,
        setPrepareTransactionsResult,
      })
      onSuccess(result)
      expect(setPrepareTransactionsResult).toHaveBeenCalledWith(result)
      expect(setFeeCurrency).toHaveBeenCalledWith(undefined)
      expect(setFeeAmount).toHaveBeenCalledWith(undefined)
    })
  })
})

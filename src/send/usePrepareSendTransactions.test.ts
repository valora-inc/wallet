import {
  _getOnSuccessCallback,
  _prepareSendTransactionsCallback,
} from 'src/send/usePrepareSendTransactions'
import {
  PreparedTransactionsResult,
  prepareERC20TransferTransaction,
} from 'src/viem/prepareTransactions'
import { mockCeloTokenBalance } from 'test/values'
import BigNumber from 'bignumber.js'
import mocked = jest.mocked

jest.mock('src/viem/prepareTransactions')

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
  describe('_prepareSendTransactionsCallback', () => {
    it('returns undefined if amount is 0', async () => {
      expect(
        await _prepareSendTransactionsCallback({
          amount: new BigNumber(0),
          token: mockCeloTokenBalance,
          recipientAddress: '0xabc',
          walletAddress: '0x123',
          isDekRegistered: true,
          feeCurrencies: [mockCeloTokenBalance],
        })
      ).toBeUndefined()
    })
    it('returns undefined if balance of token to send 0', async () => {
      expect(
        await _prepareSendTransactionsCallback({
          amount: new BigNumber(5),
          token: { ...mockCeloTokenBalance, balance: new BigNumber(0) },
          recipientAddress: '0xabc',
          walletAddress: '0x123',
          isDekRegistered: true,
          feeCurrencies: [mockCeloTokenBalance],
        })
      ).toBeUndefined()
    })
    it('uses prepareERC20TransferTransaction if DEK is registered or token does not support comments', async () => {
      const mockPrepareTransactionsResult: PreparedTransactionsResult = {
        type: 'not-enough-balance-for-gas',
        feeCurrencies: [mockCeloTokenBalance],
      }
      mocked(prepareERC20TransferTransaction).mockResolvedValue(mockPrepareTransactionsResult)
      expect(
        await _prepareSendTransactionsCallback({
          amount: new BigNumber(1),
          token: mockCeloTokenBalance,
          recipientAddress: '0xabc',
          walletAddress: '0x123',
          isDekRegistered: true,
          feeCurrencies: [mockCeloTokenBalance],
        })
      ).toStrictEqual(mockPrepareTransactionsResult)
    })
    it.todo(
      'does nothing for now for the case where DEK is not registered and token supports comments'
    )
  })
  describe('usePrepareSendTransactions', () => {
    it.todo('gives initial values and lets you refresh them at will')
  })
})

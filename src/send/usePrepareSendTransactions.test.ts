import {
  _prepareSendTransactionsCallback,
  usePrepareSendTransactions,
} from 'src/send/usePrepareSendTransactions'
import {
  PreparedTransactionsResult,
  prepareERC20TransferTransaction,
} from 'src/viem/prepareTransactions'
import { mockCeloTokenBalance } from 'test/values'
import BigNumber from 'bignumber.js'
import mocked = jest.mocked
import { renderHook } from '@testing-library/react-native'
import { act } from 'react-test-renderer'
import { tokenSupportsComments } from 'src/tokens/utils'

jest.mock('src/viem/prepareTransactions')
jest.mock('src/tokens/utils')

describe('usePrepareSendTransactions', () => {
  const mockFeeCurrencyWithTwoDecimals = { ...mockCeloTokenBalance, decimals: 2 }
  const mockPossibleResult: PreparedTransactionsResult = {
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
    feeCurrency: mockFeeCurrencyWithTwoDecimals,
  }

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
    it('uses prepareERC20TransferTransaction if DEK is registered', async () => {
      mocked(tokenSupportsComments).mockReturnValue(true)
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
    it('uses prepareERC20TransferTransaction if token does not support comments', async () => {
      mocked(tokenSupportsComments).mockReturnValue(false)
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
          isDekRegistered: false,
          feeCurrencies: [mockCeloTokenBalance],
        })
      ).toStrictEqual(mockPrepareTransactionsResult)
    })
    it('does nothing for now for the case where DEK is not registered and token supports comments', async () => {
      mocked(tokenSupportsComments).mockReturnValue(true)
      expect(
        await _prepareSendTransactionsCallback({
          amount: new BigNumber(1),
          token: mockCeloTokenBalance,
          recipientAddress: '0xabc',
          walletAddress: '0x123',
          isDekRegistered: false,
          feeCurrencies: [mockCeloTokenBalance],
        })
      ).toBeUndefined()
    })
  })
  describe('usePrepareSendTransactions', () => {
    // integration tests (testing both usePrepareSendTransactions and _prepareSendTransactionsCallback at once)
    it('gives initial values and lets you refresh them at will', async () => {
      mocked(prepareERC20TransferTransaction).mockResolvedValue(mockPossibleResult)
      const { result } = renderHook(usePrepareSendTransactions)
      expect(result.current.prepareTransactionsResult).toBeUndefined()
      await act(async () => {
        await result.current.refreshPreparedTransactions({
          amount: new BigNumber(1),
          token: mockCeloTokenBalance,
          recipientAddress: '0xabc',
          walletAddress: '0x123',
          isDekRegistered: true,
          feeCurrencies: [mockCeloTokenBalance],
        })
      })
      expect(result.current.prepareTransactionsResult).toStrictEqual(mockPossibleResult)
    })
  })
})

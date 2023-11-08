import {
  _prepareSendTransactionsCallback,
  usePrepareSendTransactions,
} from 'src/send/usePrepareSendTransactions'
import {
  PreparedTransactionsResult,
  prepareERC20TransferTransaction,
  prepareTransferWithCommentTransaction,
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
  beforeEach(() => {
    jest.clearAllMocks()
  })
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
    maxGasFeeInDecimal: new BigNumber(6),
  }

  describe('_prepareSendTransactionsCallback', () => {
    it('returns undefined if amount is 0', async () => {
      expect(
        await _prepareSendTransactionsCallback({
          amount: new BigNumber(0),
          token: mockCeloTokenBalance,
          recipientAddress: '0xabc',
          walletAddress: '0x123',
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
          feeCurrencies: [mockCeloTokenBalance],
        })
      ).toBeUndefined()
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
          feeCurrencies: [mockCeloTokenBalance],
        })
      ).toStrictEqual(mockPrepareTransactionsResult)
      expect(prepareERC20TransferTransaction).toHaveBeenCalledWith({
        fromWalletAddress: '0x123',
        toWalletAddress: '0xabc',
        sendToken: mockCeloTokenBalance,
        amount: BigInt('1'.concat('0'.repeat(18))),
        feeCurrencies: [mockCeloTokenBalance],
      })
    })
    it('uses prepareTransferWithCommentTransaction if token supports comments', async () => {
      mocked(tokenSupportsComments).mockReturnValue(true)
      const mockPrepareTransactionsResult: PreparedTransactionsResult = {
        type: 'not-enough-balance-for-gas',
        feeCurrencies: [mockCeloTokenBalance],
      }
      mocked(prepareTransferWithCommentTransaction).mockResolvedValue(mockPrepareTransactionsResult)
      expect(
        await _prepareSendTransactionsCallback({
          amount: new BigNumber(20),
          token: mockCeloTokenBalance,
          recipientAddress: '0xabc',
          walletAddress: '0x123',
          feeCurrencies: [mockCeloTokenBalance],
        })
      ).toStrictEqual(mockPrepareTransactionsResult)
      expect(prepareTransferWithCommentTransaction).toHaveBeenCalledWith({
        fromWalletAddress: '0x123',
        toWalletAddress: '0xabc',
        sendToken: mockCeloTokenBalance,
        amount: BigInt('2'.concat('0'.repeat(19))),
        feeCurrencies: [mockCeloTokenBalance],
      })
    })
  })
  describe('usePrepareSendTransactions', () => {
    // integration tests (testing both usePrepareSendTransactions and _prepareSendTransactionsCallback at once)
    it('gives initial values and lets you refresh them at will', async () => {
      mocked(prepareERC20TransferTransaction).mockResolvedValue(mockPossibleResult)
      mocked(tokenSupportsComments).mockReturnValue(false)
      const { result } = renderHook(usePrepareSendTransactions)
      expect(result.current.prepareTransactionsResult).toBeUndefined()
      await act(async () => {
        await result.current.refreshPreparedTransactions({
          amount: new BigNumber(1),
          token: mockCeloTokenBalance,
          recipientAddress: '0xabc',
          walletAddress: '0x123',
          feeCurrencies: [mockCeloTokenBalance],
        })
      })
      expect(result.current.prepareTransactionsResult).toStrictEqual(mockPossibleResult)
    })
  })
})

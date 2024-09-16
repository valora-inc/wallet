import { renderHook } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import { act } from 'react-test-renderer'
import {
  prepareSendTransactionsCallback,
  usePrepareSendTransactions,
} from 'src/send/usePrepareSendTransactions'
import { tokenSupportsComments } from 'src/tokens/utils'
import {
  PreparedTransactionsResult,
  prepareERC20TransferTransaction,
  prepareSendNativeAssetTransaction,
  prepareTransferWithCommentTransaction,
} from 'src/viem/prepareTransactions'
import { mockCeloTokenBalance, mockEthTokenBalance } from 'test/values'
import mocked = jest.mocked

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
        gas: BigInt(500),
        maxFeePerGas: BigInt(1),
        maxPriorityFeePerGas: undefined,
      },
      {
        from: '0xfrom',
        to: '0xto',
        data: '0xdata',
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
        await prepareSendTransactionsCallback({
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
        await prepareSendTransactionsCallback({
          amount: new BigNumber(5),
          token: { ...mockCeloTokenBalance, balance: new BigNumber(0) },
          recipientAddress: '0xabc',
          walletAddress: '0x123',
          feeCurrencies: [mockCeloTokenBalance],
        })
      ).toBeUndefined()
    })
    it('uses prepareERC20TransferTransaction if token is erc20 and does not support comments', async () => {
      mocked(tokenSupportsComments).mockReturnValue(false)
      const mockPrepareTransactionsResult: PreparedTransactionsResult = {
        type: 'not-enough-balance-for-gas',
        feeCurrencies: [mockCeloTokenBalance],
      }
      mocked(prepareERC20TransferTransaction).mockResolvedValue(mockPrepareTransactionsResult)
      expect(
        await prepareSendTransactionsCallback({
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
        await prepareSendTransactionsCallback({
          amount: new BigNumber(20),
          token: mockCeloTokenBalance,
          recipientAddress: '0xabc',
          walletAddress: '0x123',
          feeCurrencies: [mockCeloTokenBalance],
          comment: 'mock comment',
        })
      ).toStrictEqual(mockPrepareTransactionsResult)
      expect(prepareTransferWithCommentTransaction).toHaveBeenCalledWith({
        fromWalletAddress: '0x123',
        toWalletAddress: '0xabc',
        sendToken: mockCeloTokenBalance,
        amount: BigInt('2'.concat('0'.repeat(19))),
        feeCurrencies: [mockCeloTokenBalance],
        comment: 'mock comment',
      })
    })
    it('uses prepareSendNativeAssetTransaction if token is native and does not have address', async () => {
      mocked(tokenSupportsComments).mockReturnValue(false)
      const mockPrepareTransactionsResult: PreparedTransactionsResult = {
        type: 'not-enough-balance-for-gas',
        feeCurrencies: [mockEthTokenBalance],
      }
      mocked(prepareSendNativeAssetTransaction).mockResolvedValue(mockPrepareTransactionsResult)
      expect(
        await prepareSendTransactionsCallback({
          amount: new BigNumber(0.05),
          token: mockEthTokenBalance,
          recipientAddress: '0xabc',
          walletAddress: '0x123',
          feeCurrencies: [mockEthTokenBalance],
        })
      ).toStrictEqual(mockPrepareTransactionsResult)
      expect(prepareSendNativeAssetTransaction).toHaveBeenCalledWith({
        fromWalletAddress: '0x123',
        toWalletAddress: '0xabc',
        sendToken: mockEthTokenBalance,
        amount: BigInt('5'.concat('0'.repeat(16))),
        feeCurrencies: [mockEthTokenBalance],
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

import { renderHook } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import { act } from 'react-test-renderer'
import erc20 from 'src/abis/IERC20'
import jumpstart from 'src/abis/IWalletJumpstart'
import {
  PrepareSendTransactionType,
  prepareSendTransactionsCallback,
  usePrepareSendTransactions,
} from 'src/send/usePrepareSendTransactions'
import { getDynamicConfigParams } from 'src/statsig'
import { tokenSupportsComments } from 'src/tokens/utils'
import { publicClient } from 'src/viem'
import {
  PreparedTransactionsResult,
  TransactionRequest,
  prepareERC20TransferTransaction,
  prepareSendNativeAssetTransaction,
  prepareTransactions,
  prepareTransferWithCommentTransaction,
} from 'src/viem/prepareTransactions'
import { mockCeloTokenBalance, mockEthTokenBalance } from 'test/values'
import { Address, encodeFunctionData } from 'viem'

jest.mock('src/viem/prepareTransactions')
jest.mock('src/tokens/utils')
jest.mock('src/statsig')
jest.mock('viem', () => ({
  ...jest.requireActual('viem'),
  readContract: jest.fn(),
  encodeFunctionData: jest.fn(),
}))

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
          transactionType: PrepareSendTransactionType.TRANSFER,
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
          transactionType: PrepareSendTransactionType.TRANSFER,
        })
      ).toBeUndefined()
    })
    it('uses prepareERC20TransferTransaction if token is erc20 and does not support comments', async () => {
      jest.mocked(tokenSupportsComments).mockReturnValue(false)
      const mockPrepareTransactionsResult: PreparedTransactionsResult = {
        type: 'not-enough-balance-for-gas',
        feeCurrencies: [mockCeloTokenBalance],
      }
      jest.mocked(prepareERC20TransferTransaction).mockResolvedValue(mockPrepareTransactionsResult)
      expect(
        await prepareSendTransactionsCallback({
          amount: new BigNumber(1),
          token: mockCeloTokenBalance,
          recipientAddress: '0xabc',
          walletAddress: '0x123',
          feeCurrencies: [mockCeloTokenBalance],
          transactionType: PrepareSendTransactionType.TRANSFER,
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
      jest.mocked(tokenSupportsComments).mockReturnValue(true)
      const mockPrepareTransactionsResult: PreparedTransactionsResult = {
        type: 'not-enough-balance-for-gas',
        feeCurrencies: [mockCeloTokenBalance],
      }
      jest
        .mocked(prepareTransferWithCommentTransaction)
        .mockResolvedValue(mockPrepareTransactionsResult)
      expect(
        await prepareSendTransactionsCallback({
          amount: new BigNumber(20),
          token: mockCeloTokenBalance,
          recipientAddress: '0xabc',
          walletAddress: '0x123',
          feeCurrencies: [mockCeloTokenBalance],
          comment: 'mock comment',
          transactionType: PrepareSendTransactionType.TRANSFER,
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
      jest.mocked(tokenSupportsComments).mockReturnValue(false)
      const mockPrepareTransactionsResult: PreparedTransactionsResult = {
        type: 'not-enough-balance-for-gas',
        feeCurrencies: [mockEthTokenBalance],
      }
      jest
        .mocked(prepareSendNativeAssetTransaction)
        .mockResolvedValue(mockPrepareTransactionsResult)
      expect(
        await prepareSendTransactionsCallback({
          amount: new BigNumber(0.05),
          token: mockEthTokenBalance,
          recipientAddress: '0xabc',
          walletAddress: '0x123',
          feeCurrencies: [mockEthTokenBalance],
          transactionType: PrepareSendTransactionType.TRANSFER,
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
      jest.mocked(prepareERC20TransferTransaction).mockResolvedValue(mockPossibleResult)
      jest.mocked(tokenSupportsComments).mockReturnValue(false)
      const { result } = renderHook(usePrepareSendTransactions)
      expect(result.current.prepareTransactionsResult).toBeUndefined()
      await act(async () => {
        await result.current.refreshPreparedTransactions({
          amount: new BigNumber(1),
          token: mockCeloTokenBalance,
          recipientAddress: '0xabc',
          walletAddress: '0x123',
          feeCurrencies: [mockCeloTokenBalance],
          transactionType: PrepareSendTransactionType.TRANSFER,
        })
      })
      expect(result.current.prepareTransactionsResult).toStrictEqual(mockPossibleResult)
    })
  })
})

describe('usePrepareSendTransactions with jumpstart', () => {
  const walletAddress = '0x123'
  const jumpstartContractAddress = '0xjumpstart'
  const publicKey = '0xpublicKey'
  const spendAmount = 1

  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(getDynamicConfigParams).mockReturnValue({
      jumpstartContracts: {
        'celo-alfajores': {
          contractAddress: jumpstartContractAddress,
        },
      },
    })
    jest.spyOn(publicClient.celo, 'readContract').mockResolvedValue(0)
  })

  it('should return the jumpstart transactions', async () => {
    jest
      .mocked(encodeFunctionData)
      .mockReturnValueOnce('0xapprovalEncodedData')
      .mockReturnValueOnce('0xtransferEncodedData')
    const expectedBaseTransactions: TransactionRequest[] = [
      {
        from: walletAddress,
        to: mockCeloTokenBalance.address as Address,
        data: '0xapprovalEncodedData',
      },
      {
        from: walletAddress,
        to: jumpstartContractAddress,
        value: BigInt(0),
        data: '0xtransferEncodedData',
      },
    ]
    const expectedPreparedTransactionsResult: PreparedTransactionsResult = {
      type: 'possible',
      transactions: expectedBaseTransactions,
      feeCurrency: mockCeloTokenBalance,
    }
    jest.mocked(prepareTransactions).mockResolvedValue(expectedPreparedTransactionsResult)

    const { result } = renderHook(usePrepareSendTransactions)

    await act(async () => {
      await result.current.refreshPreparedTransactions({
        amount: new BigNumber(spendAmount),
        token: mockCeloTokenBalance,
        walletAddress,
        feeCurrencies: [mockCeloTokenBalance],
        transactionType: PrepareSendTransactionType.JUMPSTART,
        publicKey,
      })
    })

    expect(result.current.prepareTransactionsResult).toStrictEqual(
      expectedPreparedTransactionsResult
    )
    expect(prepareTransactions).toHaveBeenCalledTimes(1)
    expect(prepareTransactions).toHaveBeenCalledWith({
      feeCurrencies: [mockCeloTokenBalance],
      spendToken: mockCeloTokenBalance,
      spendTokenAmount: new BigNumber(spendAmount),
      baseTransactions: expectedBaseTransactions,
    })
    expect(publicClient.celo.readContract).toHaveBeenCalledTimes(1)
    expect(publicClient.celo.readContract).toHaveBeenCalledWith({
      address: mockCeloTokenBalance.address,
      abi: erc20.abi,
      functionName: 'allowance',
      args: [walletAddress, jumpstartContractAddress],
    })
    expect(encodeFunctionData).toHaveBeenNthCalledWith(1, {
      abi: erc20.abi,
      functionName: 'approve',
      args: [jumpstartContractAddress, BigInt(spendAmount)],
    })
    expect(encodeFunctionData).toHaveBeenNthCalledWith(2, {
      abi: jumpstart.abi,
      functionName: 'depositERC20',
      args: [publicKey, mockCeloTokenBalance.address, BigInt(spendAmount)],
    })
  })

  it('should fail if the transactions cannot be prepared', async () => {
    const error = new Error('Failed to prepare transactions')
    jest.mocked(prepareTransactions).mockRejectedValue(error)

    const { result } = renderHook(usePrepareSendTransactions)
    await act(async () => {
      await expect(async () => {
        await result.current.refreshPreparedTransactions({
          amount: new BigNumber(spendAmount),
          token: mockCeloTokenBalance,
          walletAddress,
          feeCurrencies: [mockCeloTokenBalance],
          transactionType: PrepareSendTransactionType.JUMPSTART,
          publicKey,
        })
      }).rejects.toThrowError(error)
    })

    expect(result.current.prepareTransactionError).toBe(error)
    expect(result.current.prepareTransactionsResult).toBeUndefined()
  })
})

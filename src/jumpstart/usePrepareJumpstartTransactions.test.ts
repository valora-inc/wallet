import { renderHook } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import { act } from 'react-test-renderer'
import erc20 from 'src/abis/IERC20'
import jumpstart from 'src/abis/IWalletJumpstart'
import { usePrepareJumpstartTransactions } from 'src/jumpstart/usePrepareJumpstartTransactions'
import { getDynamicConfigParams } from 'src/statsig'
import { publicClient } from 'src/viem'
import {
  PreparedTransactionsResult,
  TransactionRequest,
  prepareTransactions,
} from 'src/viem/prepareTransactions'
import { mockCeloTokenBalance } from 'test/values'
import { Address, encodeFunctionData } from 'viem'

jest.mock('src/viem/prepareTransactions')
jest.mock('src/statsig')
jest.mock('viem', () => ({
  ...jest.requireActual('viem'),
  readContract: jest.fn(),
  encodeFunctionData: jest.fn(),
}))

describe('usePrepareJumpstartTransactions', () => {
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

    const { result } = renderHook(usePrepareJumpstartTransactions)

    await act(async () => {
      await result.current.execute({
        amount: new BigNumber(spendAmount),
        token: mockCeloTokenBalance,
        walletAddress,
        feeCurrencies: [mockCeloTokenBalance],
        publicKey,
      })
    })

    expect(result.current.result).toStrictEqual(expectedPreparedTransactionsResult)
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

    const { result } = renderHook(usePrepareJumpstartTransactions)
    await act(async () => {
      await expect(async () => {
        await result.current.execute({
          amount: new BigNumber(spendAmount),
          token: mockCeloTokenBalance,
          walletAddress,
          feeCurrencies: [mockCeloTokenBalance],
          publicKey,
        })
      }).rejects.toThrowError(error)
    })

    expect(result.current.error).toBe(error)
    expect(result.current.result).toBeUndefined()
  })
})

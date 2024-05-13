import BigNumber from 'bignumber.js'
import { FetchMock } from 'jest-fetch-mock/types'
import aavePool from 'src/abis/AavePoolV3'
import erc20 from 'src/abis/IERC20'
import { prepareSupplyTransactions } from 'src/earn/prepareTransactions'
import { TokenBalance } from 'src/tokens/slice'
import { Network, NetworkId } from 'src/transactions/types'
import { publicClient } from 'src/viem'
import { prepareTransactions } from 'src/viem/prepareTransactions'
import { Address, encodeFunctionData } from 'viem'

const mockFeeCurrency: TokenBalance = {
  address: null,
  balance: new BigNumber(100), // 10k units, 100.0 decimals
  decimals: 2,
  priceUsd: null,
  lastKnownPriceUsd: null,
  tokenId: 'arbitrum-sepolia:native',
  symbol: 'FEE1',
  name: 'Fee token 1',
  networkId: NetworkId['arbitrum-sepolia'],
  isNative: true,
}

const mockTokenAddress: Address = '0x1234567890abcdef1234567890abcdef12345678'

const mockToken: TokenBalance = {
  address: mockTokenAddress,
  balance: new BigNumber(10),
  decimals: 6,
  priceUsd: null,
  lastKnownPriceUsd: null,
  tokenId: `arbitrum-sepolia:${mockTokenAddress}`,
  symbol: 'USDC',
  name: 'USD Coin',
  networkId: NetworkId['arbitrum-sepolia'],
}

jest.mock('src/viem/prepareTransactions')
jest.mock('viem', () => ({
  ...jest.requireActual('viem'),
  encodeFunctionData: jest.fn(),
}))

describe('prepareTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(prepareTransactions).mockImplementation(async ({ baseTransactions }) => ({
      transactions: baseTransactions,
      type: 'possible',
      feeCurrency: mockFeeCurrency,
    }))
    jest.spyOn(publicClient[Network.Arbitrum], 'readContract').mockResolvedValue(BigInt(0))
    jest.mocked(encodeFunctionData).mockReturnValue('0xencodedData')
  })

  describe('prepareSupplyTransactions', () => {
    const mockFetch = fetch as FetchMock
    beforeEach(() => {
      mockFetch.resetMocks()
    })

    it('prepares transactions with approve and supply if not already approved', async () => {
      mockFetch.mockResponseOnce(
        JSON.stringify({
          status: 'OK',
          simulatedTransactions: [
            {
              status: 'success',
              blockNumber: '1',
              gasNeeded: 3000,
              gasUsed: 2800,
              gasPrice: '1',
            },
            {
              status: 'success',
              blockNumber: '1',
              gasNeeded: 50000,
              gasUsed: 49800,
              gasPrice: '1',
            },
          ],
        })
      )

      const result = await prepareSupplyTransactions({
        amount: '5',
        token: mockToken,
        walletAddress: '0x1234',
        feeCurrencies: [mockFeeCurrency],
        poolContractAddress: '0x5678',
      })

      const expectedTransactions = [
        {
          from: '0x1234',
          to: mockTokenAddress,
          data: '0xencodedData',
        },
        {
          from: '0x1234',
          to: '0x5678',
          data: '0xencodedData',
          gas: BigInt(50000),
          _estimatedGasUse: BigInt(49800),
        },
      ]
      expect(result).toEqual({
        type: 'possible',
        feeCurrency: mockFeeCurrency,
        transactions: expectedTransactions,
      })
      expect(publicClient[Network.Arbitrum].readContract).toHaveBeenCalledWith({
        address: mockTokenAddress,
        abi: erc20.abi,
        functionName: 'allowance',
        args: ['0x1234', '0x5678'],
      })
      expect(encodeFunctionData).toHaveBeenNthCalledWith(1, {
        abi: erc20.abi,
        functionName: 'approve',
        args: ['0x5678', BigInt(5e6)],
      })
      expect(encodeFunctionData).toHaveBeenNthCalledWith(2, {
        abi: aavePool,
        functionName: 'supply',
        args: [mockTokenAddress, BigInt(5e6), '0x1234', 0],
      })
      expect(prepareTransactions).toHaveBeenCalledWith({
        baseTransactions: expectedTransactions,
        feeCurrencies: [mockFeeCurrency],
        spendToken: mockToken,
        spendTokenAmount: new BigNumber(5),
      })
    })

    it('prepares transactions with supply if already approved', async () => {
      jest.spyOn(publicClient[Network.Arbitrum], 'readContract').mockResolvedValue(BigInt(5e6))
      mockFetch.mockResponseOnce(
        JSON.stringify({
          status: 'OK',
          simulatedTransactions: [
            {
              status: 'success',
              blockNumber: '1',
              gasNeeded: 50000,
              gasUsed: 49800,
              gasPrice: '1',
            },
          ],
        })
      )

      const result = await prepareSupplyTransactions({
        amount: '5',
        token: mockToken,
        walletAddress: '0x1234',
        feeCurrencies: [mockFeeCurrency],
        poolContractAddress: '0x5678',
      })

      const expectedTransactions = [
        {
          from: '0x1234',
          to: '0x5678',
          data: '0xencodedData',
          gas: BigInt(50000),
          _estimatedGasUse: BigInt(49800),
        },
      ]
      expect(result).toEqual({
        type: 'possible',
        feeCurrency: mockFeeCurrency,
        transactions: expectedTransactions,
      })
      expect(publicClient[Network.Arbitrum].readContract).toHaveBeenCalledWith({
        address: mockTokenAddress,
        abi: erc20.abi,
        functionName: 'allowance',
        args: ['0x1234', '0x5678'],
      })
      expect(encodeFunctionData).toHaveBeenNthCalledWith(1, {
        abi: aavePool,
        functionName: 'supply',
        args: [mockTokenAddress, BigInt(5e6), '0x1234', 0],
      })
      expect(prepareTransactions).toHaveBeenCalledWith({
        baseTransactions: expectedTransactions,
        feeCurrencies: [mockFeeCurrency],
        spendToken: mockToken,
        spendTokenAmount: new BigNumber(5),
      })
    })

    it('throws if simulate transactions sends a non 200 response', async () => {
      mockFetch.mockResponseOnce(
        JSON.stringify({
          status: 'ERROR',
          error: 'something went wrong',
        }),
        { status: 500 }
      )

      await expect(
        prepareSupplyTransactions({
          amount: '5',
          token: mockToken,
          walletAddress: '0x1234',
          feeCurrencies: [mockFeeCurrency],
          poolContractAddress: '0x5678',
        })
      ).rejects.toThrow('Failed to simulate transactions')
    })

    it('throws if supply transaction simulation status is failure', async () => {
      mockFetch.mockResponseOnce(
        JSON.stringify({
          status: 'OK',
          simulatedTransactions: [
            {
              status: 'success',
              blockNumber: '1',
              gasNeeded: 3000,
              gasUsed: 2800,
              gasPrice: '1',
            },
            {
              status: 'failure',
            },
          ],
        })
      )

      await expect(
        prepareSupplyTransactions({
          amount: '5',
          token: mockToken,
          walletAddress: '0x1234',
          feeCurrencies: [mockFeeCurrency],
          poolContractAddress: '0x5678',
        })
      ).rejects.toThrow('Failed to simulate supply transaction')
    })

    it('throws if simulated transactions length does not match base transactions length', async () => {
      mockFetch.mockResponseOnce(
        JSON.stringify({
          status: 'OK',
          simulatedTransactions: [
            {
              status: 'success',
              blockNumber: '1',
              gasNeeded: 3000,
              gasUsed: 2800,
              gasPrice: '1',
            },
          ],
        })
      )

      await expect(
        prepareSupplyTransactions({
          amount: '5',
          token: mockToken,
          walletAddress: '0x1234',
          feeCurrencies: [mockFeeCurrency],
          poolContractAddress: '0x5678',
        })
      ).rejects.toThrow('Expected 2 simulated transactions, got 1')
    })
  })
})

import BigNumber from 'bignumber.js'
import aavePool from 'src/abis/AavePoolV3'
import erc20 from 'src/abis/IERC20'
import { prepareSupplyTransactions } from 'src/earn/prepareTransactions'
import { TokenBalance } from 'src/tokens/slice'
import { Network, NetworkId } from 'src/transactions/types'
import { publicClient } from 'src/viem'
import { prepareTransactions } from 'src/viem/prepareTransactions'
import { encodeFunctionData } from 'viem'

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

const mockToken: TokenBalance = {
  address: '0xusdc',
  balance: new BigNumber(10),
  decimals: 6,
  priceUsd: null,
  lastKnownPriceUsd: null,
  tokenId: 'arbitrum-sepolia:0xusdc',
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
    jest.mocked(encodeFunctionData).mockReturnValue('0xencodedData')
  })

  describe('prepareSupplyTransactions', () => {
    it('prepares transactions with approve and supply if not already approved', async () => {
      jest.spyOn(publicClient[Network.Arbitrum], 'readContract').mockResolvedValue(BigInt(0))

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
          to: '0xusdc',
          data: '0xencodedData',
        },
        {
          from: '0x1234',
          to: '0x5678',
          data: '0xencodedData',
        },
      ]
      expect(result).toEqual({
        type: 'possible',
        feeCurrency: mockFeeCurrency,
        transactions: expectedTransactions,
      })
      expect(publicClient[Network.Arbitrum].readContract).toHaveBeenCalledWith({
        address: '0xusdc',
        abi: erc20.abi,
        functionName: 'allowance',
        args: ['0x1234', '0xusdc'],
      })
      expect(encodeFunctionData).toHaveBeenNthCalledWith(1, {
        abi: erc20.abi,
        functionName: 'approve',
        args: ['0x5678', BigInt(5e6)],
      })
      expect(encodeFunctionData).toHaveBeenNthCalledWith(2, {
        abi: aavePool,
        functionName: 'supply',
        args: ['0xusdc', BigInt(5e6), '0x1234', 0],
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
        },
      ]
      expect(result).toEqual({
        type: 'possible',
        feeCurrency: mockFeeCurrency,
        transactions: expectedTransactions,
      })
      expect(publicClient[Network.Arbitrum].readContract).toHaveBeenCalledWith({
        address: '0xusdc',
        abi: erc20.abi,
        functionName: 'allowance',
        args: ['0x1234', '0xusdc'],
      })
      expect(encodeFunctionData).toHaveBeenNthCalledWith(1, {
        abi: aavePool,
        functionName: 'supply',
        args: ['0xusdc', BigInt(5e6), '0x1234', 0],
      })
      expect(prepareTransactions).toHaveBeenCalledWith({
        baseTransactions: expectedTransactions,
        feeCurrencies: [mockFeeCurrency],
        spendToken: mockToken,
        spendTokenAmount: new BigNumber(5),
      })
    })
  })
})

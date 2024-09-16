import BigNumber from 'bignumber.js'
import {
  prepareSupplyTransactions,
  prepareWithdrawAndClaimTransactions,
} from 'src/earn/prepareTransactions'
import { isGasSubsidizedForNetwork } from 'src/earn/utils'
import { triggerShortcutRequest } from 'src/positions/saga'
import { TokenBalance } from 'src/tokens/slice'
import { NetworkId } from 'src/transactions/types'
import { prepareTransactions } from 'src/viem/prepareTransactions'
import { mockEarnPositions, mockRewardsPositions } from 'test/values'
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

jest.mock('src/statsig')
jest.mock('src/viem/prepareTransactions')
jest.mock('viem', () => ({
  ...jest.requireActual('viem'),
  encodeFunctionData: jest.fn(),
}))
jest.mock('src/earn/simulateTransactions')
jest.mock('src/earn/utils')
jest.mock('src/positions/saga')

describe('prepareTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(prepareTransactions).mockImplementation(async ({ baseTransactions }) => ({
      transactions: baseTransactions,
      type: 'possible',
      feeCurrency: mockFeeCurrency,
    }))
    jest.mocked(isGasSubsidizedForNetwork).mockReturnValue(false)
  })

  describe('prepareSupplyTransactions', () => {
    it('prepares transactions using deposit shortcut', async () => {
      jest.mocked(triggerShortcutRequest).mockResolvedValue({
        transactions: [
          {
            from: '0x1234',
            to: '0x5678',
            data: '0xencodedData',
          },
          {
            from: '0x1234',
            to: '0x5678',
            data: '0xencodedData',
            gas: '50100',
            estimatedGasUse: '49800',
          },
        ],
      })

      const result = await prepareSupplyTransactions({
        amount: '5',
        token: mockToken,
        walletAddress: '0x1234',
        feeCurrencies: [mockFeeCurrency],
        pool: mockEarnPositions[0],
        hooksApiUrl: 'https://hooks.api',
      })

      const expectedTransactions = [
        {
          from: '0x1234',
          to: '0x5678',
          data: '0xencodedData',
        },
        {
          from: '0x1234',
          to: '0x5678',
          data: '0xencodedData',
          gas: BigInt(50100),
          _estimatedGasUse: BigInt(49800),
        },
      ]
      expect(result).toEqual({
        type: 'possible',
        feeCurrency: mockFeeCurrency,
        transactions: expectedTransactions,
      })
      expect(prepareTransactions).toHaveBeenCalledWith({
        baseTransactions: expectedTransactions,
        feeCurrencies: [mockFeeCurrency],
        spendToken: mockToken,
        spendTokenAmount: new BigNumber(5000000),
        isGasSubsidized: false,
        origin: 'earn-deposit',
      })
      expect(isGasSubsidizedForNetwork).toHaveBeenCalledWith(mockToken.networkId)
      expect(triggerShortcutRequest).toHaveBeenCalledWith('https://hooks.api', {
        address: '0x1234',
        appId: mockEarnPositions[0].appId,
        networkId: mockEarnPositions[0].networkId,
        shortcutId: 'deposit',
        tokens: [{ tokenId: mockToken.tokenId, amount: '5' }],
        tokenDecimals: 6,
      })
    })
  })

  describe('prepareWithdrawAndClaimTransactions', () => {
    beforeEach(() => {
      jest.mocked(encodeFunctionData).mockReturnValue('0xencodedData')
      jest
        .mocked(triggerShortcutRequest)
        .mockResolvedValueOnce({
          transactions: [
            {
              from: '0x123',
              to: '0x567',
              data: '0xencodedData',
              gas: '50200',
              estimatedGasUse: '49900',
            },
          ],
        })
        .mockResolvedValueOnce({
          transactions: [
            {
              from: '0x1234',
              to: '0x5678',
              data: '0xencodedData',
              gas: '50100',
              estimatedGasUse: '49800',
            },
          ],
        })
    })

    it('prepares withdraw and claim transactions with gas subsidy on', async () => {
      jest.mocked(isGasSubsidizedForNetwork).mockReturnValue(true)

      const result = await prepareWithdrawAndClaimTransactions({
        walletAddress: '0x1234',
        feeCurrencies: [mockFeeCurrency],
        pool: mockEarnPositions[0],
        hooksApiUrl: 'https://hooks.api',
        rewardsPositions: [mockRewardsPositions[1]],
      })

      const expectedTransactions = [
        {
          from: '0x123',
          to: '0x567',
          data: '0xencodedData',
          gas: BigInt(50200),
          _estimatedGasUse: BigInt(49900),
        },
        {
          from: '0x1234',
          to: '0x5678',
          data: '0xencodedData',
          gas: BigInt(50100),
          _estimatedGasUse: BigInt(49800),
        },
      ]
      expect(result).toEqual({
        type: 'possible',
        feeCurrency: mockFeeCurrency,
        transactions: expectedTransactions,
      })
      expect(isGasSubsidizedForNetwork).toHaveBeenCalledWith(mockEarnPositions[0].networkId)

      expect(prepareTransactions).toHaveBeenCalledWith({
        baseTransactions: expectedTransactions,
        feeCurrencies: [mockFeeCurrency],
        isGasSubsidized: true,
        origin: 'earn-withdraw',
      })
      expect(triggerShortcutRequest).toHaveBeenNthCalledWith(1, 'https://hooks.api', {
        address: '0x1234',
        appId: 'aave',
        networkId: NetworkId['arbitrum-sepolia'],
        shortcutId: 'withdraw',
        tokenDecimals: 6,
        tokens: [
          {
            tokenId: 'arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216',
            amount: '0',
            useMax: true,
          },
        ],
      })
      expect(triggerShortcutRequest).toHaveBeenNthCalledWith(2, 'https://hooks.api', {
        address: '0x1234',
        appId: 'aave',
        networkId: NetworkId['arbitrum-sepolia'],
        shortcutId: 'claim-rewards',
        positionAddress: '0x460b97bd498e1157530aeb3086301d5225b91216',
      })
    })

    it('prepares only withdraw transaction if no rewards with gas subsidy off', async () => {
      const result = await prepareWithdrawAndClaimTransactions({
        walletAddress: '0x1234',
        feeCurrencies: [mockFeeCurrency],
        pool: mockEarnPositions[0],
        hooksApiUrl: 'https://hooks.api',
        rewardsPositions: [],
      })

      const expectedTransactions = [
        {
          from: '0x123',
          to: '0x567',
          data: '0xencodedData',
          gas: BigInt(50200),
          _estimatedGasUse: BigInt(49900),
        },
      ]
      expect(result).toEqual({
        type: 'possible',
        feeCurrency: mockFeeCurrency,
        transactions: expectedTransactions,
      })
      expect(isGasSubsidizedForNetwork).toHaveBeenCalledWith(mockEarnPositions[0].networkId)

      expect(prepareTransactions).toHaveBeenCalledWith({
        baseTransactions: expectedTransactions,
        feeCurrencies: [mockFeeCurrency],
        isGasSubsidized: false,
        origin: 'earn-withdraw',
      })
      expect(triggerShortcutRequest).toHaveBeenCalledTimes(1)
      expect(triggerShortcutRequest).toHaveBeenNthCalledWith(1, 'https://hooks.api', {
        address: '0x1234',
        appId: 'aave',
        networkId: NetworkId['arbitrum-sepolia'],
        shortcutId: 'withdraw',
        tokenDecimals: 6,
        tokens: [
          {
            tokenId: 'arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216',
            amount: '0',
            useMax: true,
          },
        ],
      })
    })
  })
})

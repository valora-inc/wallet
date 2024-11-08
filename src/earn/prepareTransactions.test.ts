import BigNumber from 'bignumber.js'
import {
  prepareClaimTransactions,
  prepareDepositTransactions,
  prepareWithdrawAndClaimTransactions,
  prepareWithdrawTransactions,
} from 'src/earn/prepareTransactions'
import { isGasSubsidizedForNetwork } from 'src/earn/utils'
import { triggerShortcutRequest } from 'src/positions/saga'
import { getDynamicConfigParams } from 'src/statsig'
import { StatsigDynamicConfigs } from 'src/statsig/types'
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
    jest.mocked(getDynamicConfigParams).mockImplementation(({ configName }) => {
      if (configName === StatsigDynamicConfigs.SWAP_CONFIG) {
        return {
          enableAppFee: true,
        }
      }
      return {} as any
    })
  })

  describe('prepareDepositTransactions', () => {
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

      const result = await prepareDepositTransactions({
        amount: '5',
        token: mockToken,
        walletAddress: '0x1234',
        feeCurrencies: [mockFeeCurrency],
        pool: mockEarnPositions[0],
        hooksApiUrl: 'https://hooks.api',
        shortcutId: 'deposit',
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
        prepareTransactionsResult: {
          type: 'possible',
          feeCurrency: mockFeeCurrency,
          transactions: expectedTransactions,
        },
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

    it.each([
      { isNative: true, testSuffix: 'native token', token: mockFeeCurrency },
      { isNative: false, testSuffix: 'non native token', token: mockToken },
    ])(
      'prepares transactions using swap-deposit shortcut ($testSuffix)',
      async ({ isNative, token }) => {
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
          dataProps: {
            swapTransaction: 'swapTransaction',
          },
        })

        const result = await prepareDepositTransactions({
          amount: '5',
          token,
          walletAddress: '0x1234',
          feeCurrencies: [mockFeeCurrency],
          pool: mockEarnPositions[0],
          hooksApiUrl: 'https://hooks.api',
          shortcutId: 'swap-deposit',
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
          prepareTransactionsResult: {
            type: 'possible',
            feeCurrency: mockFeeCurrency,
            transactions: expectedTransactions,
          },
          swapTransaction: 'swapTransaction',
        })
        expect(prepareTransactions).toHaveBeenCalledWith({
          baseTransactions: expectedTransactions,
          feeCurrencies: [mockFeeCurrency],
          spendToken: token,
          spendTokenAmount: new BigNumber(5).times(10 ** token.decimals),
          isGasSubsidized: false,
          origin: 'earn-swap-deposit',
        })
        expect(isGasSubsidizedForNetwork).toHaveBeenCalledWith(mockToken.networkId)
        expect(triggerShortcutRequest).toHaveBeenCalledWith('https://hooks.api', {
          address: '0x1234',
          appId: mockEarnPositions[0].appId,
          enableAppFee: true,
          networkId: mockEarnPositions[0].networkId,
          shortcutId: 'swap-deposit',
          swapFromToken: {
            tokenId: token.tokenId,
            amount: '5',
            decimals: token.decimals,
            address: token.address,
            isNative,
          },
        })
      }
    )

    it.each([undefined, {}])(
      'throws if swap transaction is not found in swap-deposit shortcut response',
      async (dataProps) => {
        jest.mocked(triggerShortcutRequest).mockResolvedValue({
          transactions: [
            {
              from: '0x1234',
              to: '0x5678',
              data: '0xencodedData',
            },
          ],
          dataProps,
        })

        await expect(
          prepareDepositTransactions({
            amount: '5',
            token: mockToken,
            walletAddress: '0x1234',
            feeCurrencies: [mockFeeCurrency],
            pool: mockEarnPositions[0],
            hooksApiUrl: 'https://hooks.api',
            shortcutId: 'swap-deposit',
          })
        ).rejects.toThrow('Swap transaction not found in swap-deposit shortcut response')
      }
    )
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
        .mockResolvedValue({
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

    it('prepares only withdraw transaction if withdrawalIncludesClaim is true', async () => {
      const result = await prepareWithdrawAndClaimTransactions({
        walletAddress: '0x1234',
        feeCurrencies: [mockFeeCurrency],
        pool: {
          ...mockEarnPositions[0],
          dataProps: { ...mockEarnPositions[0].dataProps, withdrawalIncludesClaim: true },
        },
        hooksApiUrl: 'https://hooks.api',
        rewardsPositions: [
          {
            ...mockRewardsPositions[0],
            shortcutTriggerArgs: { 'claim-rewards': { positionAddress: '0x123' } },
          },
        ],
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

      expect(prepareTransactions).toHaveBeenCalledTimes(1)
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

  describe('prepareWithdrawTransaction', () => {
    it('prepares withdraw transactions using withdraw shortcut', async () => {
      jest.mocked(triggerShortcutRequest).mockResolvedValue({
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

      const result = await prepareWithdrawTransactions({
        amount: '10',
        walletAddress: '0x1234',
        feeCurrencies: [mockFeeCurrency],
        pool: mockEarnPositions[0],
        hooksApiUrl: 'https://hooks.api',
        useMax: false,
      })

      const expectedTransactions = [
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
        isGasSubsidized: false,
        origin: 'earn-withdraw',
      })

      expect(triggerShortcutRequest).toHaveBeenCalledWith('https://hooks.api', {
        address: '0x1234',
        appId: mockEarnPositions[0].appId,
        networkId: mockEarnPositions[0].networkId,
        shortcutId: 'withdraw',
        tokens: [
          { tokenId: mockEarnPositions[0].dataProps.withdrawTokenId, amount: '10', useMax: false },
        ],
        tokenDecimals: 6,
      })
    })
  })

  describe('prepareClaimTransactions', () => {
    it('prepares claim transactions using claim-rewards shortcut', async () => {
      jest.mocked(triggerShortcutRequest).mockResolvedValue({
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

      const result = await prepareClaimTransactions({
        pool: mockEarnPositions[0],
        walletAddress: '0x1234',
        feeCurrencies: [mockFeeCurrency],
        hooksApiUrl: 'https://hooks.api',
        rewardsPositions: [mockRewardsPositions[0]],
      })

      const expectedTransactions = [
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
        isGasSubsidized: false,
        origin: 'earn-claim-rewards',
      })

      expect(triggerShortcutRequest).toHaveBeenCalledWith('https://hooks.api', {
        address: '0x1234',
        appId: mockEarnPositions[0].appId,
        networkId: mockEarnPositions[0].networkId,
        shortcutId: 'claim-rewards',
      })
    })

    it('prepares claim transactions using claim-rewards shortcut with multiple rewards', async () => {
      jest.mocked(triggerShortcutRequest).mockResolvedValue({
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

      const result = await prepareClaimTransactions({
        pool: mockEarnPositions[0],
        walletAddress: '0x1234',
        feeCurrencies: [mockFeeCurrency],
        hooksApiUrl: 'https://hooks.api',
        rewardsPositions: mockRewardsPositions,
      })

      const expectedTransactions = [
        {
          from: '0x1234',
          to: '0x5678',
          data: '0xencodedData',
          gas: BigInt(50100),
          _estimatedGasUse: BigInt(49800),
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
    })
  })
})

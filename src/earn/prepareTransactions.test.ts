import BigNumber from 'bignumber.js'
import aaveIncentivesV3Abi from 'src/abis/AaveIncentivesV3'
import aavePool from 'src/abis/AavePoolV3'
import {
  prepareSupplyTransactions,
  prepareWithdrawAndClaimTransactions,
} from 'src/earn/prepareTransactions'
import { isGasSubsidizedForNetwork } from 'src/earn/utils'
import { triggerShortcutRequest } from 'src/positions/saga'
import { TokenBalance } from 'src/tokens/slice'
import { NetworkId } from 'src/transactions/types'
import { prepareTransactions } from 'src/viem/prepareTransactions'
import networkConfig from 'src/web3/networkConfig'
import { mockArbArbAddress, mockArbArbTokenBalance, mockEarnPositions } from 'test/values'
import { Address, encodeFunctionData, maxUint256 } from 'viem'

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
    it('prepares withdraw and claim transactions with gas subsidy on', async () => {
      jest.mocked(isGasSubsidizedForNetwork).mockReturnValue(true)
      const rewards = [
        {
          amount: '0.002',
          tokenInfo: mockArbArbTokenBalance,
        },
        {
          amount: '0.003',
          tokenInfo: mockToken,
        },
      ]
      const result = await prepareWithdrawAndClaimTransactions({
        amount: '5',
        token: mockToken,
        walletAddress: '0x1234',
        feeCurrencies: [mockFeeCurrency],
        rewards,
        poolTokenAddress: '0x5678',
      })

      const expectedTransactions = [
        {
          from: '0x1234',
          to: networkConfig.arbAavePoolV3ContractAddress,
          data: '0xencodedData',
        },
        {
          from: '0x1234',
          to: networkConfig.arbAaveIncentivesV3ContractAddress,
          data: '0xencodedData',
        },
        {
          from: '0x1234',
          to: networkConfig.arbAaveIncentivesV3ContractAddress,
          data: '0xencodedData',
        },
      ]
      expect(result).toEqual({
        type: 'possible',
        feeCurrency: mockFeeCurrency,
        transactions: expectedTransactions,
      })
      expect(encodeFunctionData).toHaveBeenCalledTimes(3)
      expect(encodeFunctionData).toHaveBeenCalledWith({
        abi: aavePool,
        functionName: 'withdraw',
        args: [mockTokenAddress, maxUint256, '0x1234'],
      })
      expect(encodeFunctionData).toHaveBeenCalledWith({
        abi: aaveIncentivesV3Abi,
        functionName: 'claimRewardsToSelf',
        args: [['0x5678'], BigInt(2e15), mockArbArbAddress],
      })
      expect(encodeFunctionData).toHaveBeenCalledWith({
        abi: aaveIncentivesV3Abi,
        functionName: 'claimRewardsToSelf',
        args: [['0x5678'], BigInt(3000), mockTokenAddress],
      })
      expect(prepareTransactions).toHaveBeenCalledWith({
        baseTransactions: expectedTransactions,
        feeCurrencies: [mockFeeCurrency],
        isGasSubsidized: true,
        origin: 'earn-withdraw',
      })
    })

    it('prepares only withdraw transaction if no rewards with gas subsidy off', async () => {
      const result = await prepareWithdrawAndClaimTransactions({
        amount: '5',
        token: mockToken,
        walletAddress: '0x1234',
        feeCurrencies: [mockFeeCurrency],
        rewards: [],
        poolTokenAddress: '0x5678',
      })

      const expectedTransactions = [
        {
          from: '0x1234',
          to: networkConfig.arbAavePoolV3ContractAddress,
          data: '0xencodedData',
        },
      ]
      expect(result).toEqual({
        type: 'possible',
        feeCurrency: mockFeeCurrency,
        transactions: expectedTransactions,
      })
      expect(encodeFunctionData).toHaveBeenCalledTimes(1)
      expect(encodeFunctionData).toHaveBeenCalledWith({
        abi: aavePool,
        functionName: 'withdraw',
        args: [mockTokenAddress, maxUint256, '0x1234'],
      })
      expect(prepareTransactions).toHaveBeenCalledWith({
        baseTransactions: expectedTransactions,
        feeCurrencies: [mockFeeCurrency],
        isGasSubsidized: false,
        origin: 'earn-withdraw',
      })
    })
  })
})

import BigNumber from 'bignumber.js'
import aaveIncentivesV3Abi from 'src/abis/AaveIncentivesV3'
import aavePool from 'src/abis/AavePoolV3'
import erc20 from 'src/abis/IERC20'
import { fetchSimulatedTransactions } from 'src/earn/fetchSimulatedTransactions'
import {
  prepareSupplyTransactions,
  prepareWithdrawAndClaimTransactions,
} from 'src/earn/prepareTransactions'
import { getDynamicConfigParams, getFeatureGate } from 'src/statsig'
import { StatsigDynamicConfigs, StatsigFeatureGates } from 'src/statsig/types'
import { TokenBalance } from 'src/tokens/slice'
import { Network, NetworkId } from 'src/transactions/types'
import { publicClient } from 'src/viem'
import { prepareTransactions } from 'src/viem/prepareTransactions'
import networkConfig from 'src/web3/networkConfig'
import { mockArbArbAddress, mockArbArbTokenBalance } from 'test/values'
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
jest.mock('src/earn/fetchSimulatedTransactions')

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
    jest.mocked(getDynamicConfigParams).mockImplementation(({ configName, defaultValues }) => {
      if (configName === StatsigDynamicConfigs.EARN_STABLECOIN_CONFIG) {
        return { ...defaultValues, depositGasPadding: 100, approveGasPadding: 200 }
      }
      return defaultValues
    })
    jest.mocked(getFeatureGate).mockImplementation((featureGate) => {
      if (featureGate === StatsigFeatureGates.SUBSIDIZE_STABLECOIN_EARN_GAS_FEES) {
        return false
      }
      throw new Error(`Unexpected feature gate: ${featureGate}`)
    })
    jest.mocked(fetchSimulatedTransactions).mockResolvedValue([
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
    ])
  })

  describe('prepareSupplyTransactions', () => {
    it('prepares transactions with approve and supply if not already approved', async () => {
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
          gas: BigInt(50100),
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
        isGasSubsidized: false,
      })
    })
    it('prepares fees from the cloud function for approve and supply when subsidizing gas fees', async () => {
      jest.mocked(getFeatureGate).mockImplementation((featureGate) => {
        if (featureGate === StatsigFeatureGates.SUBSIDIZE_STABLECOIN_EARN_GAS_FEES) {
          return true
        }
        throw new Error(`Unexpected feature gate: ${featureGate}`)
      })

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
          gas: BigInt(3200),
          _estimatedGasUse: BigInt(2800),
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
        isGasSubsidized: true,
      })
    })

    it('prepares transactions with supply if already approved', async () => {
      jest.spyOn(publicClient[Network.Arbitrum], 'readContract').mockResolvedValue(BigInt(5e6))
      jest.mocked(fetchSimulatedTransactions).mockResolvedValueOnce([
        {
          status: 'success',
          blockNumber: '1',
          gasNeeded: 50000,
          gasUsed: 49800,
          gasPrice: '1',
        },
      ])

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
          gas: BigInt(50100),
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
        isGasSubsidized: false,
      })
    })
  })

  describe('prepareWithdrawAndClaimTransactions', () => {
    it('prepares withdraw and claim transactions', async () => {
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
        args: [mockTokenAddress, BigInt(5e6), '0x1234'],
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
      })
    })

    it('prepares only withdraw transaction if no rewards', async () => {
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
        args: [mockTokenAddress, BigInt(5e6), '0x1234'],
      })
      expect(prepareTransactions).toHaveBeenCalledWith({
        baseTransactions: expectedTransactions,
        feeCurrencies: [mockFeeCurrency],
      })
    })
    describe('when gas fees are subsidized', () => {
      beforeEach(() => {
        jest.mocked(getDynamicConfigParams).mockImplementation(({ configName, defaultValues }) => {
          if (configName === StatsigDynamicConfigs.EARN_STABLECOIN_CONFIG) {
            return { ...defaultValues, withdrawGasPadding: 100, rewardsGasPadding: 200 }
          }
          return defaultValues
        })
        jest.mocked(getFeatureGate).mockImplementation((featureGate) => {
          if (featureGate === StatsigFeatureGates.SUBSIDIZE_STABLECOIN_EARN_GAS_FEES) {
            return true
          }
          throw new Error(`Unexpected feature gate: ${featureGate}`)
        })
      })
      it('prepares withdraw and claim transactions with gas fees added from the simulated transaction', async () => {
        jest.mocked(fetchSimulatedTransactions).mockResolvedValue([
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
            gasUsed: 49600,
            gasPrice: '1',
          },
          {
            status: 'success',
            blockNumber: '1',
            gasNeeded: 50000,
            gasUsed: 49600,
            gasPrice: '1',
          },
        ])
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
            gas: BigInt(3100),
            _estimatedGasUse: BigInt(2800),
          },
          {
            from: '0x1234',
            to: networkConfig.arbAaveIncentivesV3ContractAddress,
            data: '0xencodedData',
            gas: BigInt(50200),
            _estimatedGasUse: BigInt(49600),
          },
          {
            from: '0x1234',
            to: networkConfig.arbAaveIncentivesV3ContractAddress,
            data: '0xencodedData',
            gas: BigInt(50200),
            _estimatedGasUse: BigInt(49600),
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
          args: [mockTokenAddress, BigInt(5e6), '0x1234'],
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
        })
      })
      it('prepares only withdraw transaction if no rewards', async () => {
        jest.mocked(fetchSimulatedTransactions).mockResolvedValue([
          {
            status: 'success',
            blockNumber: '1',
            gasNeeded: 3000,
            gasUsed: 2800,
            gasPrice: '1',
          },
        ])
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
            gas: BigInt(3100),
            _estimatedGasUse: BigInt(2800),
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
          args: [mockTokenAddress, BigInt(5e6), '0x1234'],
        })
        expect(prepareTransactions).toHaveBeenCalledWith({
          baseTransactions: expectedTransactions,
          feeCurrencies: [mockFeeCurrency],
        })
      })
    })
  })
})

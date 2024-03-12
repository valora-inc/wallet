import { PayloadAction } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { EffectProviders, StaticProvider, dynamic } from 'redux-saga-test-plan/providers'
import { SwapEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getDynamicConfigParams } from 'src/statsig'
import { swapSubmitSaga } from 'src/swap/saga'
import { swapCancel, swapError, swapStart, swapSuccess } from 'src/swap/slice'
import { Field, SwapInfo } from 'src/swap/types'
import { Actions, addStandbyTransaction } from 'src/transactions/actions'
import { Network, NetworkId, TokenTransactionTypeV2 } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { publicClient } from 'src/viem'
import { ViemWallet } from 'src/viem/getLockableWallet'
import { getSerializablePreparedTransactions } from 'src/viem/preparedTransactionSerialization'
import { getViemWallet } from 'src/web3/contracts'
import networkConfig from 'src/web3/networkConfig'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { createMockStore } from 'test/utils'
import {
  mockAccount,
  mockCeloAddress,
  mockCeloTokenId,
  mockCeurAddress,
  mockCeurTokenId,
  mockCrealAddress,
  mockCrealTokenId,
  mockEthTokenId,
  mockTestTokenAddress,
  mockTestTokenTokenId,
  mockTokenBalances,
  mockUSDCAddress,
  mockUSDCTokenId,
  mockWBTCAddress,
  mockWBTCTokenId,
} from 'test/values'
import { Address, decodeFunctionData } from 'viem'
import { getTransactionCount } from 'viem/actions'

jest.mock('src/statsig')

const loggerErrorSpy = jest.spyOn(Logger, 'error')

jest.mock('src/transactions/types', () => {
  const originalModule = jest.requireActual('src/transactions/types')

  return {
    ...originalModule,
    newTransactionContext: jest.fn((tag, description) => ({
      id: `id-${tag}-${description}`,
      tag,
      description,
    })),
  }
})

const mockAllowanceTarget = '0xdef1c0ded9bec7f1a1670819833240f027b25eff'
const mockQuoteReceivedTimestamp = 1_000_000_000_000

const mockSwapFromParams = (toTokenId: string, feeCurrency?: Address): PayloadAction<SwapInfo> => {
  return {
    type: swapStart.type,
    payload: {
      swapId: 'test-swap-id',
      userInput: {
        updatedField: Field.TO,
        fromTokenId: mockCeurTokenId,
        toTokenId,
        swapAmount: {
          [Field.FROM]: '100',
          [Field.TO]: '200',
        },
      },
      quote: {
        preparedTransactions: getSerializablePreparedTransactions([
          {
            from: mockAccount,
            to: mockCeurAddress as Address,
            value: BigInt(0),
            data: '0x0',
            gas: BigInt(59_480),
            maxFeePerGas: BigInt(12_000_000_000),
            _baseFeePerGas: BigInt(6_000_000_000),
            feeCurrency,
          },
          {
            from: mockAccount,
            to: mockAllowanceTarget,
            value: BigInt(0),
            data: '0x0',
            gas: BigInt(1_325_000),
            maxFeePerGas: BigInt(12_000_000_000),
            _baseFeePerGas: BigInt(6_000_000_000),
            feeCurrency,
          },
        ]),
        price: '1',
        provider: '0x',
        estimatedPriceImpact: '0.1',
        allowanceTarget: mockAllowanceTarget,
        receivedAt: mockQuoteReceivedTimestamp,
      },
      areSwapTokensShuffled: false,
    },
  }
}

const mockSwap = mockSwapFromParams(mockCeloTokenId)
const mockSwapToImportedToken = mockSwapFromParams(mockTestTokenTokenId)

const mockSwapEthereum: PayloadAction<SwapInfo> = {
  type: swapStart.type,
  payload: {
    swapId: 'test-swap-id',
    userInput: {
      updatedField: Field.TO,
      fromTokenId: mockUSDCTokenId,
      toTokenId: mockEthTokenId,
      swapAmount: {
        [Field.FROM]: '100',
        [Field.TO]: '200',
      },
    },
    quote: {
      preparedTransactions: getSerializablePreparedTransactions([
        {
          from: mockAccount,
          to: mockUSDCAddress as Address,
          value: BigInt(0),
          data: '0x0',
          gas: BigInt(59_480),
          maxFeePerGas: BigInt(12_000_000_000),
          _baseFeePerGas: BigInt(6_000_000_000),
        },
        {
          from: mockAccount,
          to: mockAllowanceTarget,
          value: BigInt(0),
          data: '0x0',
          gas: BigInt(1_325_000),
          maxFeePerGas: BigInt(12_000_000_000),
          _baseFeePerGas: BigInt(6_000_000_000),
        },
      ]),
      price: '1',
      provider: '0x',
      estimatedPriceImpact: '0.1',
      allowanceTarget: mockAllowanceTarget,
      receivedAt: mockQuoteReceivedTimestamp,
    },
    areSwapTokensShuffled: false,
  },
}

const mockSwapWithNativeSellToken: PayloadAction<SwapInfo> = {
  ...mockSwap,
  payload: {
    ...mockSwap.payload,
    quote: {
      ...mockSwap.payload.quote,
      preparedTransactions: getSerializablePreparedTransactions([
        {
          from: mockAccount,
          to: mockAllowanceTarget,
          value: BigInt(0),
          data: '0x0',
          gas: BigInt(1_325_000),
          maxFeePerGas: BigInt(12_000_000_000),
          _baseFeePerGas: BigInt(6_000_000_000),
        },
      ]),
    },
  },
}

const mockSwapWithWBTCBuyToken: PayloadAction<SwapInfo> = {
  ...mockSwap,
  payload: {
    ...mockSwap.payload,
    userInput: {
      ...mockSwap.payload.userInput,
      toTokenId: mockWBTCTokenId,
    },
  },
}

const store = createMockStore({
  tokens: {
    tokenBalances: {
      [mockCeurTokenId]: {
        ...mockTokenBalances[mockCeurTokenId],
        priceUsd: '1',
        balance: '10',
      },
      [mockCeloTokenId]: {
        ...mockTokenBalances[mockCeloTokenId],
        priceUsd: '0.5',
        balance: '10',
      },
      [mockWBTCTokenId]: {
        ...mockTokenBalances[mockCeloTokenId], // these values don't matter
        address: mockWBTCAddress,
        tokenId: mockWBTCTokenId,
        symbol: 'WBTC',
        name: 'Wrapped BTC',
        decimals: 6,
      },
      [mockUSDCTokenId]: {
        name: 'USDC coin',
        networkId: NetworkId['ethereum-sepolia'],
        tokenId: mockUSDCTokenId,
        address: mockUSDCAddress,
        symbol: 'USDC',
        decimals: 18,
        imageUrl: '',
        balance: '10',
        priceUsd: '1',
        priceFetchedAt: Date.now(),
      },
      [mockEthTokenId]: {
        ...mockTokenBalances[mockEthTokenId],
        priceUsd: '0.5',
        balance: '10',
      },
      [mockCrealTokenId]: {
        ...mockTokenBalances[mockCrealTokenId],
        priceUsd: '0.5',
        balance: '10',
      },
      [mockTestTokenTokenId]: {
        ...mockTokenBalances[mockTestTokenTokenId],
        priceUsd: '0.1',
        address: mockTestTokenAddress,
        tokenId: mockTestTokenTokenId,
        networkId: NetworkId['celo-alfajores'],
        symbol: 'TT',
        name: 'Imported Token',
        decimals: 18,
        balance: '5',
        isManuallyImported: true,
      },
    },
  },
})

beforeEach(() => {
  jest.clearAllMocks()
})

afterEach(() => {
  jest.spyOn(Date, 'now').mockRestore()
})

describe(swapSubmitSaga, () => {
  let sendCallCount = 0
  const mockViemWallet = {
    account: { address: mockAccount },
    signTransaction: jest.fn(),
    sendRawTransaction: jest.fn(async () => {
      return `0x${++sendCallCount}`
    }),
  } as any as ViemWallet

  const mockSwapTxReceipt = {
    status: 'success',
    blockNumber: BigInt(1234),
    transactionHash: '0x2',
    cumulativeGasUsed: BigInt(3_899_547),
    effectiveGasPrice: BigInt(5_000_000_000),
    gasUsed: BigInt(371_674),
  }
  const mockApproveTxReceipt = {
    status: 'success',
    blockNumber: BigInt(1234),
    transactionHash: '0x1',
    cumulativeGasUsed: BigInt(3_129_217),
    effectiveGasPrice: BigInt(5_000_000_000),
    gasUsed: BigInt(51_578),
  }

  function createDefaultProviders(network: Network) {
    let callCount = 0
    const defaultProviders: (EffectProviders | StaticProvider)[] = [
      [matchers.call(getViemWallet, networkConfig.viemChain[network]), mockViemWallet],
      [matchers.call.fn(getTransactionCount), 10],
      [matchers.call.fn(getConnectedUnlockedAccount), mockAccount],
      [
        matchers.call.fn(publicClient[network].waitForTransactionReceipt),
        dynamic(() => {
          callCount += 1
          return callCount > 1 ? mockSwapTxReceipt : mockApproveTxReceipt
        }),
      ],
      [matchers.call.fn(publicClient[network].getBlock), { timestamp: 1701102971 }],
      [
        matchers.call.fn(decodeFunctionData),
        { functionName: 'approve', args: ['0xspenderAddress', BigInt(1e18)] },
      ],
    ]

    return defaultProviders
  }

  beforeEach(() => {
    sendCallCount = 0
    jest.mocked(getDynamicConfigParams).mockReturnValue({
      showSwap: ['celo-alfajores', 'ethereum-sepolia'],
    })
  })

  const testCases = [
    {
      network: Network.Celo,
      networkId: NetworkId['celo-alfajores'],
      fromTokenId: mockCeurTokenId,
      fromTokenAddress: mockCeurAddress,
      toTokenId: mockCeloTokenId,
      toTokenAddress: mockCeloAddress,
      feeCurrencyId: mockCeloTokenId,
      feeCurrencySymbol: 'CELO',
      swapPrepared: mockSwap,
    },
    {
      network: Network.Celo,
      networkId: NetworkId['celo-alfajores'],
      fromTokenId: mockCeurTokenId,
      fromTokenAddress: mockCeurAddress,
      toTokenId: mockCeloTokenId,
      toTokenAddress: mockCeloAddress,
      feeCurrencyAddress: mockCrealAddress,
      feeCurrencyId: mockCrealTokenId,
      feeCurrencySymbol: 'cREAL',
      swapPrepared: mockSwapFromParams(mockCeloTokenId, mockCrealAddress as Address),
    },
    {
      network: Network.Ethereum,
      networkId: NetworkId['ethereum-sepolia'],
      fromTokenId: mockUSDCTokenId,
      fromTokenAddress: mockUSDCAddress,
      toTokenId: mockEthTokenId,
      toTokenAddress: null,
      feeCurrencyId: mockEthTokenId,
      feeCurrencySymbol: 'ETH',
      swapPrepared: mockSwapEthereum,
    },
  ]

  it.each(testCases)(
    'should complete swap on $network with $feeCurrencySymbol as feeCurrency',
    async ({
      network,
      networkId,
      fromTokenId,
      fromTokenAddress,
      toTokenId,
      toTokenAddress,
      feeCurrencyAddress,
      feeCurrencyId,
      feeCurrencySymbol,
      swapPrepared,
    }) => {
      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(mockQuoteReceivedTimestamp + 2_500) // swap submitted timestamp
        .mockReturnValue(mockQuoteReceivedTimestamp + 10_000) // before send swap timestamp

      await expectSaga(swapSubmitSaga, swapPrepared)
        .withState(store.getState())
        .provide(createDefaultProviders(network))
        .put(swapSuccess({ swapId: 'test-swap-id', fromTokenId, toTokenId }))
        .put(
          addStandbyTransaction({
            context: {
              id: 'id-swap/saga-Swap/Approve',
              tag: 'swap/saga',
              description: 'Swap/Approve',
            },
            __typename: 'TokenApproval',
            networkId,
            type: TokenTransactionTypeV2.Approval,
            transactionHash: mockApproveTxReceipt.transactionHash,
            tokenId: fromTokenId,
            approvedAmount: '1',
            feeCurrencyId,
          })
        )
        .put(
          addStandbyTransaction({
            context: {
              id: 'id-swap/saga-Swap/Execute',
              tag: 'swap/saga',
              description: 'Swap/Execute',
            },
            __typename: 'TokenExchangeV3',
            networkId,
            type: TokenTransactionTypeV2.SwapTransaction,
            inAmount: {
              value: swapPrepared.payload.userInput.swapAmount[Field.TO],
              tokenId: toTokenId,
            },
            outAmount: {
              value: swapPrepared.payload.userInput.swapAmount[Field.FROM],
              tokenId: fromTokenId,
            },
            transactionHash: mockSwapTxReceipt.transactionHash,
            feeCurrencyId,
          })
        )
        .call([publicClient[network], 'waitForTransactionReceipt'], { hash: '0x1' })
        .call([publicClient[network], 'waitForTransactionReceipt'], { hash: '0x2' })
        .run()

      expect(mockViemWallet.signTransaction).toHaveBeenCalledTimes(2)
      expect(mockViemWallet.sendRawTransaction).toHaveBeenCalledTimes(2)
      expect(loggerErrorSpy).not.toHaveBeenCalled()
      expect(navigate).toHaveBeenCalledWith(Screens.WalletHome)

      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(SwapEvents.swap_execute_success, {
        toToken: toTokenAddress,
        toTokenId: toTokenId,
        toTokenNetworkId: networkId,
        toTokenIsImported: false,
        fromToken: fromTokenAddress,
        fromTokenId: fromTokenId,
        fromTokenNetworkId: networkId,
        fromTokenIsImported: false,
        amount: swapPrepared.payload.userInput.swapAmount[Field.TO],
        amountType: 'buyAmount',
        price: '1',
        allowanceTarget: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
        estimatedPriceImpact: '0.1',
        provider: '0x',
        fromTokenBalance: '10000000000000000000',
        swapApproveTxId: 'id-swap/saga-Swap/Approve',
        swapExecuteTxId: 'id-swap/saga-Swap/Execute',
        quoteToUserConfirmsSwapElapsedTimeInMs: 2_500,
        quoteToTransactionElapsedTimeInMs: 10_000,
        estimatedBuyTokenUsdValue: 100,
        estimatedSellTokenUsdValue: 100,
        web3Library: 'viem',
        gas: 1384480,
        maxGasFee: 0.01661376,
        maxGasFeeUsd: 0.00830688,
        estimatedGasFee: 0.00830688,
        estimatedGasFeeUsd: 0.00415344,
        gasUsed: 423252,
        gasFee: 0.00211626,
        gasFeeUsd: 0.00105813,
        feeCurrency: feeCurrencyAddress,
        feeCurrencySymbol,
        txCount: 2,
        approveTxCumulativeGasUsed: 3_129_217,
        approveTxEffectiveGasPrice: 5_000_000_000,
        approveTxFeeCurrency: feeCurrencyAddress,
        approveTxFeeCurrencySymbol: feeCurrencySymbol,
        approveTxGas: 59_480,
        approveTxMaxGasFee: 0.00071376,
        approveTxMaxGasFeeUsd: 0.00035688,
        approveTxEstimatedGasFee: 0.00035688,
        approveTxEstimatedGasFeeUsd: 0.00017844,
        approveTxGasUsed: 51_578,
        approveTxGasFee: 0.00025789,
        approveTxGasFeeUsd: 0.000128945,
        approveTxHash: '0x1',
        swapTxCumulativeGasUsed: 3_899_547,
        swapTxEffectiveGasPrice: 5_000_000_000,
        swapTxFeeCurrency: feeCurrencyAddress,
        swapTxFeeCurrencySymbol: feeCurrencySymbol,
        swapTxGas: 1_325_000,
        swapTxMaxGasFee: 0.0159,
        swapTxMaxGasFeeUsd: 0.00795,
        swapTxEstimatedGasFee: 0.00795,
        swapTxEstimatedGasFeeUsd: 0.003975,
        swapTxGasUsed: 371_674,
        swapTxGasFee: 0.00185837,
        swapTxGasFeeUsd: 0.000929185,
        swapTxHash: '0x2',
        areSwapTokensShuffled: false,
      })

      const analyticsProps = (ValoraAnalytics.track as jest.Mock).mock.calls[0][1]
      expect(analyticsProps.gas).toBeCloseTo(
        analyticsProps.approveTxGas + analyticsProps.swapTxGas,
        8
      )
      expect(analyticsProps.maxGasFee).toBeCloseTo(
        analyticsProps.approveTxMaxGasFee + analyticsProps.swapTxMaxGasFee,
        8
      )
      expect(analyticsProps.maxGasFeeUsd).toBeCloseTo(
        analyticsProps.approveTxMaxGasFeeUsd + analyticsProps.swapTxMaxGasFeeUsd,
        8
      )
      expect(analyticsProps.gasUsed).toBeCloseTo(
        analyticsProps.approveTxGasUsed + analyticsProps.swapTxGasUsed,
        8
      )
      expect(analyticsProps.gasFee).toBeCloseTo(
        analyticsProps.approveTxGasFee + analyticsProps.swapTxGasFee,
        8
      )
      expect(analyticsProps.gasFeeUsd).toBeCloseTo(
        analyticsProps.approveTxGasFeeUsd + analyticsProps.swapTxGasFeeUsd,
        8
      )
    }
  )

  it('should complete swap without approval for native sell token', async () => {
    await expectSaga(swapSubmitSaga, mockSwapWithNativeSellToken)
      .withState(store.getState())
      .provide(createDefaultProviders(Network.Celo))
      .put(
        swapSuccess({
          swapId: 'test-swap-id',
          fromTokenId: mockCeurTokenId,
          toTokenId: mockCeloTokenId,
        })
      )
      .put(
        addStandbyTransaction({
          context: {
            id: 'id-swap/saga-Swap/Execute',
            tag: 'swap/saga',
            description: 'Swap/Execute',
          },
          __typename: 'TokenExchangeV3',
          networkId: NetworkId['celo-alfajores'],
          type: TokenTransactionTypeV2.SwapTransaction,
          inAmount: {
            value: mockSwapWithNativeSellToken.payload.userInput.swapAmount[Field.TO],
            tokenId: mockCeloTokenId,
          },
          outAmount: {
            value: mockSwapWithNativeSellToken.payload.userInput.swapAmount[Field.FROM],
            tokenId: mockCeurTokenId,
          },
          transactionHash: '0x1',
          feeCurrencyId: mockCeloTokenId,
        })
      )
      .not.put.like({
        action: {
          type: Actions.ADD_STANDBY_TRANSACTION,
          transaction: {
            __typename: 'TokenApproval',
          },
        },
      })
      .call([publicClient.celo, 'waitForTransactionReceipt'], { hash: '0x1' })
      .run()

    expect(mockViemWallet.signTransaction).toHaveBeenCalledTimes(1)
    expect(mockViemWallet.sendRawTransaction).toHaveBeenCalledTimes(1)
    expect(loggerErrorSpy).not.toHaveBeenCalled()
    expect(navigate).toHaveBeenCalledWith(Screens.WalletHome)
  })

  it('should display the correct standby values for a swap with different decimals', async () => {
    await expectSaga(swapSubmitSaga, mockSwapWithWBTCBuyToken)
      .withState(store.getState())
      .provide(createDefaultProviders(Network.Celo))
      .put(
        addStandbyTransaction({
          context: {
            id: 'id-swap/saga-Swap/Approve',
            tag: 'swap/saga',
            description: 'Swap/Approve',
          },
          __typename: 'TokenApproval',
          networkId: NetworkId['celo-alfajores'],
          type: TokenTransactionTypeV2.Approval,
          transactionHash: mockApproveTxReceipt.transactionHash,
          tokenId: mockCeurTokenId,
          approvedAmount: '1',
          feeCurrencyId: mockCeloTokenId,
        })
      )
      .put(
        addStandbyTransaction({
          context: {
            id: 'id-swap/saga-Swap/Execute',
            tag: 'swap/saga',
            description: 'Swap/Execute',
          },
          __typename: 'TokenExchangeV3',
          networkId: NetworkId['celo-alfajores'],
          type: TokenTransactionTypeV2.SwapTransaction,
          inAmount: {
            value: mockSwapWithWBTCBuyToken.payload.userInput.swapAmount[Field.TO],
            tokenId: mockWBTCTokenId,
          },
          outAmount: {
            value: mockSwapWithWBTCBuyToken.payload.userInput.swapAmount[Field.FROM],
            tokenId: mockCeurTokenId,
          },
          transactionHash: mockSwapTxReceipt.transactionHash,
          feeCurrencyId: mockCeloTokenId,
        })
      )
      .run()
  })

  it('should track correctly the imported tokens', async () => {
    jest
      .spyOn(Date, 'now')
      .mockReturnValueOnce(mockQuoteReceivedTimestamp + 2_500) // swap submitted timestamp
      .mockReturnValue(mockQuoteReceivedTimestamp + 10_000) // before send swap timestamp

    await expectSaga(swapSubmitSaga, mockSwapToImportedToken)
      .withState(store.getState())
      .provide(createDefaultProviders(Network.Celo))
      .put(
        swapSuccess({
          swapId: 'test-swap-id',
          fromTokenId: mockCeurTokenId,
          toTokenId: mockTestTokenTokenId,
        })
      )
      .run()

    expect(mockViemWallet.signTransaction).toHaveBeenCalledTimes(2)
    expect(mockViemWallet.sendRawTransaction).toHaveBeenCalledTimes(2)
    expect(loggerErrorSpy).not.toHaveBeenCalled()
    expect(navigate).toHaveBeenCalledWith(Screens.WalletHome)

    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenLastCalledWith(
      SwapEvents.swap_execute_success,
      expect.objectContaining({ fromTokenIsImported: false, toTokenIsImported: true })
    )
  })

  it('should set swap state correctly on error', async () => {
    jest
      .spyOn(Date, 'now')
      .mockReturnValueOnce(mockQuoteReceivedTimestamp + 2_500) // swap submitted timestamp
      .mockReturnValue(mockQuoteReceivedTimestamp + 10_000) // before send swap timestamp

    jest.mocked(mockViemWallet.sendRawTransaction).mockImplementationOnce(() => {
      throw new Error('fake error')
    })
    await expectSaga(swapSubmitSaga, mockSwap)
      .withState(store.getState())
      .provide(createDefaultProviders(Network.Celo))
      .put(swapError('test-swap-id'))
      .run()
    expect(navigate).not.toHaveBeenCalled()
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SwapEvents.swap_execute_error, {
      error: 'fake error',
      toToken: mockCeloAddress,
      toTokenId: mockCeloTokenId,
      toTokenNetworkId: NetworkId['celo-alfajores'],
      toTokenIsImported: false,
      fromToken: mockCeurAddress,
      fromTokenId: mockCeurTokenId,
      fromTokenNetworkId: NetworkId['celo-alfajores'],
      fromTokenIsImported: false,
      amount: mockSwap.payload.userInput.swapAmount[Field.TO],
      amountType: 'buyAmount',
      price: '1',
      allowanceTarget: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
      estimatedPriceImpact: '0.1',
      provider: '0x',
      fromTokenBalance: '10000000000000000000',
      swapApproveTxId: 'id-swap/saga-Swap/Approve',
      swapExecuteTxId: 'id-swap/saga-Swap/Execute',
      quoteToUserConfirmsSwapElapsedTimeInMs: 2_500,
      quoteToTransactionElapsedTimeInMs: 10_000,
      estimatedBuyTokenUsdValue: 100,
      estimatedSellTokenUsdValue: 100,
      web3Library: 'viem',
      gas: 1384480,
      maxGasFee: 0.01661376,
      maxGasFeeUsd: 0.00830688,
      estimatedGasFee: 0.00830688,
      estimatedGasFeeUsd: 0.00415344,
      gasUsed: undefined,
      gasFee: undefined,
      gasFeeUsd: undefined,
      feeCurrency: undefined,
      feeCurrencySymbol: 'CELO',
      txCount: 2,
      // Most of these values are undefined because we didn't get a tx receipt
      approveTxCumulativeGasUsed: undefined,
      approveTxEffectiveGasPrice: undefined,
      approveTxFeeCurrency: undefined,
      approveTxFeeCurrencySymbol: 'CELO',
      approveTxGas: 59_480,
      approveTxMaxGasFee: 0.00071376,
      approveTxMaxGasFeeUsd: 0.00035688,
      approveTxEstimatedGasFee: 0.00035688,
      approveTxEstimatedGasFeeUsd: 0.00017844,
      approveTxGasUsed: undefined,
      approveTxGasFee: undefined,
      approveTxGasFeeUsd: undefined,
      approveTxHash: undefined,
      swapTxCumulativeGasUsed: undefined,
      swapTxEffectiveGasPrice: undefined,
      swapTxFeeCurrency: undefined,
      swapTxFeeCurrencySymbol: 'CELO',
      swapTxGas: 1_325_000,
      swapTxMaxGasFee: 0.0159,
      swapTxMaxGasFeeUsd: 0.00795,
      swapTxEstimatedGasFee: 0.00795,
      swapTxEstimatedGasFeeUsd: 0.003975,
      swapTxGasUsed: undefined,
      swapTxGasFee: undefined,
      swapTxGasFeeUsd: undefined,
      swapTxHash: undefined,
      areSwapTokensShuffled: false,
    })
    const analyticsProps = (ValoraAnalytics.track as jest.Mock).mock.calls[0][1]
    expect(analyticsProps.gas).toBeCloseTo(
      analyticsProps.approveTxGas + analyticsProps.swapTxGas,
      8
    )
    expect(analyticsProps.maxGasFee).toBeCloseTo(
      analyticsProps.approveTxMaxGasFee + analyticsProps.swapTxMaxGasFee,
      8
    )
    expect(analyticsProps.maxGasFeeUsd).toBeCloseTo(
      analyticsProps.approveTxMaxGasFeeUsd + analyticsProps.swapTxMaxGasFeeUsd,
      8
    )
  })

  it('should set swap state correctly when PIN input is cancelled', async () => {
    // In reality it's not this method that throws this error, but it's the easiest way to test for now
    jest.mocked(mockViemWallet.sendRawTransaction).mockImplementationOnce(() => {
      throw 'CANCELLED_PIN_INPUT'
    })
    await expectSaga(swapSubmitSaga, mockSwap)
      .withState(store.getState())
      .provide(createDefaultProviders(Network.Celo))
      .put(swapCancel('test-swap-id'))
      .not.put(swapError('test-swap-id'))
      .run()
    expect(navigate).not.toHaveBeenCalled()
    expect(ValoraAnalytics.track).not.toHaveBeenCalled()
  })

  it('should track swap result for a user in the swap tokens order holdout group', async () => {
    jest.mocked(mockViemWallet.sendRawTransaction).mockImplementationOnce(() => {
      throw new Error('some error')
    })

    await expectSaga(swapSubmitSaga, {
      ...mockSwap,
      payload: { ...mockSwap.payload, areSwapTokensShuffled: true },
    })
      .withState(store.getState())
      .provide(createDefaultProviders(Network.Celo))
      .run()

    expect(ValoraAnalytics.track).toHaveBeenLastCalledWith(
      SwapEvents.swap_execute_error,
      expect.objectContaining({ areSwapTokensShuffled: true })
    )

    await expectSaga(swapSubmitSaga, {
      ...mockSwap,
      payload: { ...mockSwap.payload, areSwapTokensShuffled: true },
    })
      .withState(store.getState())
      .provide(createDefaultProviders(Network.Celo))
      .run()

    expect(ValoraAnalytics.track).toHaveBeenLastCalledWith(
      SwapEvents.swap_execute_success,
      expect.objectContaining({ areSwapTokensShuffled: true })
    )
  })
})

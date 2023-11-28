import { PayloadAction } from '@reduxjs/toolkit'
import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { EffectProviders, StaticProvider } from 'redux-saga-test-plan/providers'
import { call, select } from 'redux-saga/effects'
import { SwapEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { swapSubmitPreparedSaga, swapSubmitSaga } from 'src/swap/saga'
import { swapApprove, swapError, swapExecute, swapPriceChange } from 'src/swap/slice'
import { Field, SwapInfo, SwapInfoPrepared, SwapTransaction } from 'src/swap/types'
import { getERC20TokenContract } from 'src/tokens/saga'
import { Actions, removeStandbyTransaction } from 'src/transactions/actions'
import { sendTransaction } from 'src/transactions/send'
import { NetworkId, TokenTransactionTypeV2, TransactionStatus } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { publicClient } from 'src/viem'
import { ViemWallet } from 'src/viem/getLockableWallet'
import { getSerializablePreparedTransactions } from 'src/viem/preparedTransactionSerialization'
import { getContractKit, getViemWallet } from 'src/web3/contracts'
import { UnlockResult, getConnectedUnlockedAccount, unlockAccount } from 'src/web3/saga'
import { walletAddressSelector } from 'src/web3/selectors'
import { createMockStore } from 'test/utils'
import {
  mockAccount,
  mockCeloAddress,
  mockCeloTokenId,
  mockCeurAddress,
  mockCeurTokenId,
  mockContract,
  mockTokenBalances,
  mockWBTCAddress,
  mockWBTCTokenId,
} from 'test/values'
import { Address, zeroAddress } from 'viem'
import { getTransactionCount } from 'viem/actions'

const loggerErrorSpy = jest.spyOn(Logger, 'error')

const contractKit = {
  getWallet: jest.fn(),
  getAccounts: jest.fn(),
  connection: {
    chainId: jest.fn(() => '42220'),
    nonce: jest.fn(),
    gasPrice: jest.fn(),
  },
}

jest.mock('src/transactions/send', () => ({
  sendTransaction: jest.fn(() => ({
    transactionHash: '0x123',
    blockNumber: '1234',
    status: true,
    effectiveGasPrice: 5_000_000_000,
    gasUsed: 371_674,
  })),
}))

const mockSwapTransaction: SwapTransaction = {
  buyAmount: '10000000000000000',
  sellAmount: '10000000000000000',
  buyTokenAddress: mockCeloAddress,
  sellTokenAddress: mockCeurAddress,
  price: '1',
  guaranteedPrice: '1.02',
  from: '0x078e54ad49b0865fff9086fd084b92b3dac0857d',
  gas: '460533',
  allowanceTarget: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
  estimatedPriceImpact: '0.1',
} as SwapTransaction // there are lots fields in this type that are not needed for testing

const mockQuoteReceivedTimestamp = 1_000_000_000_000

const mockSwap: PayloadAction<SwapInfo> = {
  type: 'swap/swapStart',
  payload: {
    approveTransaction: {
      gas: '59480',
      from: mockAccount,
      chainId: 42220,
      data: '0x0',
      to: '0xabc',
    },
    userInput: {
      updatedField: Field.TO,
      fromTokenId: mockCeurTokenId,
      toTokenId: mockCeloTokenId,
      swapAmount: {
        [Field.FROM]: '100',
        [Field.TO]: '200',
      },
    },
    unvalidatedSwapTransaction: {
      ...mockSwapTransaction,
    },
    details: {
      swapProvider: '0x',
    },
    quoteReceivedAt: mockQuoteReceivedTimestamp,
  },
}

const mockSwapPrepared: PayloadAction<SwapInfoPrepared> = {
  type: 'swap/swapStartPrepared',
  payload: {
    userInput: {
      updatedField: Field.TO,
      fromTokenId: mockCeurTokenId,
      toTokenId: mockCeloTokenId,
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
        },
        {
          from: mockAccount,
          to: mockSwapTransaction.allowanceTarget as Address,
          value: BigInt(0),
          data: '0x0',
          gas: BigInt(1_325_000),
          maxFeePerGas: BigInt(12_000_000_000),
        },
      ]),
      rawSwapResponse: {
        approveTransaction: {
          gas: '59480',
          from: mockAccount,
          chainId: 42220,
          data: '0x0',
          to: '0xabc',
        },
        unvalidatedSwapTransaction: {
          ...mockSwapTransaction,
        },
        details: {
          swapProvider: '0x',
        },
      },
      receivedAt: mockQuoteReceivedTimestamp,
    },
  },
}

const mockSwapWithNativeSellToken: PayloadAction<SwapInfo> = {
  ...mockSwap,
  payload: {
    ...mockSwap.payload,
    unvalidatedSwapTransaction: {
      ...mockSwap.payload.unvalidatedSwapTransaction,
      allowanceTarget: zeroAddress,
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
    unvalidatedSwapTransaction: {
      ...mockSwap.payload.unvalidatedSwapTransaction,
      buyTokenAddress: mockWBTCAddress,
    },
  },
}

const mockSwapPreparedWithNativeSellToken: PayloadAction<SwapInfoPrepared> = {
  ...mockSwapPrepared,
  payload: {
    ...mockSwapPrepared.payload,
    quote: {
      ...mockSwapPrepared.payload.quote,
      preparedTransactions: getSerializablePreparedTransactions([
        {
          from: mockAccount,
          to: mockSwapTransaction.allowanceTarget as Address,
          value: BigInt(0),
          data: '0x0',
          gas: BigInt(1_325_000),
          maxFeePerGas: BigInt(12_000_000_000),
        },
      ]),
      rawSwapResponse: {
        ...mockSwapPrepared.payload.quote.rawSwapResponse,
        unvalidatedSwapTransaction: {
          ...mockSwapPrepared.payload.quote.rawSwapResponse.unvalidatedSwapTransaction,
          allowanceTarget: zeroAddress,
        },
      },
    },
  },
}

const mockSwapPreparedWithWBTCBuyToken: PayloadAction<SwapInfoPrepared> = {
  ...mockSwapPrepared,
  payload: {
    ...mockSwapPrepared.payload,
    userInput: {
      ...mockSwapPrepared.payload.userInput,
      toTokenId: mockWBTCTokenId,
    },
    quote: {
      ...mockSwapPrepared.payload.quote,
      rawSwapResponse: {
        ...mockSwapPrepared.payload.quote.rawSwapResponse,
        unvalidatedSwapTransaction: {
          ...mockSwapPrepared.payload.quote.rawSwapResponse.unvalidatedSwapTransaction,
          buyTokenAddress: mockWBTCAddress,
        },
      },
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
  const defaultProviders: (EffectProviders | StaticProvider)[] = [
    [select(walletAddressSelector), mockAccount],
    [call(getContractKit), contractKit],
    [call(getConnectedUnlockedAccount), mockAccount],
    [
      call(getERC20TokenContract, mockSwap.payload.unvalidatedSwapTransaction.sellTokenAddress),
      mockContract,
    ],
  ]

  it('should complete swap', async () => {
    jest
      .spyOn(Date, 'now')
      .mockReturnValueOnce(mockQuoteReceivedTimestamp + 2_500) // swap submitted timestamp
      .mockReturnValue(mockQuoteReceivedTimestamp + 10_000) // before send swap timestamp

    await expectSaga(swapSubmitSaga, mockSwap)
      .withState(store.getState())
      .provide(defaultProviders)
      .put(swapApprove())
      .put(swapExecute())
      .put.like({
        action: {
          type: Actions.ADD_STANDBY_TRANSACTION,
          transaction: {
            __typename: 'TokenExchangeV3',
            type: TokenTransactionTypeV2.SwapTransaction,
            inAmount: {
              value: BigNumber('0.0102'), // guaranteedPrice * sellAmount
              tokenId: mockCeloTokenId,
            },
            outAmount: {
              value: BigNumber('0.01'),
              tokenId: mockCeurTokenId,
            },
          },
        },
      })
      .put.like({
        action: {
          type: Actions.TRANSACTION_CONFIRMED,
          receipt: {
            transactionHash: '0x123',
            block: '1234',
            status: TransactionStatus.Complete,
          },
        },
      })
      .run()
    expect(sendTransaction).toHaveBeenCalledTimes(2)
    expect(loggerErrorSpy).not.toHaveBeenCalled()

    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SwapEvents.swap_execute_success, {
      toToken: mockCeloAddress,
      toTokenId: mockCeloTokenId,
      toTokenNetworkId: NetworkId['celo-alfajores'],
      fromToken: mockCeurAddress,
      fromTokenId: mockCeurTokenId,
      fromTokenNetworkId: NetworkId['celo-alfajores'],
      amount: '10000000000000000',
      amountType: 'buyAmount',
      price: '1',
      allowanceTarget: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
      estimatedPriceImpact: '0.1',
      provider: '0x',
      fromTokenBalance: '10000000000000000000',
      swapApproveTxId: 'a uuid',
      swapExecuteTxId: 'a uuid',
      quoteToUserConfirmsSwapElapsedTimeInMs: 2_500,
      quoteToTransactionElapsedTimeInMs: 10_000,
      estimatedBuyTokenUsdValue: 0.005,
      estimatedSellTokenUsdValue: 0.01,
      web3Library: 'contract-kit',
    })
  })

  it('should display the correct standby values for a swap with different decimals', async () => {
    await expectSaga(swapSubmitSaga, mockSwapWithWBTCBuyToken)
      .withState(store.getState())
      .provide(defaultProviders)
      .put.like({
        action: {
          type: Actions.ADD_STANDBY_TRANSACTION,
          transaction: {
            __typename: 'TokenExchangeV3',
            type: TokenTransactionTypeV2.SwapTransaction,
            inAmount: {
              value: BigNumber('0.0102'), // guaranteedPrice * sellAmount
              tokenId: mockWBTCTokenId,
            },
            outAmount: {
              value: BigNumber('0.01'),
              tokenId: mockCeurTokenId,
            },
          },
        },
      })
      .run()
  })

  it('should complete swap without approval for native sell token', async () => {
    await expectSaga(swapSubmitSaga, mockSwapWithNativeSellToken)
      .withState(store.getState())
      .provide(defaultProviders)
      .not.put(swapApprove())
      .put(swapExecute())
      .put.like({
        action: {
          type: Actions.ADD_STANDBY_TRANSACTION,
          transaction: {
            __typename: 'TokenExchangeV3',
            type: TokenTransactionTypeV2.SwapTransaction,
            inAmount: {
              value: BigNumber('0.0102'), // guaranteedPrice * sellAmount
              tokenId: mockCeloTokenId,
            },
            outAmount: {
              value: BigNumber('0.01'),
              tokenId: mockCeurTokenId,
            },
          },
        },
      })
      .run()

    expect(sendTransaction).toHaveBeenCalledTimes(1)
    expect(loggerErrorSpy).not.toHaveBeenCalled()
  })

  it('should set swap state correctly on error', async () => {
    jest.spyOn(Date, 'now').mockReturnValueOnce(mockQuoteReceivedTimestamp + 30_000) // swap submitted timestamp
    jest.mocked(sendTransaction).mockImplementationOnce(() => {
      throw new Error('fake error')
    })
    await expectSaga(swapSubmitSaga, mockSwap)
      .withState(store.getState())
      .provide(defaultProviders)
      .put(swapApprove())
      .put(swapError())
      .put(removeStandbyTransaction('a uuid'))
      .run()
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SwapEvents.swap_execute_error, {
      error: 'fake error',
      toToken: mockCeloAddress,
      toTokenId: mockCeloTokenId,
      toTokenNetworkId: NetworkId['celo-alfajores'],
      fromToken: mockCeurAddress,
      fromTokenId: mockCeurTokenId,
      fromTokenNetworkId: NetworkId['celo-alfajores'],
      amount: '10000000000000000',
      amountType: 'buyAmount',
      price: '1',
      allowanceTarget: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
      estimatedPriceImpact: '0.1',
      provider: '0x',
      fromTokenBalance: '10000000000000000000',
      swapApproveTxId: 'a uuid',
      swapExecuteTxId: 'a uuid',
      quoteToUserConfirmsSwapElapsedTimeInMs: 30_000,
      quoteToTransactionElapsedTimeInMs: undefined,
      estimatedBuyTokenUsdValue: 0.005,
      estimatedSellTokenUsdValue: 0.01,
      web3Library: 'contract-kit',
    })
  })

  it('should set swap state correctly on price change', async () => {
    mockSwap.payload.unvalidatedSwapTransaction.guaranteedPrice = '1.021'
    await expectSaga(swapSubmitSaga, mockSwap)
      .withState(store.getState())
      .provide(defaultProviders)
      .put(swapPriceChange())
      .run()

    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SwapEvents.swap_execute_price_change, {
      price: '1',
      guaranteedPrice: '1.021',
      toToken: mockCeloAddress,
      toTokenId: mockCeloTokenId,
      toTokenNetworkId: NetworkId['celo-alfajores'],
      fromToken: mockCeurAddress,
      fromTokenId: mockCeurTokenId,
      fromTokenNetworkId: NetworkId['celo-alfajores'],
    })
  })
})

describe(swapSubmitPreparedSaga, () => {
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

  const defaultProviders: (EffectProviders | StaticProvider)[] = [
    [matchers.call.fn(getViemWallet), mockViemWallet],
    [matchers.call.fn(getTransactionCount), 10],
    [matchers.call.fn(unlockAccount), UnlockResult.SUCCESS],
    [matchers.call.fn(publicClient.celo.waitForTransactionReceipt), mockSwapTxReceipt],
    [matchers.call.fn(publicClient.celo.getTransactionReceipt), mockApproveTxReceipt],
  ]

  beforeEach(() => {
    sendCallCount = 0
  })

  it('should complete swap', async () => {
    jest
      .spyOn(Date, 'now')
      .mockReturnValueOnce(mockQuoteReceivedTimestamp + 2_500) // swap submitted timestamp
      .mockReturnValue(mockQuoteReceivedTimestamp + 10_000) // before send swap timestamp

    await expectSaga(swapSubmitPreparedSaga, mockSwapPrepared)
      .withState(store.getState())
      .provide(defaultProviders)
      .not.put(swapApprove())
      .put(swapExecute())
      .put.like({
        action: {
          type: Actions.ADD_STANDBY_TRANSACTION,
          transaction: {
            __typename: 'TokenExchangeV3',
            type: TokenTransactionTypeV2.SwapTransaction,
            inAmount: {
              value: BigNumber('0.0102'), // guaranteedPrice * sellAmount
              tokenId: mockCeloTokenId,
            },
            outAmount: {
              value: BigNumber('0.01'),
              tokenId: mockCeurTokenId,
            },
          },
        },
      })
      .put.like({
        action: {
          type: Actions.TRANSACTION_CONFIRMED,
          receipt: {
            transactionHash: '0x2',
            block: '1234',
            status: TransactionStatus.Complete,
          },
        },
      })
      .call([publicClient.celo, 'waitForTransactionReceipt'], { hash: '0x2' })
      .run()
    expect(mockViemWallet.signTransaction).toHaveBeenCalledTimes(2)
    expect(mockViemWallet.sendRawTransaction).toHaveBeenCalledTimes(2)
    expect(loggerErrorSpy).not.toHaveBeenCalled()

    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SwapEvents.swap_execute_success, {
      toToken: mockCeloAddress,
      toTokenId: mockCeloTokenId,
      toTokenNetworkId: NetworkId['celo-alfajores'],
      fromToken: mockCeurAddress,
      fromTokenId: mockCeurTokenId,
      fromTokenNetworkId: NetworkId['celo-alfajores'],
      amount: '10000000000000000',
      amountType: 'buyAmount',
      price: '1',
      allowanceTarget: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
      estimatedPriceImpact: '0.1',
      provider: '0x',
      fromTokenBalance: '10000000000000000000',
      swapApproveTxId: 'a uuid',
      swapExecuteTxId: 'a uuid',
      quoteToUserConfirmsSwapElapsedTimeInMs: 2_500,
      quoteToTransactionElapsedTimeInMs: 10_000,
      estimatedBuyTokenUsdValue: 0.005,
      estimatedSellTokenUsdValue: 0.01,
      web3Library: 'viem',
      gas: 1384480,
      maxGasFee: 0.01661376,
      maxGasFeeUsd: 0.00830688,
      gasUsed: 423252,
      gasFee: 0.00211626,
      gasFeeUsd: 0.00105813,
      feeCurrency: undefined,
      feeCurrencySymbol: 'CELO',
      txCount: 2,
      approveTxCumulativeGasUsed: 3_129_217,
      approveTxEffectiveGasPrice: 5_000_000_000,
      approveTxFeeCurrency: undefined,
      approveTxFeeCurrencySymbol: 'CELO',
      approveTxGas: 59_480,
      approveTxMaxGasFee: 0.00071376,
      approveTxMaxGasFeeUsd: 0.00035688,
      approveTxGasUsed: 51_578,
      approveTxGasFee: 0.00025789,
      approveTxGasFeeUsd: 0.000128945,
      approveTxHash: '0x1',
      swapTxCumulativeGasUsed: 3_899_547,
      swapTxEffectiveGasPrice: 5_000_000_000,
      swapTxFeeCurrency: undefined,
      swapTxFeeCurrencySymbol: 'CELO',
      swapTxGas: 1_325_000,
      swapTxMaxGasFee: 0.0159,
      swapTxMaxGasFeeUsd: 0.00795,
      swapTxGasUsed: 371_674,
      swapTxGasFee: 0.00185837,
      swapTxGasFeeUsd: 0.000929185,
      swapTxHash: '0x2',
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
  })

  it('should complete swap without approval for native sell token', async () => {
    await expectSaga(swapSubmitPreparedSaga, mockSwapPreparedWithNativeSellToken)
      .withState(store.getState())
      .provide(defaultProviders)
      .not.put(swapApprove())
      .put(swapExecute())
      .put.like({
        action: {
          type: Actions.ADD_STANDBY_TRANSACTION,
          transaction: {
            __typename: 'TokenExchangeV3',
            type: TokenTransactionTypeV2.SwapTransaction,
            inAmount: {
              value: BigNumber('0.0102'), // guaranteedPrice * sellAmount
              tokenId: mockCeloTokenId,
            },
            outAmount: {
              value: BigNumber('0.01'),
              tokenId: mockCeurTokenId,
            },
          },
        },
      })
      .call([publicClient.celo, 'waitForTransactionReceipt'], { hash: '0x1' })
      .run()

    expect(mockViemWallet.signTransaction).toHaveBeenCalledTimes(1)
    expect(mockViemWallet.sendRawTransaction).toHaveBeenCalledTimes(1)
    expect(loggerErrorSpy).not.toHaveBeenCalled()
  })

  it('should display the correct standby values for a swap with different decimals', async () => {
    await expectSaga(swapSubmitPreparedSaga, mockSwapPreparedWithWBTCBuyToken)
      .withState(store.getState())
      .provide(defaultProviders)
      .put.like({
        action: {
          type: Actions.ADD_STANDBY_TRANSACTION,
          transaction: {
            __typename: 'TokenExchangeV3',
            type: TokenTransactionTypeV2.SwapTransaction,
            inAmount: {
              value: BigNumber('0.0102'), // guaranteedPrice * sellAmount
              tokenId: mockWBTCTokenId,
            },
            outAmount: {
              value: BigNumber('0.01'),
              tokenId: mockCeurTokenId,
            },
          },
        },
      })
      .run()
  })

  it('should set swap state correctly on error', async () => {
    jest
      .spyOn(Date, 'now')
      .mockReturnValueOnce(mockQuoteReceivedTimestamp + 2_500) // swap submitted timestamp
      .mockReturnValue(mockQuoteReceivedTimestamp + 10_000) // before send swap timestamp

    jest.mocked(mockViemWallet.sendRawTransaction).mockImplementationOnce(() => {
      throw new Error('fake error')
    })
    await expectSaga(swapSubmitPreparedSaga, mockSwapPrepared)
      .withState(store.getState())
      .provide(defaultProviders)
      .not.put(swapApprove())
      .put(swapError())
      .run()
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SwapEvents.swap_execute_error, {
      error: 'fake error',
      toToken: mockCeloAddress,
      toTokenId: mockCeloTokenId,
      toTokenNetworkId: NetworkId['celo-alfajores'],
      fromToken: mockCeurAddress,
      fromTokenId: mockCeurTokenId,
      fromTokenNetworkId: NetworkId['celo-alfajores'],
      amount: '10000000000000000',
      amountType: 'buyAmount',
      price: '1',
      allowanceTarget: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
      estimatedPriceImpact: '0.1',
      provider: '0x',
      fromTokenBalance: '10000000000000000000',
      swapApproveTxId: 'a uuid',
      swapExecuteTxId: 'a uuid',
      quoteToUserConfirmsSwapElapsedTimeInMs: 2_500,
      quoteToTransactionElapsedTimeInMs: 10_000,
      estimatedBuyTokenUsdValue: 0.005,
      estimatedSellTokenUsdValue: 0.01,
      web3Library: 'viem',
      gas: 1384480,
      maxGasFee: 0.01661376,
      maxGasFeeUsd: 0.00830688,
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
      swapTxGasUsed: undefined,
      swapTxGasFee: undefined,
      swapTxGasFeeUsd: undefined,
      swapTxHash: undefined,
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
})

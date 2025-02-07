import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { EffectProviders, StaticProvider } from 'redux-saga-test-plan/providers'
import { call } from 'redux-saga/effects'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents, SwapEvents } from 'src/analytics/Events'
import { trackPointsEvent } from 'src/points/slice'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import {
  handleTransactionFeedV2ApiFulfilled,
  internalWatchPendingTransactionsInNetwork,
  watchPendingTransactions,
  watchPendingTransactionsInNetwork,
} from 'src/transactions/saga'
import { transactionConfirmed, transactionsConfirmedFromFeedApi } from 'src/transactions/slice'
import {
  DepositOrWithdraw,
  Network,
  NetworkId,
  StandbyTransaction,
  TokenExchange,
  TokenTransaction,
  TokenTransactionTypeV2,
  TransactionStatus,
} from 'src/transactions/types'
import { publicClient } from 'src/viem'
import { getSupportedNetworkIds } from 'src/web3/utils'
import { createMockStore } from 'test/utils'
import {
  mockAaveArbUsdcTokenId,
  mockAccount,
  mockArbUsdcTokenId,
  mockCeloTokenId,
  mockCeurTokenId,
  mockCusdAddress,
  mockCusdTokenId,
  mockEarnPositions,
  mockEthTokenId,
  mockOPTokenId,
  mockTokenBalances,
} from 'test/values'

jest.mock('src/statsig')

const mockCrossChainSwapTransaction: TokenExchange = {
  type: TokenTransactionTypeV2.CrossChainSwapTransaction,
  networkId: NetworkId['celo-alfajores'],
  status: TransactionStatus.Complete,
  transactionHash: '0x1',
  block: '1',
  inAmount: { value: '0.1', tokenId: mockOPTokenId },
  outAmount: { value: '0.2', tokenId: mockCusdTokenId },
  timestamp: Date.now(),
  fees: [
    { type: 'SECURITY_FEE', amount: { value: '0.3', tokenId: mockCeloTokenId } },
    { type: 'APP_FEE', amount: { value: '0.4', tokenId: mockCusdTokenId } },
    { type: 'CROSS_CHAIN_FEE', amount: { value: '0.5', tokenId: mockCeloTokenId } },
  ],
}

const mockCrossChainDeposit: DepositOrWithdraw = {
  type: TokenTransactionTypeV2.CrossChainDeposit,
  networkId: NetworkId['op-sepolia'],
  status: TransactionStatus.Complete,
  transactionHash: '0x2',
  block: '1',
  appName: 'Aave',
  inAmount: { value: '0.1', tokenId: mockAaveArbUsdcTokenId },
  outAmount: { value: '0.2', tokenId: mockArbUsdcTokenId },
  swap: {
    inAmount: { value: '0.2', tokenId: mockArbUsdcTokenId },
    outAmount: { value: '0.3', tokenId: mockOPTokenId },
  },
  timestamp: Date.now(),
  fees: [
    { type: 'SECURITY_FEE', amount: { value: '0.3', tokenId: mockOPTokenId } },
    { type: 'APP_FEE', amount: { value: '0.4', tokenId: mockOPTokenId } },
    { type: 'CROSS_CHAIN_FEE', amount: { value: '0.2', tokenId: mockOPTokenId } },
  ],
}

describe('watchPendingTransactions', () => {
  const amount = new BigNumber(10)
  const transactionId = 'txId'
  const transactionHash = '0x123'

  const pendingTransaction: StandbyTransaction = {
    context: { id: transactionId },
    networkId: NetworkId['celo-alfajores'],
    type: TokenTransactionTypeV2.Sent,
    metadata: {},
    amount: {
      value: amount.negated().toString(),
      tokenAddress: mockCusdAddress,
      tokenId: mockCusdTokenId,
    },
    address: mockAccount,
    timestamp: 1000,
    status: TransactionStatus.Pending,
    transactionHash,
    feeCurrencyId: mockCusdTokenId,
  }

  const successReceipt = {
    status: 'success',
    blockNumber: BigInt(123),
    transactionHash,
    gasUsed: 2_000_000,
    effectiveGasPrice: 1e9,
  }
  function createDefaultProviders(network: Network) {
    const defaultProviders: (EffectProviders | StaticProvider)[] = [
      [
        call([publicClient[network], 'waitForTransactionReceipt'], { hash: transactionHash }),
        successReceipt,
      ],
      [
        call([publicClient[network], 'getBlock'], { blockNumber: BigInt(123) }),
        { timestamp: 1701102971 },
      ],
    ]

    return defaultProviders
  }

  it('updates the pending standby transaction when reverted without fee details', async () => {
    await expectSaga(internalWatchPendingTransactionsInNetwork, Network.Celo)
      .withState(
        createMockStore({
          transactions: {
            standbyTransactions: [
              {
                ...pendingTransaction,
                feeCurrencyId: undefined,
              },
            ],
          },
        }).getState()
      )
      .provide([
        [
          call([publicClient.celo, 'waitForTransactionReceipt'], { hash: transactionHash }),
          {
            ...successReceipt,
            status: 'reverted',
          },
        ],
        ...createDefaultProviders(Network.Celo),
      ])
      .put(
        transactionConfirmed({
          txId: transactionId,
          blockTimestampInMs: 1701102971000,
          receipt: {
            transactionHash,
            block: '123',
            status: TransactionStatus.Failed,
            fees: [],
          },
        })
      )
      .not.put(trackPointsEvent(expect.any(Object))) // transaction reverted, no points
      .run()
  })

  it('updates and tracks the pending swap transaction', async () => {
    const standbySwaptransaction: StandbyTransaction = {
      context: {
        id: transactionId,
      },
      status: TransactionStatus.Pending,
      networkId: NetworkId['celo-alfajores'],
      type: TokenTransactionTypeV2.SwapTransaction,
      transactionHash,
      timestamp: 1234,
      inAmount: {
        tokenId: mockCeurTokenId,
        value: 2.93,
      },
      outAmount: {
        tokenId: mockCusdTokenId,
        value: 2.87,
      },
      metadata: {},
    }
    await expectSaga(internalWatchPendingTransactionsInNetwork, Network.Celo)
      .withState(
        createMockStore({
          transactions: {
            standbyTransactions: [standbySwaptransaction],
          },
        }).getState()
      )
      .provide(createDefaultProviders(Network.Celo))
      .put(
        transactionConfirmed({
          txId: transactionId,
          blockTimestampInMs: 1701102971000,
          receipt: {
            transactionHash,
            block: '123',
            status: TransactionStatus.Complete,
            fees: [],
          },
        })
      )
      .put(
        trackPointsEvent({
          activityId: 'swap',
          transactionHash,
          networkId: NetworkId['celo-alfajores'],
          toTokenId: mockCeurTokenId,
          fromTokenId: mockCusdTokenId,
        })
      )
      .run()
  })

  it('updates the pending standby transaction when successful with fee details in cUSD', async () => {
    await expectSaga(internalWatchPendingTransactionsInNetwork, Network.Celo)
      .withState(
        createMockStore({
          transactions: {
            standbyTransactions: [pendingTransaction],
          },
        }).getState()
      )
      .provide(createDefaultProviders(Network.Celo))
      .put(
        transactionConfirmed({
          txId: transactionId,
          blockTimestampInMs: 1701102971000,
          receipt: {
            transactionHash,
            block: '123',
            status: TransactionStatus.Complete,
            fees: [
              {
                type: 'SECURITY_FEE',
                amount: {
                  value: '0.002',
                  tokenId: mockCusdTokenId,
                },
              },
            ],
          },
        })
      )
      .not.put(trackPointsEvent(expect.any(Object))) // not a swap transaction
      .run()
  })

  it('updates the pending standby transaction when successful with fee details in Ether', async () => {
    await expectSaga(internalWatchPendingTransactionsInNetwork, Network.Ethereum)
      .withState(
        createMockStore({
          transactions: {
            standbyTransactions: [
              {
                ...pendingTransaction,
                networkId: NetworkId['ethereum-sepolia'],
                feeCurrencyId: mockEthTokenId,
              },
            ],
          },
          tokens: {
            tokenBalances: mockTokenBalances,
          },
        }).getState()
      )
      .provide(createDefaultProviders(Network.Ethereum))
      .put(
        transactionConfirmed({
          txId: transactionId,
          blockTimestampInMs: 1701102971000,
          receipt: {
            transactionHash,
            block: '123',
            status: TransactionStatus.Complete,
            fees: [
              {
                type: 'SECURITY_FEE',
                amount: {
                  value: '0.002',
                  tokenId: mockEthTokenId,
                },
              },
            ],
          },
        })
      )
      .run()
  })

  it('does not update the pending transaction when there is no receipt', async () => {
    await expectSaga(internalWatchPendingTransactionsInNetwork, Network.Celo)
      .withState(
        createMockStore({
          transactions: {
            standbyTransactions: [pendingTransaction],
          },
        }).getState()
      )
      .provide([
        [call([publicClient.celo, 'waitForTransactionReceipt'], { hash: transactionHash }), null],
        ...createDefaultProviders(Network.Celo),
      ])
      .not.put(
        transactionConfirmed({
          txId: expect.any(String),
          receipt: expect.any(Object),
          blockTimestampInMs: expect.any(Number),
        })
      )
      .not.put(trackPointsEvent(expect.any(Object))) // no receipt, no points
      .run()
  })

  it('does spawn a watching loop for each allowed network', async () => {
    await expectSaga(watchPendingTransactions)
      .provide([
        [
          call(getSupportedNetworkIds),
          [NetworkId['celo-alfajores'], NetworkId['ethereum-sepolia']],
        ],
        [matchers.spawn.fn(watchPendingTransactionsInNetwork), null],
      ])
      .run()
      .then((result) => {
        const spawnCalls = result.allEffects.filter(
          (effect) => effect.type === 'FORK' && effect.payload.detached
        )
        expect(spawnCalls).toHaveLength(2)
        expect(spawnCalls[0].payload.args[0]).toEqual(Network.Celo)
        expect(spawnCalls[1].payload.args[0]).toEqual(Network.Ethereum)
      })
  })

  it('does spawn a watching loop for only allowed network', async () => {
    await expectSaga(watchPendingTransactions)
      .provide([
        [call(getSupportedNetworkIds), [NetworkId['celo-alfajores']]],
        [matchers.spawn.fn(watchPendingTransactionsInNetwork), null],
      ])
      .run()
      .then((result) => {
        const spawnCalls = result.allEffects.filter(
          (effect) => effect.type === 'FORK' && effect.payload.detached
        )
        expect(spawnCalls).toHaveLength(1)
        expect(spawnCalls[0].payload.args[0]).toEqual(Network.Celo)
      })
  })
})

describe('handleTransactionFeedV2ApiFulfilled', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest
      .mocked(getFeatureGate)
      .mockImplementation((gate) => gate === StatsigFeatureGates.SHOW_POSITIONS)
  })

  it('should track analytics event for newly completed cross chain transactions', async () => {
    const transactions = [
      mockCrossChainSwapTransaction,
      mockCrossChainDeposit,
      { transactionHash: '0x3' } as TokenTransaction,
      { ...mockCrossChainDeposit, transactionHash: '0x4' },
    ]
    await expectSaga(handleTransactionFeedV2ApiFulfilled, {
      type: 'transactionFeedV2Api/executeQuery/fulfilled',
      payload: {
        transactions,
        pageInfo: {
          startCursor: '',
          endCursor: '',
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    })
      .withState(
        createMockStore({
          transactions: {
            standbyTransactions: [
              { transactionHash: '0x1', status: TransactionStatus.Pending },
              { transactionHash: '0x2', status: TransactionStatus.Pending },
            ],
          },
          positions: {
            positions: mockEarnPositions,
            earnPositionIds: mockEarnPositions.map((position) => position.positionId),
          },
        }).getState()
      )
      .provide([[call(getSupportedNetworkIds), [NetworkId['celo-alfajores']]]])
      .put(transactionsConfirmedFromFeedApi(transactions))
      .run()

    expect(AppAnalytics.track).toHaveBeenCalledTimes(2)
    expect(AppAnalytics.track).toHaveBeenCalledWith(SwapEvents.swap_execute_success, {
      swapType: 'cross-chain',
      swapExecuteTxId: '0x1',
      toTokenId: mockOPTokenId,
      toTokenAmount: '0.1',
      toTokenAmountUsd: undefined,
      fromTokenId: mockCusdTokenId,
      fromTokenAmount: '0.2',
      fromTokenAmountUsd: 0.2,
      networkFeeTokenId: mockCeloTokenId,
      networkFeeAmount: '0.3',
      networkFeeAmountUsd: 1.5,
      appFeeTokenId: mockCusdTokenId,
      appFeeAmount: '0.4',
      appFeeAmountUsd: 0.4,
      crossChainFeeTokenId: mockCeloTokenId,
      crossChainFeeAmount: '0.5',
      crossChainFeeAmountUsd: 2.5,
    })
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_deposit_execute_success, {
      networkId: NetworkId['arbitrum-sepolia'],
      poolId: mockEarnPositions[0].positionId,
      providerId: 'aave',
      depositTokenId: mockArbUsdcTokenId,
      depositTokenAmount: '0.2',
      mode: 'swap-deposit',
      swapType: 'cross-chain',
      fromTokenAmount: '0.3',
      fromTokenId: mockOPTokenId,
      fromNetworkId: NetworkId['op-sepolia'],
      networkFeeTokenId: mockOPTokenId,
      networkFeeAmount: '0.3',
      networkFeeAmountUsd: undefined,
      appFeeTokenId: mockOPTokenId,
      appFeeAmount: '0.4',
      appFeeAmountUsd: undefined,
      crossChainFeeTokenId: mockOPTokenId,
      crossChainFeeAmount: '0.2',
      crossChainFeeAmountUsd: undefined,
    })
  })

  it('skips analytics event if transactions are not in standby transactions', async () => {
    const transactions = [
      mockCrossChainSwapTransaction,
      mockCrossChainDeposit,
      { transactionHash: '0x3' } as TokenTransaction,
      { ...mockCrossChainDeposit, transactionHash: '0x4' },
    ]
    await expectSaga(handleTransactionFeedV2ApiFulfilled, {
      type: 'transactionFeedV2Api/executeQuery/fulfilled',
      payload: {
        transactions,
        pageInfo: {
          startCursor: '',
          endCursor: '',
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    })
      .withState(
        createMockStore({
          transactions: {
            standbyTransactions: [],
          },
          positions: {
            positions: mockEarnPositions,
            earnPositionIds: mockEarnPositions.map((position) => position.positionId),
          },
        }).getState()
      )
      .provide([[call(getSupportedNetworkIds), [NetworkId['celo-alfajores']]]])
      .put(transactionsConfirmedFromFeedApi(transactions))
      .run()

    expect(AppAnalytics.track).not.toHaveBeenCalled()
  })
})

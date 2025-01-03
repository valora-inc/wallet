import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { EffectProviders, StaticProvider } from 'redux-saga-test-plan/providers'
import { call } from 'redux-saga/effects'
import { trackPointsEvent } from 'src/points/slice'
import { getSupportedNetworkIdsForSend, getSupportedNetworkIdsForSwap } from 'src/tokens/utils'
import {
  internalWatchPendingTransactionsInNetwork,
  watchPendingTransactions,
  watchPendingTransactionsInNetwork,
} from 'src/transactions/saga'
import { transactionConfirmed } from 'src/transactions/slice'
import {
  Network,
  NetworkId,
  StandbyTransaction,
  TokenTransactionTypeV2,
  TransactionStatus,
} from 'src/transactions/types'
import { publicClient } from 'src/viem'
import { createMockStore } from 'test/utils'
import {
  mockAccount,
  mockCeurTokenId,
  mockCusdAddress,
  mockCusdTokenId,
  mockEthTokenId,
  mockTokenBalances,
} from 'test/values'

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
          call(getSupportedNetworkIdsForSend),
          [NetworkId['celo-alfajores'], NetworkId['ethereum-sepolia']],
        ],
        [call(getSupportedNetworkIdsForSwap), [NetworkId['celo-alfajores']]],
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
        [call(getSupportedNetworkIdsForSend), [NetworkId['celo-alfajores']]],
        [call(getSupportedNetworkIdsForSwap), [NetworkId['celo-alfajores']]],
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

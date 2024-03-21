import { EventLog } from '@celo/connect'
import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { EffectProviders, StaticProvider } from 'redux-saga-test-plan/providers'
import { call } from 'redux-saga/effects'
import { getSupportedNetworkIdsForSend, getSupportedNetworkIdsForSwap } from 'src/tokens/utils'
import {
  transactionConfirmed,
  updateInviteTransactions,
  updateTransactions,
} from 'src/transactions/actions'
import {
  getInviteTransactionsDetails,
  internalWatchPendingTransactionsInNetwork,
  watchPendingTransactions,
  watchPendingTransactionsInNetwork,
} from 'src/transactions/saga'
import {
  Network,
  NetworkId,
  StandbyTransaction,
  TokenTransaction,
  TokenTransactionTypeV2,
  TransactionStatus,
} from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { publicClient } from 'src/viem'
import { getContractKit, getContractKitAsync } from 'src/web3/contracts'
import { createMockStore } from 'test/utils'
import {
  mockAccount,
  mockCusdAddress,
  mockCusdTokenId,
  mockEthTokenId,
  mockTokenBalances,
} from 'test/values'

const loggerErrorSpy = jest.spyOn(Logger, 'error')

const transactionHash = '0x544367eaf2b01622dd1c7b75a6b19bf278d72127aecfb2e5106424c40c268e8b'
const mockInviteTransaction: TokenTransaction = {
  __typename: 'TokenTransferV3',
  networkId: NetworkId['celo-alfajores'],
  address: '0xd68360cce1f1ff696d898f58f03e0f1252f2ea33',
  amount: {
    tokenAddress: mockCusdAddress,
    tokenId: mockCusdTokenId,
    value: '0.1',
  },
  block: '8648978',
  fees: [],
  metadata: {},
  timestamp: 1542306118,
  transactionHash,
  type: TokenTransactionTypeV2.InviteSent,
  status: TransactionStatus.Complete,
}
const mockEscrowPastEvent: EventLog = {
  event: 'PastEvent',
  address: '0xd68360cce1f1ff696d898f58f03e0f1252f2ea33',
  returnValues: {
    identifier: 'someIdentifier',
    paymentId: 'somePaymentId',
  },
  logIndex: 0,
  transactionIndex: 0,
  transactionHash,
  blockHash: '0xabc',
  blockNumber: 8648978,
}

describe('getInviteTransactionsDetails', () => {
  it('logs an error if no matching transaction is found in escrow', async () => {
    const kit = await getContractKitAsync()
    const updateTransactionsAction = updateTransactions(NetworkId['celo-alfajores'], [
      mockInviteTransaction,
    ])
    const mockEscrowWrapper = {
      getPastEvents: jest.fn(() => [
        {
          ...mockEscrowPastEvent,
          transactionHash: '0x123',
        },
      ]),
      eventTypes: {
        Transfer: 'Transfer',
      },
    }

    await expectSaga(getInviteTransactionsDetails, updateTransactionsAction)
      .withState(createMockStore().getState())
      .provide([
        [call(getContractKit), kit],
        [call([kit.contracts, kit.contracts.getEscrow]), mockEscrowWrapper],
      ])
      .run()

    expect(loggerErrorSpy).toHaveBeenCalled()
  })

  it('updates the invite transaction details', async () => {
    const kit = await getContractKitAsync()
    const updateTransactionsAction = updateTransactions(NetworkId['celo-alfajores'], [
      mockInviteTransaction,
    ])
    const mockEscrowWrapper = {
      getPastEvents: jest.fn(() => [mockEscrowPastEvent]),
      eventTypes: {
        Transfer: 'Transfer',
      },
    }

    await expectSaga(getInviteTransactionsDetails, updateTransactionsAction)
      .withState(createMockStore().getState())
      .provide([
        [call(getContractKit), kit],
        [call([kit.contracts, kit.contracts.getEscrow]), mockEscrowWrapper],
      ])
      .put(
        updateInviteTransactions({
          [transactionHash]: {
            recipientIdentifier: 'someIdentifier',
            paymentId: 'somePaymentId',
          },
        })
      )
      .run()
  })
})

describe('watchPendingTransactions', () => {
  const amount = new BigNumber(10)
  const transactionId = 'txId'
  const transactionHash = '0x123'

  const pendingTransaction: StandbyTransaction = {
    __typename: 'TokenTransferV3',
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
        transactionConfirmed(
          transactionId,
          {
            transactionHash,
            block: '123',
            status: TransactionStatus.Failed,
            fees: [],
          },
          1701102971000
        )
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
        transactionConfirmed(
          transactionId,
          {
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
          1701102971000
        )
      )
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
        transactionConfirmed(
          transactionId,
          {
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
          1701102971000
        )
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
      .not.put(transactionConfirmed(expect.any(String), expect.any(Object), expect.any(Number)))
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

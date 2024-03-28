import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import {
  EffectProviders,
  StaticProvider,
  dynamic,
  throwError,
} from 'redux-saga-test-plan/providers'
import { fork } from 'redux-saga/effects'
import { JumpstartEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { jumpstartLinkHandler } from 'src/jumpstart/jumpstartLinkHandler'
import {
  dispatchPendingERC20Transactions,
  dispatchPendingERC721Transactions,
  dispatchPendingTransactions,
  jumpstartClaim,
  jumpstartReclaim,
  sendJumpstartTransactions,
} from 'src/jumpstart/saga'
import {
  depositTransactionFailed,
  depositTransactionStarted,
  depositTransactionSucceeded,
  jumpstartClaimFailed,
  jumpstartClaimStarted,
  jumpstartClaimSucceeded,
  jumpstartReclaimFailed,
  jumpstartReclaimStarted,
  jumpstartReclaimSucceeded,
} from 'src/jumpstart/slice'
import { getDynamicConfigParams } from 'src/statsig'
import { addStandbyTransaction } from 'src/transactions/actions'
import { Network, NetworkId, TokenTransactionTypeV2 } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import { publicClient } from 'src/viem'
import {
  getSerializablePreparedTransaction,
  getSerializablePreparedTransactions,
} from 'src/viem/preparedTransactionSerialization'
import { sendPreparedTransactions } from 'src/viem/saga'
import { createMockStore } from 'test/utils'
import {
  mockAccount,
  mockAccount2,
  mockAccountInvitePrivKey,
  mockCusdAddress,
  mockCusdTokenBalance,
  mockCusdTokenId,
  mockNftAllFields,
  mockTokenBalances,
} from 'test/values'
import { Hash, TransactionReceipt, parseEventLogs } from 'viem'

jest.mock('src/statsig')
jest.mock('src/utils/Logger')
jest.mock('src/analytics/ValoraAnalytics')
jest.mock('viem', () => ({
  ...jest.requireActual('viem'),
  parseEventLogs: jest.fn(),
}))
jest.mock('src/viem/saga', () => ({
  ...jest.requireActual('src/viem/saga'),
  sendPreparedTransactions: jest.fn().mockResolvedValue(['0x1', '0x2']),
}))

const networkId = NetworkId['celo-alfajores']
const network = Network.Celo

const mockPrivateKey = mockAccountInvitePrivKey
const mockWalletAddress = mockAccount
const mockTransactionHashes = ['0xHASH1', '0xHASH2'] as Hash[]
const mockError = new Error('test error')
const mockTransactionReceipt = {
  transactionHash: '0xHASH1',
  logs: [],
  status: 'success',
} as unknown as TransactionReceipt

const mockJumpstartRemoteConfig = {
  jumpstartContracts: {
    [networkId]: { contractAddress: '0xTEST' },
  },
}

const mockErc20Logs = [
  {
    eventName: 'ERC20Claimed',
    address: mockAccount2,
    args: { token: mockCusdAddress, amount: '1000000000000000000' },
  },
] as unknown as ReturnType<typeof parseEventLogs>

const mockErc20LogsUnkonwnToken = [
  {
    eventName: 'ERC20Claimed',
    address: mockAccount2,
    args: { token: '0xUNKNOWN', amount: '1000000000000000000' },
  },
] as unknown as ReturnType<typeof parseEventLogs>

const mockErc721Logs = [
  {
    eventName: 'ERC721Claimed',
    address: mockAccount2,
    args: { token: mockNftAllFields.contractAddress, tokenId: mockNftAllFields.tokenId },
  },
] as unknown as ReturnType<typeof parseEventLogs>

describe('jumpstartClaim', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('handles the happy path', async () => {
    jest.mocked(getDynamicConfigParams).mockReturnValue(mockJumpstartRemoteConfig)

    await expectSaga(jumpstartClaim, mockPrivateKey, networkId, mockWalletAddress)
      .provide([
        [matchers.call.fn(jumpstartLinkHandler), mockTransactionHashes],
        [fork(dispatchPendingTransactions, networkId, mockTransactionHashes), undefined],
      ])
      .put(jumpstartClaimStarted())
      .fork(dispatchPendingTransactions, networkId, mockTransactionHashes)
      .put(jumpstartClaimSucceeded())
      .run()

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(JumpstartEvents.jumpstart_claim_succeeded)
  })

  it('handles the jumpstartLinkHandler error', async () => {
    jest.mocked(getDynamicConfigParams).mockReturnValue(mockJumpstartRemoteConfig)

    await expectSaga(jumpstartClaim, mockPrivateKey, networkId, mockWalletAddress)
      .provide([[matchers.call.fn(jumpstartLinkHandler), throwError(mockError)]])
      .put(jumpstartClaimStarted())
      .put(jumpstartClaimFailed())
      .run()

    expect(Logger.error).toHaveBeenCalledWith(
      'WalletJumpstart/saga',
      'Error handling jumpstart link',
      mockError
    )

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(JumpstartEvents.jumpstart_claim_failed)
  })

  it('does not fail when dispatching pending transactions fails', async () => {
    jest.mocked(getDynamicConfigParams).mockReturnValue(mockJumpstartRemoteConfig)

    return expectSaga(jumpstartClaim, mockPrivateKey, networkId, mockWalletAddress)
      .provide([
        [matchers.call.fn(jumpstartLinkHandler), mockTransactionHashes],
        [matchers.call.fn(dispatchPendingTransactions), throwError(mockError)],
      ])
      .put(jumpstartClaimStarted())
      .put(jumpstartClaimSucceeded())
      .run()
  })

  it('fails when dynamic config is empty', async () => {
    jest.mocked(getDynamicConfigParams).mockReturnValue({ jumpstartContracts: {} })

    await expectSaga(jumpstartClaim, mockPrivateKey, networkId, mockWalletAddress)
      .provide([[matchers.call.fn(jumpstartLinkHandler), mockTransactionHashes]])
      .put(jumpstartClaimStarted())
      .put(jumpstartClaimFailed())
      .run()

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(JumpstartEvents.jumpstart_claim_failed)
  })
})

describe('dispatchPendingTransactions', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('successfully dispatches pending transactins', async () => {
    jest.mocked(parseEventLogs).mockReturnValue(mockErc20Logs)

    return expectSaga(dispatchPendingTransactions, networkId, [mockTransactionHashes[0]])
      .withState(
        createMockStore({
          tokens: {
            tokenBalances: mockTokenBalances,
          },
        }).getState()
      )
      .provide([
        [matchers.call.fn(publicClient[network].getTransactionReceipt), mockTransactionReceipt],
      ])
      .fork(dispatchPendingERC20Transactions, networkId, [mockTransactionReceipt])
      .fork(dispatchPendingERC721Transactions, networkId, [mockTransactionReceipt])
      .run()
  })

  it('handles the error when getting transaction receipts', async () => {
    await expectSaga(dispatchPendingTransactions, networkId, [mockTransactionHashes[0]])
      .provide([
        [matchers.call.fn(publicClient[network].getTransactionReceipt), throwError(mockError)],
      ])
      .run()

    expect(Logger.warn).toHaveBeenCalledWith(
      'WalletJumpstart/saga',
      'Error dispatching pending transactions',
      mockError
    )
  })
})

describe('dispatchPendingERC20Transactions', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('dispatches TokenTransferV3 standby transaction in response to ERC20Claimed logs event', async () => {
    const mockTransactionHash = mockTransactionHashes[0]
    jest.mocked(parseEventLogs).mockReturnValue(mockErc20Logs)

    await expectSaga(dispatchPendingERC20Transactions, networkId, [mockTransactionReceipt])
      .withState(
        createMockStore({
          tokens: {
            tokenBalances: mockTokenBalances,
          },
        }).getState()
      )
      .put(
        addStandbyTransaction({
          __typename: 'TokenTransferV3',
          type: TokenTransactionTypeV2.Received,
          context: { id: mockTransactionHash },
          transactionHash: mockTransactionHash,
          networkId,
          amount: { value: '1', tokenAddress: mockCusdAddress, tokenId: mockCusdTokenId },
          address: mockAccount2,
          metadata: {},
        })
      )
      .run()

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(JumpstartEvents.jumpstart_claimed_token, {
      networkId,
      tokenAddress: mockCusdAddress,
      value: 1,
    })
  })

  it('does not dispatch TokenTransferV3 standby transaction for an unknown token', async () => {
    jest.mocked(parseEventLogs).mockReturnValue(mockErc20LogsUnkonwnToken)

    await expectSaga(dispatchPendingERC20Transactions, networkId, [mockTransactionReceipt])
      .withState(
        createMockStore({
          tokens: {
            tokenBalances: mockTokenBalances,
          },
        }).getState()
      )
      .not.put.like({ action: { type: 'ADD_STANDBY_TRANSACTION' } })
      .run()

    expect(Logger.warn).toHaveBeenCalledWith(
      'WalletJumpstart/saga',
      'Claimed unknown tokenId',
      'celo-alfajores:0xunknown'
    )
  })
})

describe('dispatchPendingERC721Transactions', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('dispatches NftTransferV3 standby transaction in response to ERC721Claimed logs event', async () => {
    const mockTransactionHash = mockTransactionHashes[0]

    jest.mocked(parseEventLogs).mockReturnValue(mockErc721Logs)

    const tokenUri = 'https://example.com'
    const metadata = { ...mockNftAllFields.metadata }

    await expectSaga(dispatchPendingERC721Transactions, networkId, [mockTransactionReceipt])
      .provide([
        [matchers.call.fn(publicClient[network].readContract), tokenUri],
        [matchers.call(fetchWithTimeout, tokenUri), { json: () => metadata }],
      ])
      .put(
        addStandbyTransaction({
          __typename: 'NftTransferV3',
          type: TokenTransactionTypeV2.NftReceived,
          context: { id: mockTransactionHash },
          transactionHash: mockTransactionHash,
          networkId,
          nfts: [
            {
              tokenId: mockNftAllFields.tokenId,
              contractAddress: mockNftAllFields.contractAddress.toLowerCase(),
              tokenUri,
              metadata,
              media: [{ raw: metadata.image, gateway: metadata.image }],
            },
          ],
        })
      )
      .run()

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(JumpstartEvents.jumpstart_claimed_nft, {
      networkId,
      contractAddress: mockNftAllFields.contractAddress,
      tokenId: mockNftAllFields.tokenId,
    })
  })

  it('handles the error when reading tokenUri from ERC721 contract', async () => {
    jest.mocked(parseEventLogs).mockReturnValue(mockErc721Logs)

    await expectSaga(dispatchPendingERC721Transactions, networkId, [mockTransactionReceipt])
      .provide([[matchers.call.fn(publicClient[network].readContract), throwError(mockError)]])
      .run()

    expect(Logger.warn).toHaveBeenCalledWith(
      'WalletJumpstart/saga',
      'Error adding pending NFT transaction',
      mockError
    )
  })
})

describe('sendJumpstartTransactions', () => {
  const serializablePreparedTransactions = getSerializablePreparedTransactions([
    {
      from: '0xa',
      to: '0xb',
      value: BigInt(0),
      data: '0x0',
      gas: BigInt(59_480),
    },
    {
      from: '0xa',
      to: '0xc',
      value: BigInt(0),
      data: '0x0',
      gas: BigInt(1_325_000),
    },
  ])
  const mockDepositTxReceipt = {
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
  function createDefaultProviders(transactionStatus = 'success') {
    let waitForTransactionReceiptCallCount = 0
    const defaultProviders: (EffectProviders | StaticProvider)[] = [
      [
        matchers.call.fn(publicClient[network].waitForTransactionReceipt),
        dynamic(() => {
          waitForTransactionReceiptCallCount += 1
          return waitForTransactionReceiptCallCount > 1
            ? { ...mockDepositTxReceipt, status: transactionStatus }
            : mockApproveTxReceipt
        }),
      ],
    ]
    return defaultProviders
  }
  const expectedTrackedProperties = {
    amountInUsd: '1.00',
    localCurrency: 'PHP',
    localCurrencyExchangeRate: '1.33',
    networkId: 'celo-alfajores',
    tokenAmount: '1000000000000000000',
    tokenId: 'celo-alfajores:0x874069fa1eb16d44d622f2e0ca25eea172369bc1',
    tokenSymbol: 'cUSD',
  }

  beforeEach(() => {
    jest.mocked(getDynamicConfigParams).mockReturnValue(mockJumpstartRemoteConfig)
    jest.clearAllMocks()
  })

  it('should send the transactions and dispatch the success action', async () => {
    await expectSaga(sendJumpstartTransactions, {
      type: depositTransactionStarted.type,
      payload: {
        sendToken: mockCusdTokenBalance,
        sendAmount: '1000000000000000000',
        serializablePreparedTransactions,
      },
    })
      .withState(createMockStore().getState())
      .provide(createDefaultProviders())
      .put(depositTransactionSucceeded())
      .run()

    expect(sendPreparedTransactions).toHaveBeenCalledWith(
      serializablePreparedTransactions,
      'celo-alfajores',
      expect.any(Array)
    )
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      JumpstartEvents.jumpstart_send_start,
      expectedTrackedProperties
    )
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      JumpstartEvents.jumpstart_send_succeeded,
      expectedTrackedProperties
    )
  })

  it('should dispatch error if the transactions were reverted', async () => {
    await expectSaga(sendJumpstartTransactions, {
      type: depositTransactionStarted.type,
      payload: {
        sendToken: mockCusdTokenBalance,
        sendAmount: '1000000000000000000',
        serializablePreparedTransactions,
      },
    })
      .withState(createMockStore().getState())
      .provide(createDefaultProviders('reverted'))
      .put(depositTransactionFailed())
      .not.put(depositTransactionSucceeded())
      .run()

    expect(sendPreparedTransactions).toHaveBeenCalledWith(
      serializablePreparedTransactions,
      'celo-alfajores',
      expect.any(Array)
    )
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      JumpstartEvents.jumpstart_send_start,
      expectedTrackedProperties
    )
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      JumpstartEvents.jumpstart_send_failed,
      expectedTrackedProperties
    )
    expect(ValoraAnalytics.track).not.toHaveBeenCalledWith(
      JumpstartEvents.jumpstart_send_succeeded,
      expect.any(Object)
    )
  })
})

describe('jumpstartReclaim', () => {
  const mockSerializablePreparedTransaction = getSerializablePreparedTransaction({
    from: '0xa',
    to: '0xb',
    value: BigInt(0),
    data: '0x0',
    gas: BigInt(59_480),
  })
  const networkId = NetworkId['celo-alfajores']
  const depositTxHash = '0xaaa'

  it('should send the reclaim transaction and dispatch the success action on success', async () => {
    await expectSaga(jumpstartReclaim, {
      type: jumpstartReclaimStarted.type,
      payload: {
        tokenAmount: {
          value: 1000,
          tokenAddress: '0x123',
          tokenId: 'celo-alfajores:0x123',
        },
        networkId,
        reclaimTx: mockSerializablePreparedTransaction,
        depositTxHash,
      },
    })
      .provide([
        [matchers.call.fn(publicClient[network].waitForTransactionReceipt), mockTransactionReceipt],
      ])
      .withState(createMockStore().getState())
      .put(jumpstartReclaimSucceeded())
      .run()

    expect(sendPreparedTransactions).toHaveBeenCalledWith(
      [mockSerializablePreparedTransaction],
      networkId,
      expect.any(Array)
    )
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      JumpstartEvents.jumpstart_reclaim_succeeded,
      {
        networkId,
        depositTxHash,
        reclaimTxHash: '0x1',
      }
    )
  })

  it('should dispatch an error if the reclaim transaction is reverted', async () => {
    await expectSaga(jumpstartReclaim, {
      type: jumpstartReclaimStarted.type,
      payload: {
        tokenAmount: {
          value: 1000,
          tokenAddress: '0x123',
          tokenId: 'celo-alfajores:0x123',
        },
        networkId,
        reclaimTx: mockSerializablePreparedTransaction,
        depositTxHash,
      },
    })
      .provide([
        [
          matchers.call.fn(publicClient[network].waitForTransactionReceipt),
          { ...mockTransactionReceipt, status: 'reverted' },
        ],
      ])
      .withState(createMockStore().getState())
      .not.put(jumpstartReclaimSucceeded())
      .put(jumpstartReclaimFailed())
      .run()

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(JumpstartEvents.jumpstart_reclaim_failed, {
      networkId,
      depositTxHash,
    })
    expect(sendPreparedTransactions).toHaveBeenCalledWith(
      [mockSerializablePreparedTransaction],
      networkId,
      expect.any(Array)
    )
  })
})

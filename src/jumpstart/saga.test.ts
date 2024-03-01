import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { throwError } from 'redux-saga-test-plan/providers'
import { fork } from 'redux-saga/effects'
import { JumpstartEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { jumpstartLinkHandler } from 'src/jumpstart/jumpstartLinkHandler'
import {
  dispatchPendingERC20Transactions,
  dispatchPendingERC721Transactions,
  dispatchPendingTransactions,
  jumpstartClaim,
} from 'src/jumpstart/saga'
import {
  jumpstartClaimFailed,
  jumpstartClaimStarted,
  jumpstartClaimSucceeded,
} from 'src/jumpstart/slice'
import { getDynamicConfigParams } from 'src/statsig'
import { addStandbyTransaction } from 'src/transactions/actions'
import { Network, NetworkId, TokenTransactionTypeV2 } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import { publicClient } from 'src/viem'
import { createMockStore } from 'test/utils'
import {
  mockAccount,
  mockAccount2,
  mockAccountInvitePrivKey,
  mockCusdAddress,
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

const networkId = NetworkId['celo-alfajores']
const network = Network.Celo

const mockPrivateKey = mockAccountInvitePrivKey
const mockWalletAddress = mockAccount
const mockTransactionHashes = ['0xHASH1', '0xHASH2'] as Hash[]
const mockError = new Error('test error')
const mockTransactionReceipt = {
  transactionHash: '0xHASH1',
  logs: [],
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
      'WalletJumpstart',
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
      'WalletJumpstart',
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
      'WalletJumpstart',
      'Claimed unknown tokenId',
      'celo-alfajores:0xUNKNOWN'
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
              contractAddress: mockNftAllFields.contractAddress,
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
      'WalletJumpstart',
      'Error adding pending NFT transaction',
      mockError
    )
  })
})

import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { throwError } from 'redux-saga-test-plan/providers'
import { call, fork, select } from 'redux-saga/effects'
import { JumpstartEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { jumpstartLinkHandler } from 'src/jumpstart/jumpstartLinkHandler'
import { dispatchPendingTransactions, jumpstartClaim } from 'src/jumpstart/saga'
import {
  jumpstartClaimFailed,
  jumpstartClaimStarted,
  jumpstartClaimSucceeded,
} from 'src/jumpstart/slice'
import { addStandbyTransaction } from 'src/transactions/actions'
import { Network, NetworkId, TokenTransactionTypeV2 } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import { publicClient } from 'src/viem'
import { walletAddressSelector } from 'src/web3/selectors'
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
import { Hash, parseEventLogs } from 'viem'

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
const mockTransactionReceipt = { transactionHash: '0xHASH1', logs: [] }

describe('jumpstartClaim', () => {
  it('handles the happy path', async () => {
    await expectSaga(jumpstartClaim, mockPrivateKey)
      .provide([
        [select(walletAddressSelector), mockWalletAddress],
        [call(jumpstartLinkHandler, mockPrivateKey, mockWalletAddress), mockTransactionHashes],
        [fork(dispatchPendingTransactions, mockTransactionHashes), undefined],
      ])
      .put(jumpstartClaimStarted())
      .fork(dispatchPendingTransactions, mockTransactionHashes)
      .put(jumpstartClaimSucceeded())
      .run()

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(JumpstartEvents.jumpstart_started)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(JumpstartEvents.jumpstart_succeeded)
  })

  it('handles the error', async () => {
    await expectSaga(jumpstartClaim, mockPrivateKey)
      .provide([
        [select(walletAddressSelector), mockWalletAddress],
        [call(jumpstartLinkHandler, mockPrivateKey, mockWalletAddress), throwError(mockError)],
      ])
      .put(jumpstartClaimStarted())
      .put(jumpstartClaimFailed())
      .run()

    expect(Logger.error).toHaveBeenCalledWith(
      'WalletJumpstart',
      'Error handling jumpstart link',
      mockError
    )

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(JumpstartEvents.jumpstart_started)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(JumpstartEvents.jumpstart_failed)
  })
})

describe('dispatchPendingTransactions', () => {
  it('dispatches TokenTransferV3 standby transaction in response to ERC20Claimed logs event', () => {
    const mockTransactionHash = mockTransactionHashes[0]
    const mockParsedLogs = [
      {
        eventName: 'ERC20Claimed',
        address: mockAccount2,
        args: { token: mockCusdAddress, amount: '1000000000000000000' },
      },
    ] as unknown as ReturnType<typeof parseEventLogs>
    jest.mocked(parseEventLogs).mockReturnValue(mockParsedLogs)

    return expectSaga(dispatchPendingTransactions, [mockTransactionHash])
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
  })

  it('does not dispatch TokenTransferV3 standby transaction for unkown token', () => {
    const mockTransactionHash = mockTransactionHashes[0]
    const mockParsedLogs = [
      {
        eventName: 'ERC20Claimed',
        address: mockAccount2,
        args: { token: '0xUNKNOWN', amount: '1000000000000000000' },
      },
    ] as unknown as ReturnType<typeof parseEventLogs>
    jest.mocked(parseEventLogs).mockReturnValue(mockParsedLogs)

    return expectSaga(dispatchPendingTransactions, [mockTransactionHash])
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
      .not.put.like({ action: { type: 'ADD_STANDBY_TRANSACTION' } })
      .run()
  })

  it('dispatches NftTransferV3 standby transaction in response to ERC721Claimed logs event', () => {
    const mockTransactionHash = mockTransactionHashes[0]
    const mockParsedLogs = [
      {
        eventName: 'ERC721Claimed',
        address: mockAccount2,
        args: { token: mockNftAllFields.contractAddress, tokenId: mockNftAllFields.tokenId },
      },
    ] as unknown as ReturnType<typeof parseEventLogs>
    jest.mocked(parseEventLogs).mockReturnValue(mockParsedLogs)

    const tokenUri = 'https://example.com'
    const metadata = { ...mockNftAllFields.metadata }

    return expectSaga(dispatchPendingTransactions, [mockTransactionHash])
      .withState(
        createMockStore({
          tokens: {
            tokenBalances: mockTokenBalances,
          },
        }).getState()
      )
      .provide([
        [matchers.call.fn(publicClient[network].getTransactionReceipt), mockTransactionReceipt],
        [matchers.call.fn(publicClient[network].readContract), tokenUri],
        [call(fetchWithTimeout, tokenUri), { json: () => metadata }],
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
  })

  it('handles the error while getting transaction receipts', async () => {
    await expectSaga(dispatchPendingTransactions, [mockTransactionHashes[0]])
      .withState(
        createMockStore({
          tokens: {
            tokenBalances: mockTokenBalances,
          },
        }).getState()
      )
      .provide([
        [matchers.call.fn(publicClient[network].getTransactionReceipt), throwError(mockError)],
      ])
      .run()

    expect(Logger.error).toHaveBeenCalledWith(
      'WalletJumpstart',
      'Error dispatching jumpstart pending transactions',
      mockError
    )
  })

  it('handles the error while reading tokenUri from ERC721 contract', async () => {
    const mockTransactionHash = mockTransactionHashes[0]
    const mockParsedLogs = [
      {
        eventName: 'ERC721Claimed',
        address: mockAccount2,
        args: { token: mockNftAllFields.contractAddress, tokenId: mockNftAllFields.tokenId },
      },
    ] as unknown as ReturnType<typeof parseEventLogs>
    jest.mocked(parseEventLogs).mockReturnValue(mockParsedLogs)

    await expectSaga(dispatchPendingTransactions, [mockTransactionHash])
      .withState(
        createMockStore({
          tokens: {
            tokenBalances: mockTokenBalances,
          },
        }).getState()
      )
      .provide([
        [matchers.call.fn(publicClient[network].getTransactionReceipt), mockTransactionReceipt],
        [matchers.call.fn(publicClient[network].readContract), throwError(mockError)],
      ])
      .run()

    expect(Logger.error).toHaveBeenCalledWith(
      'WalletJumpstart',
      'Error adding jumpstart NFT pending transaction',
      mockError
    )
  })
})

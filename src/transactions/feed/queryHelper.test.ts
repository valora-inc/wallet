import { vibrateSuccess } from 'src/styles/hapticFeedback'
import { updateTransactions } from 'src/transactions/actions'
import { QueryResponse, handlePollResponse } from 'src/transactions/feed/queryHelper'
import { NetworkId, TokenTransaction, TransactionStatus } from 'src/transactions/types'

jest.mock('src/styles/hapticFeedback')

describe('handlePollResponse', () => {
  const dispatchSpy = jest.fn()

  const mockCompletedTransaction = {
    transactionHash: '0x123',
    status: TransactionStatus.Complete,
  } as TokenTransaction

  const mockPendingTransaction = {
    transactionHash: '0xabc',
    status: TransactionStatus.Pending,
  } as TokenTransaction

  const mockQueryResponse = (mockTransactions: TokenTransaction[]): QueryResponse => ({
    data: {
      tokenTransactionsV3: {
        transactions: mockTransactions,
        pageInfo: {
          startCursor: null,
          endCursor: null,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    },
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should update cached transactions and vibrate when there are new completed transactions', () => {
    const mockTransactions = [mockCompletedTransaction]
    handlePollResponse({
      pageInfo: {},
      setFetchedResult: jest.fn(),
      completedTxHashesByNetwork: {},
      pendingTxHashesByNetwork: {},
      dispatch: dispatchSpy,
    })(NetworkId['celo-mainnet'], mockQueryResponse(mockTransactions))

    expect(vibrateSuccess).toHaveBeenCalledTimes(1)
    expect(dispatchSpy).toHaveBeenCalledTimes(1)
    expect(dispatchSpy).toHaveBeenCalledWith(
      updateTransactions(NetworkId['celo-mainnet'], mockTransactions)
    )
  })

  it('should update cached transactions and vibrate when the cached transaction was in the pending status', () => {
    const mockTransactions = [mockCompletedTransaction]

    handlePollResponse({
      pageInfo: {},
      setFetchedResult: jest.fn(),
      completedTxHashesByNetwork: {},
      pendingTxHashesByNetwork: {
        [NetworkId['celo-mainnet']]: new Set([mockCompletedTransaction.transactionHash]),
      },
      dispatch: dispatchSpy,
    })(NetworkId['celo-mainnet'], mockQueryResponse(mockTransactions))

    expect(vibrateSuccess).toHaveBeenCalledTimes(1)
    expect(dispatchSpy).toHaveBeenCalledTimes(1)
    expect(dispatchSpy).toHaveBeenCalledWith(
      updateTransactions(NetworkId['celo-mainnet'], mockTransactions)
    )
  })

  it('should not update cached transactions when there are no new completed transactions', () => {
    const mockTransactions = [mockCompletedTransaction]

    handlePollResponse({
      pageInfo: {},
      setFetchedResult: jest.fn(),
      completedTxHashesByNetwork: {
        [NetworkId['celo-mainnet']]: new Set([mockCompletedTransaction.transactionHash]),
      },
      pendingTxHashesByNetwork: {},
      dispatch: dispatchSpy,
    })(NetworkId['celo-mainnet'], mockQueryResponse(mockTransactions))

    expect(dispatchSpy).not.toHaveBeenCalled()
    expect(vibrateSuccess).not.toHaveBeenCalled()
  })

  it('should update cached transactions without vibration when there are new pending transactions', () => {
    const mockTransactions = [mockPendingTransaction]
    handlePollResponse({
      pageInfo: {},
      setFetchedResult: jest.fn(),
      completedTxHashesByNetwork: {},
      pendingTxHashesByNetwork: {},
      dispatch: dispatchSpy,
    })(NetworkId['celo-mainnet'], mockQueryResponse(mockTransactions))

    expect(vibrateSuccess).not.toHaveBeenCalled()
    expect(dispatchSpy).toHaveBeenCalledTimes(1)
    expect(dispatchSpy).toHaveBeenCalledWith(
      updateTransactions(NetworkId['celo-mainnet'], mockTransactions)
    )
  })

  it('should not update cached transactions when there are no new pending transactions', () => {
    const mockTransactions = [mockPendingTransaction]

    handlePollResponse({
      pageInfo: {},
      setFetchedResult: jest.fn(),
      completedTxHashesByNetwork: {},
      pendingTxHashesByNetwork: {
        [NetworkId['celo-mainnet']]: new Set([mockPendingTransaction.transactionHash]),
      },
      dispatch: dispatchSpy,
    })(NetworkId['celo-mainnet'], mockQueryResponse(mockTransactions))

    expect(dispatchSpy).not.toHaveBeenCalled()
    expect(vibrateSuccess).not.toHaveBeenCalled()
  })
})

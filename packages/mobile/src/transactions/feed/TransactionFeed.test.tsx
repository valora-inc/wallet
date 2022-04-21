import { render, waitFor } from '@testing-library/react-native'
import { FetchMock } from 'jest-fetch-mock/types'
import React from 'react'
import { Provider } from 'react-redux'
import { RootState } from 'src/redux/reducers'
import TransactionFeed from 'src/transactions/feed/TransactionFeed'
import {
  StandbyTransaction,
  TokenTransaction,
  TokenTransactionTypeV2,
  TransactionStatus,
} from 'src/transactions/types'
import { createMockStore, RecursivePartial } from 'test/utils'
import { mockCusdAddress } from 'test/values'

const STAND_BY_TRANSACTION_SUBTITLE_KEY = 'confirmingTransaction'

const MOCK_STANDBY_TRANSACTIONS: StandbyTransaction[] = [
  {
    context: { id: 'test' },
    type: TokenTransactionTypeV2.Sent,
    status: TransactionStatus.Pending,
    value: '0.5',
    tokenAddress: mockCusdAddress,
    comment: '',
    timestamp: 1542300000,
    address: '0xd68360cce1f1ff696d898f58f03e0f1252f2ea33',
  },
]

const MOCK_RESPONSE: {
  data: { tokenTransactionsV2: { transactions: TokenTransaction[] } }
} = {
  data: {
    tokenTransactionsV2: {
      transactions: [
        {
          __typename: 'TokenTransferV2',
          address: '0xd68360cce1f1ff696d898f58f03e0f1252f2ea33',
          amount: {
            tokenAddress: mockCusdAddress,
            value: '0.1',
          },
          block: '8648978',
          fees: [],
          metadata: {},
          timestamp: 1542306118,
          transactionHash: '0x544367eaf2b01622dd1c7b75a6b19bf278d72127aecfb2e5106424c40c268e8b',
          type: TokenTransactionTypeV2.Received,
        },
      ],
    },
  },
}

describe('TransactionFeed', () => {
  const mockFetch = fetch as FetchMock
  beforeEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
    mockFetch.resetMocks()
  })

  function renderScreen(storeOverrides: RecursivePartial<RootState> = {}) {
    const store = createMockStore({
      ...storeOverrides,
    })

    const tree = render(
      <Provider store={store}>
        <TransactionFeed />
      </Provider>
    )

    return {
      store,
      ...tree,
    }
  }

  it('renders correctly when there is a response', async () => {
    mockFetch.mockResponse(JSON.stringify(MOCK_RESPONSE))

    const tree = renderScreen({})

    await waitFor(() => tree.getByTestId('TransactionList'))

    expect(tree.queryByTestId('NoActivity/loading')).toBeNull()
    expect(tree.queryByTestId('NoActivity/error')).toBeNull()

    expect(tree).toMatchSnapshot()
  })

  it("doesn't render transfers for tokens that we don't know about", async () => {
    mockFetch.mockResponse(JSON.stringify(MOCK_RESPONSE))

    const { getAllByTestId, getByTestId } = renderScreen({})

    await waitFor(() => getByTestId('TransactionList'))

    const items = getAllByTestId('TransferFeedItem/title')
    expect(items.length).toBe(1)
  })

  it('renders the loading indicator while it loads', async () => {
    const { getByTestId, queryByTestId } = renderScreen({})
    expect(getByTestId('NoActivity/loading')).toBeDefined()
    expect(queryByTestId('NoActivity/error')).toBeNull()
    expect(queryByTestId('TransactionList')).toBeNull()
  })

  it("renders an error screen if there's no cache and the query fails", async () => {
    mockFetch.mockReject(new Error('Test error'))

    const { getByTestId, queryByTestId } = renderScreen({})
    await waitFor(() => getByTestId('NoActivity/error'))
    expect(queryByTestId('NoActivity/loading')).toBeNull()
    expect(queryByTestId('TransactionList')).toBeNull()
  })

  it('renders the cache if there is one', async () => {
    mockFetch.mockReject(new Error('Test error'))

    const { getByTestId, queryByTestId } = renderScreen({
      transactions: {
        transactions: MOCK_RESPONSE.data.tokenTransactionsV2.transactions,
      },
    })

    expect(queryByTestId('NoActivity/loading')).toBeNull()
    expect(queryByTestId('NoActivity/error')).toBeNull()
    expect(getByTestId('TransactionList')).not.toBeNull()
  })

  it('renders correctly when there are confirmed transactions and stand by transactions', async () => {
    mockFetch.mockResponse(JSON.stringify(MOCK_RESPONSE))

    const tree = renderScreen({
      transactions: {
        standbyTransactions: MOCK_STANDBY_TRANSACTIONS,
      },
    })

    await waitFor(() => tree.getByTestId('TransactionList'))

    expect(tree.queryByTestId('NoActivity/loading')).toBeNull()
    expect(tree.queryByTestId('NoActivity/error')).toBeNull()

    const subtitles = tree.queryAllByTestId('TransferFeedItem/subtitle')

    const pendingSubtitles = subtitles.filter((node) =>
      node.children.some((ch) => ch === STAND_BY_TRANSACTION_SUBTITLE_KEY)
    )
    expect(pendingSubtitles.length).toBe(1)
  })
})

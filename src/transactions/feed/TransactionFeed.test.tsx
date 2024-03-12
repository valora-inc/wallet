import { fireEvent, render, waitFor, within } from '@testing-library/react-native'
import { FetchMock } from 'jest-fetch-mock/types'
import React from 'react'
import { Provider } from 'react-redux'
import { ReactTestInstance } from 'react-test-renderer'
import { RootState } from 'src/redux/reducers'
import { getFeatureGate } from 'src/statsig'
import { QueryResponse } from 'src/transactions/feed/queryHelper'
import TransactionFeed from 'src/transactions/feed/TransactionFeed'
import {
  NetworkId,
  StandbyTransaction,
  TokenTransaction,
  TokenTransactionTypeV2,
  TransactionStatus,
} from 'src/transactions/types'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore, RecursivePartial } from 'test/utils'
import { mockCusdAddress, mockCusdTokenId } from 'test/values'
import { mockApprovalTransaction } from 'test/values'

jest.mock('src/statsig', () => ({
  getFeatureGate: jest.fn(),
  getDynamicConfigParams: jest.fn(() => ({
    showCico: ['celo-alfajores'],
    showBalances: ['celo-alfajores'],
    showTransfers: ['celo-alfajores'],
    showApprovalTxsInHomefeed: ['celo-alfajores'],
  })),
}))

const mockTransaction = (transactionHash: string): TokenTransaction => {
  return {
    __typename: 'TokenTransferV3',
    networkId: NetworkId['celo-alfajores'],
    address: '0xd68360cce1f1ff696d898f58f03e0f1252f2ea33',
    amount: {
      tokenId: mockCusdTokenId,
      tokenAddress: mockCusdAddress,
      value: '0.1',
    },
    block: '8648978',
    fees: [],
    metadata: {},
    timestamp: 1542306118,
    transactionHash,
    type: TokenTransactionTypeV2.Received,
    status: TransactionStatus.Complete,
  }
}

const STAND_BY_TRANSACTION_SUBTITLE_KEY = 'confirmingTransaction'

const MOCK_STANDBY_TRANSACTION: StandbyTransaction = {
  __typename: 'TokenTransferV3',
  context: { id: 'test' },
  networkId: NetworkId['celo-alfajores'],
  type: TokenTransactionTypeV2.Sent,
  status: TransactionStatus.Pending,
  amount: {
    value: '0.5',
    tokenAddress: mockCusdAddress,
    tokenId: mockCusdTokenId,
  },
  metadata: {
    comment: '',
  },
  timestamp: 1542300000,
  address: '0xd68360cce1f1ff696d898f58f03e0f1252f2ea33',
}

const END_CURSOR = 'YXJyYXljb25uZWN0aW9uOjk='

const MOCK_EMPTY_RESPONSE: QueryResponse = {
  data: {
    tokenTransactionsV3: {
      pageInfo: {
        startCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
        endCursor: END_CURSOR,
        hasNextPage: true,
        hasPreviousPage: false,
      },
      transactions: [],
    },
  },
}

const MOCK_EMPTY_RESPONSE_NO_NEXT_PAGE: QueryResponse = {
  data: {
    tokenTransactionsV3: {
      pageInfo: {
        startCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
        endCursor: END_CURSOR,
        hasNextPage: false,
        hasPreviousPage: false,
      },
      transactions: [],
    },
  },
}

const MOCK_RESPONSE: QueryResponse = {
  data: {
    tokenTransactionsV3: {
      pageInfo: {
        startCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
        endCursor: END_CURSOR,
        hasNextPage: true,
        hasPreviousPage: false,
      },
      transactions: [
        mockTransaction('0x544367eaf2b01622dd1c7b75a6b19bf278d72127aecfb2e5106424c40c268e8b2'),
      ],
    },
  },
}

const MOCK_RESPONSE_NO_NEXT_PAGE: QueryResponse = {
  data: {
    tokenTransactionsV3: {
      pageInfo: {
        startCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
        endCursor: END_CURSOR,
        hasNextPage: false,
        hasPreviousPage: false,
      },
      transactions: [
        mockTransaction('0x544367eaf2b01622dd1c7b75a6b19bf278d72127aecfb2e5106424c40c268e8b'),
      ],
    },
  },
}

const MOCK_RESPONSE_MANY_ITEMS: QueryResponse = {
  data: {
    tokenTransactionsV3: {
      pageInfo: {
        startCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
        endCursor: END_CURSOR,
        hasNextPage: true,
        hasPreviousPage: false,
      },
      transactions: [...Array(10).keys()].map((id) => mockTransaction(id.toString())),
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

  function getNumTransactionItems(sectionList: ReactTestInstance) {
    // data[0] is the first section in the section list - all mock transactions
    // are for the same section / date
    return sectionList.props.data[0].data.length
  }

  it('only renders approval txs from supported networks', async () => {
    mockFetch.mockResponse(JSON.stringify(MOCK_EMPTY_RESPONSE_NO_NEXT_PAGE))

    const tree = renderScreen({
      transactions: {
        transactionsByNetworkId: {
          [NetworkId['ethereum-sepolia']]: [mockApprovalTransaction],
          [NetworkId['celo-alfajores']]: [
            {
              ...mockApprovalTransaction,
              networkId: NetworkId['celo-alfajores'],
              transactionHash: '0xfoo',
            },
          ],
        },
        standbyTransactions: [],
      },
    })
    await waitFor(() => expect(tree.getByTestId('TransactionList').props.data.length).toBe(1))

    expect(tree.queryByTestId('NoActivity/loading')).toBeNull()
    expect(tree.queryByTestId('NoActivity/error')).toBeNull()
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(tree.getAllByTestId(new RegExp('TokenApprovalFeedItem', 'i')).length).toBe(1)
    expect(tree.queryByTestId(`TokenApprovalFeedItem/0xfoo`)).not.toBeNull()
  })

  it('renders correctly when there is a response', async () => {
    mockFetch.mockResponse(JSON.stringify(MOCK_RESPONSE_NO_NEXT_PAGE))

    const tree = renderScreen({})
    await waitFor(() => expect(tree.getByTestId('TransactionList').props.data.length).toBe(1))

    expect(tree.queryByTestId('NoActivity/loading')).toBeNull()
    expect(tree.queryByTestId('NoActivity/error')).toBeNull()
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(tree.getAllByTestId('TransferFeedItem').length).toBe(1)
    expect(
      within(tree.getByTestId('TransferFeedItem')).getByTestId('TransferFeedItem/title')
    ).toHaveTextContent(
      'feedItemReceivedTitle, {"displayName":"feedItemAddress, {\\"address\\":\\"0xd683...ea33\\"}"}'
    )
  })

  it('renders correctly with completed standby transactions', async () => {
    mockFetch.mockResponse(JSON.stringify(MOCK_RESPONSE_NO_NEXT_PAGE))

    const tree = renderScreen({
      transactions: {
        standbyTransactions: [
          {
            ...MOCK_STANDBY_TRANSACTION,
            status: TransactionStatus.Complete,
            transactionHash: '0x544367eaf2b01622dd1c7b75a6b19bf278d72127aecfb2e5106424c40c268e8bxx',
            block: '8888',
            fees: [],
          },
        ],
      },
    })

    await waitFor(() => expect(tree.getAllByTestId('TransferFeedItem').length).toBe(2))
  })

  it("doesn't render transfers for tokens that we don't know about", async () => {
    mockFetch.mockResponse(JSON.stringify(MOCK_RESPONSE_NO_NEXT_PAGE))

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
        transactionsByNetworkId: {
          [networkConfig.defaultNetworkId]: MOCK_RESPONSE.data.tokenTransactionsV3.transactions,
        },
      },
    })

    expect(queryByTestId('NoActivity/loading')).toBeNull()
    expect(queryByTestId('NoActivity/error')).toBeNull()
    expect(getByTestId('TransactionList')).not.toBeNull()
  })

  it('renders correctly when there are confirmed transactions and stand by transactions', async () => {
    mockFetch.mockResponse(JSON.stringify(MOCK_RESPONSE_NO_NEXT_PAGE))

    const tree = renderScreen({
      transactions: {
        standbyTransactions: [MOCK_STANDBY_TRANSACTION],
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

  it('tries to fetch 10 transactions, unless the end is reached', async () => {
    mockFetch.mockImplementation((url: any, request: any) => {
      const body: string = request.body
      let response = ''
      if (body.includes(END_CURSOR)) {
        response = JSON.stringify(MOCK_RESPONSE_NO_NEXT_PAGE)
      } else {
        response = JSON.stringify(MOCK_RESPONSE)
      }
      return Promise.resolve(new Response(response))
    })

    const tree = renderScreen({})

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))
    expect(getNumTransactionItems(tree.getByTestId('TransactionList'))).toBe(2)
  })

  it('tries to fetch 10 transactions, and stores empty pages', async () => {
    mockFetch.mockImplementation((url: any, request: any) => {
      const body: string = request.body
      let response = ''
      if (body.includes(END_CURSOR)) {
        response = JSON.stringify(MOCK_RESPONSE_NO_NEXT_PAGE)
      } else {
        response = JSON.stringify(MOCK_EMPTY_RESPONSE)
      }
      return Promise.resolve(new Response(response))
    })

    const tree = renderScreen({})

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))
    expect(getNumTransactionItems(tree.getByTestId('TransactionList'))).toBe(1)
  })

  it('fetches the next page by scrolling to the end of the list', async () => {
    mockFetch.mockImplementation((url: any, request: any) => {
      const body: string = request.body
      let response = ''
      if (body.includes(END_CURSOR)) {
        response = JSON.stringify(MOCK_RESPONSE_NO_NEXT_PAGE)
      } else {
        response = JSON.stringify(MOCK_RESPONSE_MANY_ITEMS)
      }
      return Promise.resolve(new Response(response))
    })

    const tree = renderScreen({})
    await waitFor(() => tree.getByTestId('TransactionList'))

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(getNumTransactionItems(tree.getByTestId('TransactionList'))).toBe(10)

    fireEvent(tree.getByTestId('TransactionList'), 'onEndReached')
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))
    expect(getNumTransactionItems(tree.getByTestId('TransactionList'))).toBe(11)
  })

  it('fetches the next page automatically if there are no transactions returned and next page exists', async () => {
    let mockFetchCount = 0
    mockFetch.mockImplementation(() => {
      let response = ''
      switch (mockFetchCount) {
        case 1:
          response = JSON.stringify(MOCK_EMPTY_RESPONSE)
          break
        case 2:
          response = JSON.stringify(MOCK_RESPONSE)
          break
        default:
          response = JSON.stringify(MOCK_RESPONSE_MANY_ITEMS)
      }
      mockFetchCount += 1
      return Promise.resolve(new Response(response))
    })

    const tree = renderScreen({})
    await waitFor(() => tree.getByTestId('TransactionList'))

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(getNumTransactionItems(tree.getByTestId('TransactionList'))).toBe(10)

    fireEvent(tree.getByTestId('TransactionList'), 'onEndReached')
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(3))
    expect(getNumTransactionItems(tree.getByTestId('TransactionList'))).toBe(11)
  })

  it('renders GetStarted if SHOW_GET_STARTED is enabled and transaction feed is empty', async () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
    const { getByTestId } = renderScreen({
      app: {
        superchargeApy: 12,
      },
    })
    expect(getByTestId('GetStarted')).toBeDefined()
  })

  it('renders NoActivity by default if transaction feed is empty', async () => {
    jest.mocked(getFeatureGate).mockReturnValue(false)
    const { getByTestId, getByText } = renderScreen({})
    expect(getByTestId('NoActivity/loading')).toBeDefined()
    expect(getByText('noTransactionActivity')).toBeTruthy()
  })
})

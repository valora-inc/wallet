import { fireEvent, render, waitFor, within } from '@testing-library/react-native'
import { FetchMock } from 'jest-fetch-mock/types'
import React from 'react'
import Toast from 'react-native-simple-toast'
import { Provider } from 'react-redux'
import { ReactTestInstance } from 'react-test-renderer'
import { RootState } from 'src/redux/reducers'
import { reducersList } from 'src/redux/reducersList'
import { getDynamicConfigParams, getFeatureGate, getMultichainFeatures } from 'src/statsig'
import TransactionFeedV2 from 'src/transactions/feed/TransactionFeedV2'
import {
  NetworkId,
  TokenTransaction,
  TokenTransactionTypeV2,
  TransactionStatus,
} from 'src/transactions/types'
import { mockCusdAddress, mockCusdTokenId } from 'test/values'

import { ApiReducersKeys } from 'src/redux/apiReducersList'
import { transactionFeedV2Api, type TransactionFeedV2Response } from 'src/transactions/api'
import { setupApiStore } from 'src/transactions/apiTestHelpers'
import { RecursivePartial } from 'test/utils'

jest.mock('src/statsig')
jest.mock('react-native-simple-toast')

const STAND_BY_TRANSACTION_SUBTITLE_KEY = 'confirmingTransaction'
const mockFetch = fetch as FetchMock

function mockTransaction(data?: Partial<TokenTransaction>): TokenTransaction {
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
    transactionHash: '0x544367eaf2b01622dd1c7b75a6b19bf278d72127aecfb2e5106424c40c268e8b2',
    type: TokenTransactionTypeV2.Received,
    status: TransactionStatus.Complete,
    ...(data as any),
  }
}

function getNumTransactionItems(sectionList: ReactTestInstance) {
  // data[0] is the first section in the section list - all mock transactions
  // are for the same section / date
  return sectionList.props.data[0].data.length
}

const typedResponse = (response: Partial<TransactionFeedV2Response>) => JSON.stringify(response)

function renderScreen(storeOverrides: RecursivePartial<Omit<RootState, ApiReducersKeys>> = {}) {
  const state: typeof storeOverrides = {
    web3: { account: '0x00' },
    ...storeOverrides,
  }
  const storeRef = setupApiStore(transactionFeedV2Api, state, reducersList)

  const tree = render(
    <Provider store={storeRef.store}>
      <TransactionFeedV2 />
    </Provider>
  )

  return {
    ...tree,
    store: storeRef.store,
  }
}

beforeEach(() => {
  mockFetch.resetMocks()
  jest.clearAllMocks()
  jest.mocked(getMultichainFeatures).mockReturnValue({
    showCico: [NetworkId['celo-alfajores']],
    showBalances: [NetworkId['celo-alfajores']],
    showTransfers: [NetworkId['celo-alfajores']],
    showApprovalTxsInHomefeed: [NetworkId['celo-alfajores']],
  })
  jest.mocked(getDynamicConfigParams).mockReturnValue({
    jumpstartContracts: {
      ['celo-alfajores']: { contractAddress: '0x7bf3fefe9881127553d23a8cd225a2c2442c438c' },
    },
  })
})

describe('TransactionFeedV2', () => {
  it('renders correctly when there is a response', async () => {
    mockFetch.mockResponse(typedResponse({ transactions: [mockTransaction()] }))
    const { store, ...tree } = renderScreen()

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
    mockFetch.mockResponse(typedResponse({ transactions: [mockTransaction()] }))

    const tree = renderScreen({
      transactions: {
        standbyTransactions: [mockTransaction({ transactionHash: '0x10' })],
      },
    })

    await waitFor(() => expect(tree.getAllByTestId('TransferFeedItem').length).toBe(2))
  })

  it("doesn't render transfers for tokens that we don't know about", async () => {
    mockFetch.mockResponse(typedResponse({ transactions: [mockTransaction()] }))
    const { store, ...tree } = renderScreen()

    await waitFor(() => tree.getByTestId('TransactionList'))
    const items = tree.getAllByTestId('TransferFeedItem/title')
    expect(items.length).toBe(1)
  })

  it('renders the loading indicator while it loads', async () => {
    const tree = renderScreen()
    expect(tree.getByTestId('NoActivity/loading')).toBeDefined()
    expect(tree.queryByTestId('NoActivity/error')).toBeNull()
    expect(tree.queryByTestId('TransactionList')).toBeNull()
  })

  it("renders an error screen if there's no cache and the query fails", async () => {
    mockFetch.mockReject(new Error('Test error'))
    const tree = renderScreen()

    await waitFor(() => tree.getByTestId('NoActivity/error'))
    expect(tree.queryByTestId('NoActivity/loading')).toBeNull()
    expect(tree.queryByTestId('TransactionList')).toBeNull()
  })

  it('renders correctly when there are confirmed transactions and stand by transactions', async () => {
    mockFetch.mockResponse(typedResponse({ transactions: [mockTransaction()] }))

    const tree = renderScreen({
      transactions: {
        standbyTransactions: [
          mockTransaction({ transactionHash: '0x10', status: TransactionStatus.Pending }),
        ],
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

  it('renders correct status for a complete transaction', async () => {
    mockFetch.mockResponse(typedResponse({ transactions: [mockTransaction()] }))
    const tree = renderScreen()

    await waitFor(() => tree.getByTestId('TransactionList'))
    expect(tree.getByText('feedItemReceivedInfo, {"context":"noComment"}')).toBeTruthy()
  })

  it('renders correct status for a failed transaction', async () => {
    mockFetch.mockResponse(
      typedResponse({ transactions: [mockTransaction({ status: TransactionStatus.Failed })] })
    )

    const tree = renderScreen()

    await waitFor(() => tree.getByTestId('TransactionList'))
    expect(tree.getByText('feedItemFailedTransaction')).toBeTruthy()
  })

  it('tries to fetch pages until the end is reached', async () => {
    mockFetch
      .mockResponseOnce(
        typedResponse({
          transactions: [mockTransaction({ transactionHash: '0x01', timestamp: 10 })],
        })
      )
      .mockResponseOnce(
        typedResponse({
          transactions: [mockTransaction({ transactionHash: '0x02', timestamp: 20 })],
        })
      )
      .mockResponseOnce(typedResponse({ transactions: [] }))

    const { store, ...tree } = renderScreen()

    await waitFor(() => tree.getByTestId('TransactionList'))
    fireEvent(tree.getByTestId('TransactionList'), 'onEndReached')
    await waitFor(() => expect(mockFetch).toBeCalled())
    await waitFor(() => expect(tree.getByTestId('TransactionList/loading')).toBeVisible())
    await waitFor(() => expect(tree.queryByTestId('TransactionList/loading')).toBeFalsy())

    fireEvent(tree.getByTestId('TransactionList'), 'onEndReached')
    await waitFor(() => expect(mockFetch).toBeCalled())
    await waitFor(() => expect(tree.getByTestId('TransactionList/loading')).toBeVisible())
    await waitFor(() => expect(tree.queryByTestId('TransactionList/loading')).toBeFalsy())

    expect(mockFetch).toHaveBeenCalledTimes(3)
    expect(getNumTransactionItems(tree.getByTestId('TransactionList'))).toBe(2)
  })

  it('renders GetStarted if SHOW_GET_STARTED is enabled and transaction feed is empty', async () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
    const tree = renderScreen()
    expect(tree.getByTestId('GetStarted')).toBeDefined()
  })

  it('renders NoActivity by default if transaction feed is empty', async () => {
    jest.mocked(getFeatureGate).mockReturnValue(false)
    const tree = renderScreen()
    expect(tree.getByTestId('NoActivity/loading')).toBeDefined()
    expect(tree.getByText('noTransactionActivity')).toBeTruthy()
  })

  it('useStandByTransactions properly splits pending/confirmed transactions', async () => {
    mockFetch.mockResponse(
      typedResponse({
        transactions: [
          mockTransaction({ transactionHash: '0x4000000' }), // confirmed
          mockTransaction({ transactionHash: '0x3000000' }), // confirmed
          mockTransaction({ transactionHash: '0x2000000' }), // confirmed
          mockTransaction({ transactionHash: '0x1000000' }), // confirmed
        ],
      })
    )

    const { store, ...tree } = renderScreen({
      transactions: {
        standbyTransactions: [
          mockTransaction({ transactionHash: '0x10', status: TransactionStatus.Complete }), // confirmed
          mockTransaction({ transactionHash: '0x20', status: TransactionStatus.Complete }), // confirmed
          mockTransaction({ transactionHash: '0x30', status: TransactionStatus.Pending }), // pending
          mockTransaction({ transactionHash: '0x40', status: TransactionStatus.Pending }), // pending
          mockTransaction({ transactionHash: '0x50', status: TransactionStatus.Failed }), // confirmed
        ],
      },
    })

    await waitFor(() => {
      expect(tree.getByTestId('TransactionList').props.data.length).toBe(2)
    })

    // from total of 9 transactions there should be 2 pending in a "recent" section
    expect(tree.getByTestId('TransactionList').props.data[0].data.length).toBe(2)
    // from total of 9 transactions there should be 7 confirmed in a "general" section
    expect(tree.getByTestId('TransactionList').props.data[1].data.length).toBe(7)
  })

  it('merges only those stand by transactions that fit the timeline between min/max timestamps of the page', async () => {
    mockFetch.mockResponse(
      typedResponse({
        transactions: [
          mockTransaction({ transactionHash: '0x4000000', timestamp: 49 }), // max
          mockTransaction({ transactionHash: '0x3000000', timestamp: 47 }),
          mockTransaction({ transactionHash: '0x2000000', timestamp: 25 }),
          mockTransaction({ transactionHash: '0x1000000', timestamp: 21 }), // min
        ],
      })
    )

    const { store, ...tree } = renderScreen({
      transactions: {
        standbyTransactions: [
          mockTransaction({ transactionHash: '0x10', timestamp: 10 }), // not in scope
          mockTransaction({ transactionHash: '0x20', timestamp: 20 }), // not in scope
          mockTransaction({ transactionHash: '0x30', timestamp: 30 }), // in scope
          mockTransaction({ transactionHash: '0x40', timestamp: 40 }), // in scope
          /**
           * this is the latest transactions which means that it will be outside of the scope
           * of the max timestamp of the first page. But if it is the first page of the feed -
           * it should also be merged in as zerion still might not include it in the response
           * for some time.
           */
          mockTransaction({ transactionHash: '0x50', timestamp: 50 }), // in scope
        ],
      },
    })

    await waitFor(() => tree.getByTestId('TransactionList'))
    expect(getNumTransactionItems(tree.getByTestId('TransactionList'))).toBe(7)
  })

  it('cleanup is triggered for confirmed stand by transactions', async () => {
    mockFetch.mockResponse(typedResponse({ transactions: [mockTransaction()] }))
    const { store } = renderScreen({
      transactions: { standbyTransactions: [mockTransaction()] },
    })

    /**
     * For now, there's no way to check for dispatched actions via getActions as we usually do
     * as the current setupApiStore doesn't return it. But at least we can make sure that the
     * transaction gets removed.
     */
    await waitFor(() => expect(store.getState().transactions.standbyTransactions.length).toBe(0))
  })

  it('should show stand by transactions if paginated data is empty', async () => {
    mockFetch.mockResponse(typedResponse({ transactions: [] }))
    const { store, ...tree } = renderScreen({
      transactions: {
        standbyTransactions: [
          mockTransaction({ transactionHash: '0x01', status: TransactionStatus.Complete }),
          mockTransaction({ transactionHash: '0x02', status: TransactionStatus.Pending }),
        ],
      },
    })

    await waitFor(() => expect(tree.getByTestId('TransactionList').props.data.length).toBe(2))
    expect(tree.getByTestId('TransactionList').props.data[0].data.length).toBe(1)
    expect(tree.getByTestId('TransactionList').props.data[1].data.length).toBe(1)
  })

  it('should show "no transactions" toast if there is more than MIN_NUM_TRANSACTIONS transactions for the first page', async () => {
    mockFetch
      .mockResponseOnce(
        typedResponse({
          transactions: [
            mockTransaction({ transactionHash: '0x01' }),
            mockTransaction({ transactionHash: '0x02' }),
            mockTransaction({ transactionHash: '0x03' }),
            mockTransaction({ transactionHash: '0x04' }),
            mockTransaction({ transactionHash: '0x05' }),
            mockTransaction({ transactionHash: '0x06' }),
            mockTransaction({ transactionHash: '0x07' }),
            mockTransaction({ transactionHash: '0x08' }),
            mockTransaction({ transactionHash: '0x09' }),
            mockTransaction({ transactionHash: '0x10' }),
            mockTransaction({ transactionHash: '0x11' }),
          ],
        })
      )
      .mockResponseOnce(typedResponse({ transactions: [] }))

    const { store, ...tree } = renderScreen()

    await waitFor(() => tree.getByTestId('TransactionList'))
    fireEvent(tree.getByTestId('TransactionList'), 'onEndReached')
    await waitFor(() => expect(mockFetch).toBeCalled())
    await waitFor(() => expect(tree.getByTestId('TransactionList/loading')).toBeVisible())
    await waitFor(() => expect(tree.queryByTestId('TransactionList/loading')).toBeFalsy())

    fireEvent(tree.getByTestId('TransactionList'), 'onEndReached')
    await waitFor(() => expect(Toast.showWithGravity).toBeCalledTimes(1))
  })

  it('should show "no transactions" toast if there is no more transactions after the second page', async () => {
    mockFetch
      .mockResponseOnce(
        typedResponse({
          transactions: [
            mockTransaction({ transactionHash: '0x01', timestamp: 50 }),
            mockTransaction({ transactionHash: '0x02', timestamp: 49 }),
            mockTransaction({ transactionHash: '0x03', timestamp: 48 }),
            mockTransaction({ transactionHash: '0x04', timestamp: 47 }),
            mockTransaction({ transactionHash: '0x05', timestamp: 46 }),
            mockTransaction({ transactionHash: '0x06', timestamp: 45 }),
            mockTransaction({ transactionHash: '0x07', timestamp: 44 }),
            mockTransaction({ transactionHash: '0x08', timestamp: 43 }),
            mockTransaction({ transactionHash: '0x09', timestamp: 42 }),
            mockTransaction({ transactionHash: '0x10', timestamp: 41 }),
            mockTransaction({ transactionHash: '0x11', timestamp: 40 }),
          ],
        })
      )
      .mockResponseOnce(
        typedResponse({
          transactions: [
            mockTransaction({ transactionHash: '0x12', timestamp: 39 }),
            mockTransaction({ transactionHash: '0x13', timestamp: 38 }),
            mockTransaction({ transactionHash: '0x14', timestamp: 37 }),
          ],
        })
      )
      .mockResponseOnce(typedResponse({ transactions: [] }))

    const { store, ...tree } = renderScreen()

    await waitFor(() => tree.getByTestId('TransactionList'))
    fireEvent(tree.getByTestId('TransactionList'), 'onEndReached')
    await waitFor(() => expect(mockFetch).toBeCalled())
    await waitFor(() => expect(tree.getByTestId('TransactionList/loading')).toBeVisible())
    await waitFor(() => expect(tree.queryByTestId('TransactionList/loading')).toBeFalsy())

    fireEvent(tree.getByTestId('TransactionList'), 'onEndReached')
    await waitFor(() => expect(mockFetch).toBeCalled())
    await waitFor(() => expect(tree.getByTestId('TransactionList/loading')).toBeVisible())
    await waitFor(() => expect(tree.queryByTestId('TransactionList/loading')).toBeFalsy())

    fireEvent(tree.getByTestId('TransactionList'), 'onEndReached')
    await waitFor(() => expect(Toast.showWithGravity).toBeCalledTimes(1))
  })

  it('should not show "no transactions" toast if there are still data in next pages', async () => {
    mockFetch
      .mockResponseOnce(
        typedResponse({
          transactions: [mockTransaction({ transactionHash: '0x01', timestamp: 50 })],
        })
      )
      .mockResponseOnce(
        typedResponse({
          transactions: [mockTransaction({ transactionHash: '0x12', timestamp: 39 })],
        })
      )

    const { store, ...tree } = renderScreen()

    await waitFor(() => tree.getByTestId('TransactionList'))
    fireEvent(tree.getByTestId('TransactionList'), 'onEndReached')
    await waitFor(() => expect(mockFetch).toBeCalled())
    await waitFor(() => expect(tree.getByTestId('TransactionList/loading')).toBeVisible())
    await waitFor(() => expect(tree.queryByTestId('TransactionList/loading')).toBeFalsy())
    await waitFor(() => expect(Toast.showWithGravity).toBeCalledTimes(0))
  })
})

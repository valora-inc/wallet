import { fireEvent, render, waitFor, within } from '@testing-library/react-native'
import { FetchMock } from 'jest-fetch-mock/types'
import React from 'react'
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

const mockTransaction = (data?: Partial<TokenTransaction>): TokenTransaction => {
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

const mockFetch = fetch as FetchMock

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

describe('TransactionFeed', () => {
  mockFetch.mockResponse(typedResponse({}))
  it('renders correctly when there is a response', async () => {
    mockFetch.mockResponse(typedResponse({ transactions: [mockTransaction()] }))

    const { store, ...tree } = renderScreen()

    await store.dispatch(
      transactionFeedV2Api.endpoints.transactionFeedV2.initiate({ address: '0x00', endCursor: 0 })
    )

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

  it("doesn't render transfers for tokens that we don't know about", async () => {
    mockFetch.mockResponse(typedResponse({ transactions: [mockTransaction()] }))

    const { store, ...tree } = renderScreen()

    await store.dispatch(
      transactionFeedV2Api.endpoints.transactionFeedV2.initiate({ address: '0x00', endCursor: 0 })
    )

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

  it('tries to fetch 20 transactions, unless the end is reached', async () => {
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

  it('tries to fetch 10 transactions, and stores empty pages', async () => {
    mockFetch
      .mockResponseOnce(typedResponse({ transactions: [mockTransaction()] }))
      .mockResponseOnce(typedResponse({ transactions: [] }))

    const { store, ...tree } = renderScreen()

    await store.dispatch(
      transactionFeedV2Api.endpoints.transactionFeedV2.initiate({ address: '0x00', endCursor: 0 })
    )
    await store.dispatch(
      transactionFeedV2Api.endpoints.transactionFeedV2.initiate({ address: '0x00', endCursor: 123 })
    )

    await waitFor(() => tree.getByTestId('TransactionList'))

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))
    expect(getNumTransactionItems(tree.getByTestId('TransactionList'))).toBe(1)
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
})

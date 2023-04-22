import { MockedProvider } from '@apollo/react-testing'
import { render, waitFor } from '@testing-library/react-native'
import { InMemoryCache, IntrospectionFragmentMatcher } from 'apollo-boost'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Provider } from 'react-redux'
import {
  introspectionQueryResultData,
  TokenTransactionType,
  UserTransactionsQuery,
} from 'src/apollo/types'
import TransactionFeed from 'src/transactions/TransactionFeed'
import TransactionsList, { TRANSACTIONS_QUERY } from 'src/transactions/TransactionsList'
import { StandbyTransactionLegacy, TransactionStatus } from 'src/transactions/types'
import { CURRENCIES, Currency } from 'src/utils/currencies'
import { createMockStore } from 'test/utils'

jest.unmock('react-apollo')

const newFragmentMatcher = new IntrospectionFragmentMatcher({
  introspectionQueryResultData,
})

const mockCache = new InMemoryCache({ fragmentMatcher: newFragmentMatcher })

const standbyTransactions: StandbyTransactionLegacy[] = [
  {
    context: { id: 'a-standby-tx-id' },
    type: TokenTransactionType.Sent,
    comment: 'Eye for an Eye',
    status: TransactionStatus.Pending,
    value: '100',
    currency: Currency.Dollar,
    timestamp: 1542406110,
    address: '0072bvy2o23u',
  },
]

const failedStandbyTransactions: StandbyTransactionLegacy[] = [
  {
    context: { id: 'a-failed-standby-tx-id' },
    status: TransactionStatus.Failed,
    value: '100',
    currency: Currency.Dollar,
    comment: 'Dinner Payment!',
    timestamp: 1542406110,
    type: TokenTransactionType.Sent,
    address: '0072bvy2o23u',
  },
]

const pendingStandbyTransactions: StandbyTransactionLegacy[] = [
  {
    context: { id: 'a-standby-tx-id' },
    hash: '0x4607df6d11e63bb024cf1001956de7b6bd7adc253146f8412e8b3756752b8353',
    type: TokenTransactionType.Sent,
    comment: 'Hi',
    status: TransactionStatus.Pending,
    value: '0.2',
    currency: Currency.Dollar,
    timestamp: 1578530538,
    address: '0xce10ce10ce10ce10ce10ce10ce10ce10ce10ce10',
  },
]

const mockQueryData: UserTransactionsQuery = {
  __typename: 'Query',
  tokenTransactions: {
    __typename: 'TokenTransactionConnection',
    edges: [
      {
        __typename: 'TokenTransactionEdge',
        node: {
          __typename: 'TokenTransfer',
          type: TokenTransactionType.Sent,
          hash: '0x4607df6d11e63bb024cf1001956de7b6bd7adc253146f8412e8b3756752b8353',
          amount: {
            __typename: 'MoneyAmount',
            value: '-0.2',
            currencyCode: 'cUSD',
            localAmount: {
              __typename: 'LocalMoneyAmount',
              value: '-0.2',
              currencyCode: 'USD',
              exchangeRate: '1',
            },
          },
          timestamp: 1578530538,
          address: '0xce10ce10ce10ce10ce10ce10ce10ce10ce10ce10',
          account: '0xsflkj',
          comment: 'Hi',
          defaultImage: null,
          defaultName: null,
        },
      },
      {
        __typename: 'TokenTransactionEdge',
        node: {
          __typename: 'TokenTransfer',
          type: TokenTransactionType.Sent,
          hash: '0x4607df6d11e63bb024cf1001956de7b6bd7adc253146f8412e8b3756752b8353',
          amount: {
            __typename: 'MoneyAmount',
            value: '-0.2',
            currencyCode: 'cEUR',
            localAmount: {
              __typename: 'LocalMoneyAmount',
              value: '-0.24',
              currencyCode: 'USD',
              exchangeRate: '1.2',
            },
          },
          timestamp: 1578630538,
          address: '0xce10ce10ce10ce10ce10ce10ce10ce10ce10ce10',
          account: '0xsflkj',
          comment: null,
          defaultImage: null,
          defaultName: null,
        },
      },
    ],
  },
}

const variables = {
  address: '0x0000000000000000000000000000000000007e57',
  tokens: Object.keys(CURRENCIES),
  localCurrencyCode: 'PHP',
}

const mocks = [
  {
    request: {
      query: TRANSACTIONS_QUERY,
      variables,
    },
    result: {
      data: mockQueryData,
    },
  },
]

beforeEach(() => {
  // According to the react-native-testing-library docs, if we're using
  // fake timers, tests that use async/await will stall.
  jest.useRealTimers()
})

it('renders the received data along with the standby transactions', async () => {
  const store = createMockStore({
    transactions: { standbyTransactionsLegacy: standbyTransactions },
  })

  const { UNSAFE_getByType, toJSON } = render(
    <Provider store={store}>
      <MockedProvider mocks={mocks} addTypename={true} cache={mockCache}>
        <TransactionsList />
      </MockedProvider>
    </Provider>
  )
  await waitFor(() => expect(UNSAFE_getByType(TransactionFeed).props.data.length).toEqual(3))
  const feed = await waitFor(() => UNSAFE_getByType(TransactionFeed))
  const { data } = feed.props
  expect(data.length).toEqual(3)

  // Check standby transfer
  const standbyTransfer = data[0]
  expect(standbyTransfer.amount).toMatchObject({
    value: new BigNumber(-100),
    currencyCode: 'cUSD',
    localAmount: {
      value: new BigNumber(-133),
      currencyCode: 'PHP',
      exchangeRate: '1.33',
    },
  })

  expect(toJSON()).toMatchSnapshot()
})

it('ignores pending standby transactions that are completed in the response', async () => {
  const store = createMockStore({
    transactions: { standbyTransactionsLegacy: pendingStandbyTransactions },
  })

  expect(store.getActions()).toEqual([])

  const { UNSAFE_getByType, toJSON } = render(
    <Provider store={store}>
      <MockedProvider mocks={mocks} addTypename={true} cache={mockCache}>
        <TransactionsList />
      </MockedProvider>
    </Provider>
  )

  const feed = await waitFor(() => UNSAFE_getByType(TransactionFeed))
  expect(feed.props.data.length).toEqual(2)
  expect(toJSON()).toMatchSnapshot()
})

it('ignores failed standby transactions', async () => {
  const store = createMockStore({
    transactions: { standbyTransactionsLegacy: failedStandbyTransactions },
  })

  const { UNSAFE_getByType, toJSON } = render(
    <Provider store={store}>
      <MockedProvider mocks={mocks} addTypename={true} cache={mockCache}>
        <TransactionsList />
      </MockedProvider>
    </Provider>
  )

  const feed = await waitFor(() => UNSAFE_getByType(TransactionFeed))
  expect(feed.props.data.length).toEqual(2)
  expect(toJSON()).toMatchSnapshot()
})

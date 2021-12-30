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
import TransactionFeed, { FeedType } from 'src/transactions/TransactionFeed'
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
  {
    context: { id: 'a-cusd-cgld-standby-exchange-id' },
    type: TokenTransactionType.Exchange,
    status: TransactionStatus.Pending,
    inCurrency: Currency.Dollar,
    inValue: '20',
    outCurrency: Currency.Celo,
    outValue: '30',
    timestamp: 1542409112,
  },
  {
    context: { id: 'a-cgld-cusd-standby-exchange-id' },
    type: TokenTransactionType.Exchange,
    status: TransactionStatus.Pending,
    inCurrency: Currency.Celo,
    inValue: '30',
    outCurrency: Currency.Dollar,
    outValue: '20',
    timestamp: 1542409113,
  },
]

const failedStandbyTransactions: StandbyTransactionLegacy[] = [
  {
    context: { id: '0x00000000000000000001' },
    type: TokenTransactionType.Exchange,
    status: TransactionStatus.Failed,
    inCurrency: Currency.Dollar,
    inValue: '20',
    outCurrency: Currency.Celo,
    outValue: '30',
    timestamp: 1542409112,
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
      {
        __typename: 'TokenTransactionEdge',
        node: {
          __typename: 'TokenExchange',
          type: TokenTransactionType.Exchange,
          hash: '0x16fbd53c4871f0657f40e1b4515184be04bed8912c6e2abc2cda549e4ad8f852',
          amount: {
            __typename: 'MoneyAmount',
            value: '0.994982275992944156',
            currencyCode: 'cUSD',
            localAmount: {
              __typename: 'LocalMoneyAmount',
              value: '0.994982275992944156',
              currencyCode: 'USD',
              exchangeRate: '1',
            },
          },
          takerAmount: {
            __typename: 'MoneyAmount',
            value: '0.994982275992944156',
            currencyCode: 'cUSD',
            localAmount: {
              __typename: 'LocalMoneyAmount',
              value: '0.994982275992944156',
              currencyCode: 'USD',
              exchangeRate: '1',
            },
          },
          makerAmount: {
            __typename: 'MoneyAmount',
            value: '0.1',
            currencyCode: 'cGLD',
            localAmount: {
              __typename: 'LocalMoneyAmount',
              value: '1.006007113270411465777',
              currencyCode: 'USD',
              exchangeRate: '10.06007113270411465777',
            },
          },
          timestamp: 1578530498,
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
        <TransactionsList feedType={FeedType.HOME} />
      </MockedProvider>
    </Provider>
  )

  const feed = await waitFor(() => UNSAFE_getByType(TransactionFeed))
  const { data } = feed.props
  expect(data.length).toEqual(6)

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

  // Check standby cUSD -> cGLD
  const standbyDollarToGold = data[1]
  expect(standbyDollarToGold.amount).toMatchObject({
    value: new BigNumber(-20),
    currencyCode: 'cUSD',
    localAmount: {
      value: new BigNumber(-26.6),
      currencyCode: 'PHP',
      exchangeRate: '1.33',
    },
  })
  expect(standbyDollarToGold.makerAmount).toMatchObject({
    value: new BigNumber(20),
    currencyCode: 'cUSD',
    localAmount: {
      value: new BigNumber(26.6),
      currencyCode: 'PHP',
      exchangeRate: '1.33',
    },
  })
  const matcher = {
    value: new BigNumber(30),
    currencyCode: 'cGLD',
    localAmount: {
      value: '26.600000000000000000133',
      currencyCode: 'PHP',
      exchangeRate: '0.8866666666666666666711',
    },
  }

  expect(JSON.stringify(standbyDollarToGold.takerAmount)).toEqual(JSON.stringify(matcher))

  // Check standby cGLD -> cUSD
  const standbyGoldToDollar = data[2]
  expect(standbyGoldToDollar.amount).toMatchObject({
    value: new BigNumber(20),
    currencyCode: 'cUSD',
    localAmount: {
      value: new BigNumber(26.6),
      currencyCode: 'PHP',
      exchangeRate: '1.33',
    },
  })
  const match = {
    value: new BigNumber(30),
    currencyCode: 'cGLD',
    localAmount: {
      value: '26.600000000000000000133',
      currencyCode: 'PHP',
      exchangeRate: '0.8866666666666666666711',
    },
  }

  expect(JSON.stringify(standbyGoldToDollar.makerAmount)).toEqual(JSON.stringify(match))
  expect(standbyGoldToDollar.takerAmount).toMatchObject({
    value: new BigNumber(20),
    currencyCode: 'cUSD',
    localAmount: {
      value: new BigNumber(26.6),
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
        <TransactionsList feedType={FeedType.HOME} />
      </MockedProvider>
    </Provider>
  )

  const feed = await waitFor(() => UNSAFE_getByType(TransactionFeed))
  expect(feed.props.data.length).toEqual(3)
  expect(toJSON()).toMatchSnapshot()
})

it('ignores failed standby transactions', async () => {
  const store = createMockStore({
    transactions: { standbyTransactionsLegacy: failedStandbyTransactions },
  })

  const { UNSAFE_getByType, toJSON } = render(
    <Provider store={store}>
      <MockedProvider mocks={mocks} addTypename={true} cache={mockCache}>
        <TransactionsList feedType={FeedType.HOME} />
      </MockedProvider>
    </Provider>
  )

  const feed = await waitFor(() => UNSAFE_getByType(TransactionFeed))
  expect(feed.props.data.length).toEqual(3)
  expect(toJSON()).toMatchSnapshot()
})

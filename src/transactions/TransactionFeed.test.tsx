import { render } from '@testing-library/react-native'
import { ApolloError } from 'apollo-boost'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { TokenTransactionType } from 'src/apollo/types'
import TransactionFeed, { FeedItem } from 'src/transactions/TransactionFeed'
import { TransactionStatus } from 'src/transactions/types'
import { createMockStore } from 'test/utils'

jest.mock('src/utils/time.ts')

const transferTransactions: FeedItem[] = [
  {
    __typename: 'TokenTransfer',
    type: TokenTransactionType.Received,
    status: TransactionStatus.Complete,
    amount: {
      value: '100',
      currencyCode: 'cUSD',
      localAmount: null,
    },
    timestamp: 1542306118,
    hash: '0x00000000000000000000',
    address: '0x00000000000000000000',
    comment: 'test',
    account: '0x00000000000000000000',
    defaultImage: 'test',
    defaultName: 'test',
  },
]

const store = createMockStore({})

it('renders for no transactions', () => {
  const tree = render(
    <Provider store={store}>
      <TransactionFeed loading={false} error={undefined} data={[]} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

it('renders for error', () => {
  const tree = render(
    <Provider store={store}>
      <TransactionFeed loading={false} error={new ApolloError({})} data={[]} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

it('renders for loading', () => {
  const tree = render(
    <Provider store={store}>
      <TransactionFeed loading={true} error={undefined} data={undefined} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

it('renders for transactions', () => {
  const tree = render(
    <Provider store={store}>
      <TransactionFeed loading={false} error={undefined} data={transferTransactions} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

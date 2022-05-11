import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import NoActivity from 'src/transactions/NoActivity'
import { FeedType } from 'src/transactions/TransactionFeed'

it('renders loading', () => {
  const tree = render(<NoActivity loading={true} kind={FeedType.HOME} error={undefined} />)
  expect(tree).toMatchSnapshot()
})

it('renders exchange', () => {
  const tree = render(<NoActivity loading={false} kind={FeedType.EXCHANGE} error={undefined} />)
  expect(tree).toMatchSnapshot()
})

it('renders home', () => {
  const tree = render(<NoActivity loading={false} kind={FeedType.HOME} error={undefined} />)
  expect(tree).toMatchSnapshot()
})

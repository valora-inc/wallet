import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import NoActivity from 'src/transactions/NoActivity'

it('renders loading', () => {
  const tree = render(<NoActivity loading={true} error={undefined} />)
  expect(tree).toMatchSnapshot()
})

it('renders correctly', () => {
  const tree = render(<NoActivity loading={false} error={undefined} />)
  expect(tree).toMatchSnapshot()
})

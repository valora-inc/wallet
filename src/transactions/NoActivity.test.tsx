import { render } from '@testing-library/react-native'
import React from 'react'
import NoActivity from './NoActivity'

describe('NoActivity Component', () => {
  it('renders an image and text', () => {
    const { getByText, getByTestId } = render(<NoActivity loading={false} error={undefined} />)

    expect(getByText('transactionFeed.noTransactions')).toBeTruthy()
    expect(getByTestId('NoActivity/CelebrationImage')).toBeTruthy()
  })

  it('renders loading indicator when loading is true', () => {
    const { getByTestId, getByText } = render(<NoActivity loading error={undefined} />)

    expect(getByTestId('NoActivity/loading')).toBeTruthy()
    expect(getByText('transactionFeed.noTransactions')).toBeTruthy()
  })

  it('renders error message when error exists', () => {
    const { getByText, queryByText, queryByTestId } = render(
      <NoActivity error={new Error('Something went wrong')} loading />
    )

    expect(queryByTestId('NoActivity/loading')).toBeFalsy()
    expect(queryByText('transactionFeed.noTransactions')).toBeFalsy()
    expect(getByText('errorLoadingActivity.0')).toBeTruthy()
    expect(getByText('errorLoadingActivity.1')).toBeTruthy()
  })
})

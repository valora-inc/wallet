import { render } from '@testing-library/react-native'
import React from 'react'
import { TransactionStatus } from 'src/transactions/types'
import TransactionStatusIndicator from './TransactionStatusIndicator'

describe('TransactionStatusIndicator', () => {
  it.each([
    [TransactionStatus.Complete, 'transactionStatus.transactionIsCompleted'],
    [TransactionStatus.Pending, 'transactionStatus.transactionIsPending'],
    [TransactionStatus.Failed, 'transactionStatus.transactionIsFailed'],
  ])('renders the correct text when transaction status is %s', (status, expectedText) => {
    const { getByText } = render(<TransactionStatusIndicator status={status} />)
    expect(getByText(expectedText)).toBeTruthy()
  })
})

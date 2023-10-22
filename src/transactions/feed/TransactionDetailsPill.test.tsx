import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { TransactionStatus } from 'src/transactions/types'
import TransactionDetailsPill from './TransactionDetailsPill'

describe('TransactionDetailsPill', () => {
  it.each([
    [TransactionStatus.Complete, 'transactionDetailsActions.showCompletedTransactionDetails'],
    [TransactionStatus.Pending, 'transactionDetailsActions.checkPendingTransactionStatus'],
    [TransactionStatus.Failed, 'transactionDetailsActions.retryFailedTransaction'],
  ])('renders the correct text when transaction status is %s', (status, expectedText) => {
    const { getByText } = render(
      <TransactionDetailsPill status={status} onShowDetails={jest.fn} onRetry={jest.fn()} />
    )
    expect(getByText(expectedText)).toBeTruthy()
  })

  it.each([
    [TransactionStatus.Complete, jest.fn(), undefined],
    [TransactionStatus.Pending, jest.fn(), undefined],
    [TransactionStatus.Failed, undefined, jest.fn()],
  ])(
    'calls the correct handler on tap when transaction status is %s',
    (status, onShowDetails, onRetry) => {
      const { getByTestId } = render(
        <TransactionDetailsPill
          status={status}
          onShowDetails={onShowDetails}
          onRetry={onRetry}
          testID="test-pill"
        />
      )
      fireEvent.press(getByTestId('test-pill'))

      if (onShowDetails) {
        expect(onShowDetails).toHaveBeenCalled()
      }

      if (onRetry) {
        expect(onRetry).toHaveBeenCalled()
      }
    }
  )

  it('does not render when transaction is failed and no handler is provided', () => {
    const { queryByTestId } = render(
      <TransactionDetailsPill status={TransactionStatus.Failed} testID="test-pill" />
    )
    expect(queryByTestId('test-pill')).toBeNull()
  })
})

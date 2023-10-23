import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { TransactionStatus } from 'src/transactions/types'
import TransactionPrimaryAction from './TransactionPrimaryAction'

describe('TransactionPrimaryAction', () => {
  it.each([
    [TransactionStatus.Complete, 'transactionDetailsActions.showCompletedTransactionDetails'],
    [TransactionStatus.Pending, 'transactionDetailsActions.checkPendingTransactionStatus'],
    [TransactionStatus.Failed, 'transactionDetailsActions.retryFailedTransaction'],
  ])('renders the correct text when transaction status is %s', (status, expectedText) => {
    const { getByText } = render(<TransactionPrimaryAction status={status} onPress={jest.fn} />)
    expect(getByText(expectedText)).toBeTruthy()
  })

  it('calls the action handler on press', () => {
    const onPress = jest.fn()
    const { getByTestId } = render(
      <TransactionPrimaryAction
        status={TransactionStatus.Complete}
        onPress={onPress}
        testID="test-primary-action"
      />
    )
    fireEvent.press(getByTestId('test-primary-action'))
    expect(onPress).toHaveBeenCalled()
  })
})

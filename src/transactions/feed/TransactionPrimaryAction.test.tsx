import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { TransactionDetailsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { TokenTransactionTypeV2, TransactionStatus } from 'src/transactions/types'
import TransactionPrimaryAction from './TransactionPrimaryAction'

jest.mock('src/analytics/ValoraAnalytics')

describe('TransactionPrimaryAction', () => {
  it.each([
    [TransactionStatus.Complete, 'transactionDetailsActions.showCompletedTransactionDetails'],
    [TransactionStatus.Pending, 'transactionDetailsActions.checkPendingTransactionStatus'],
    [TransactionStatus.Failed, 'transactionDetailsActions.retryFailedTransaction'],
  ])('renders the correct text when transaction status is %s', (status, expectedText) => {
    const { getByText } = render(
      <TransactionPrimaryAction
        status={status}
        type={TokenTransactionTypeV2.SwapTransaction}
        onPress={jest.fn}
      />
    )
    expect(getByText(expectedText)).toBeTruthy()
  })

  it('calls the action handler on press', () => {
    const onPress = jest.fn()
    const { getByTestId } = render(
      <TransactionPrimaryAction
        status={TransactionStatus.Complete}
        type={TokenTransactionTypeV2.SwapTransaction}
        onPress={onPress}
        testID="test-primary-action"
      />
    )
    fireEvent.press(getByTestId('test-primary-action'))
    expect(onPress).toHaveBeenCalled()
  })

  it.each([
    [TransactionStatus.Complete, TransactionDetailsEvents.transaction_details_tap_check_status],
    [TransactionStatus.Pending, TransactionDetailsEvents.transaction_details_tap_details],
    [TransactionStatus.Failed, TransactionDetailsEvents.transaction_details_tap_retry],
  ])(
    'sends correct analytics event on tap when transaction status is %s',
    (status, expectedEvent) => {
      const { getByTestId } = render(
        <TransactionPrimaryAction
          status={status}
          type={TokenTransactionTypeV2.SwapTransaction}
          onPress={jest.fn}
          testID="test-primary-action"
        />
      )
      fireEvent.press(getByTestId('test-primary-action'))
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(expectedEvent, {
        transactionType: TokenTransactionTypeV2.SwapTransaction,
        transactionStatus: status,
      })
    }
  )
})

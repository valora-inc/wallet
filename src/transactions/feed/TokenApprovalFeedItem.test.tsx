import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import TokenApprovalFeedItem from 'src/transactions/feed/TokenApprovalFeedItem'
import { mockApprovalTransaction } from 'test/values'

describe('NftFeedItem', () => {
  it('should display the feed item title and opens the details screen', () => {
    const tree = render(<TokenApprovalFeedItem transaction={mockApprovalTransaction} />)

    expect(tree.getByText('transactionFeed.approvalTransactionTitle')).toBeTruthy()
    fireEvent.press(tree.getByTestId('TokenApprovalFeedItem'))

    expect(navigate).toHaveBeenCalledWith(Screens.TransactionDetailsScreen, {
      transaction: mockApprovalTransaction,
    })
  })
})

import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getDynamicConfigParams } from 'src/statsig'
import TokenApprovalFeedItem from 'src/transactions/feed/TokenApprovalFeedItem'
import { mockApprovalTransaction } from 'test/values'

jest.mock('src/statsig')

describe('TokenApprovalFeedItem', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(getDynamicConfigParams).mockReturnValue({
      showApprovalTxsInHomefeed: ['ethereum-sepolia'],
    })
  })

  it('should display the feed item title and open the details screen on press', () => {
    const tree = render(<TokenApprovalFeedItem transaction={mockApprovalTransaction} />)

    expect(tree.getByText('transactionFeed.approvalTransactionTitle')).toBeTruthy()
    fireEvent.press(
      tree.getByTestId(`TokenApprovalFeedItem/${mockApprovalTransaction.transactionHash}`)
    )

    expect(navigate).toHaveBeenCalledWith(Screens.TransactionDetailsScreen, {
      transaction: mockApprovalTransaction,
    })
  })
})

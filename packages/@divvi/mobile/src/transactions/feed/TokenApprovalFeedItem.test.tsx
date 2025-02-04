import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getDynamicConfigParams } from 'src/statsig'
import TokenApprovalFeedItem from 'src/transactions/feed/TokenApprovalFeedItem'
import { createMockStore } from 'test/utils'
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
    const tree = render(
      <Provider store={createMockStore()}>
        <TokenApprovalFeedItem transaction={mockApprovalTransaction} />
      </Provider>
    )

    expect(tree.getByText('transactionFeed.approvalTransactionTitle')).toBeTruthy()
    fireEvent.press(
      tree.getByTestId(`TokenApprovalFeedItem/${mockApprovalTransaction.transactionHash}`)
    )

    expect(navigate).toHaveBeenCalledWith(Screens.TransactionDetailsScreen, {
      transaction: mockApprovalTransaction,
    })
  })
})

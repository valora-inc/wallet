import { render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { TokenTransactionType } from 'src/apollo/types'
import { AddressValidationType } from 'src/identity/reducer'
import { Screens } from 'src/navigator/Screens'
import TransactionReview from 'src/transactions/TransactionReview'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockAccount, mockAccount2, mockE164NumberInvite } from 'test/values'

describe('TransactionReview', () => {
  it('to show address changed text when recipient address has changed', () => {
    const store = createMockStore({
      identity: {
        secureSendPhoneNumberMapping: {
          [mockE164NumberInvite]: {
            addressValidationType: AddressValidationType.NONE,
            address: mockAccount2,
          },
        },
      },
    })

    const mockScreenProps = getMockStackScreenProps(Screens.TransactionReview, {
      confirmationProps: {
        comment: 'Pay up!',
        amount: {
          value: '1.0',
          currencyCode: 'cUSD',
        },
        type: TokenTransactionType.Sent,
        recipient: {
          address: mockAccount,
          e164PhoneNumber: mockE164NumberInvite,
        },
      },
      reviewProps: {
        timestamp: Date.now(),
        type: TokenTransactionType.Sent,
      },
    })

    const tree = render(
      <Provider store={store}>
        <TransactionReview {...mockScreenProps} />
      </Provider>
    )

    expect(tree.queryByTestId('transferAddressChanged')).toBeTruthy()
  })
})

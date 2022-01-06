import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { Screens } from 'src/navigator/Screens'
import PaymentRequestConfirmationLegacy from 'src/paymentRequest/PaymentRequestConfirmationLegacy'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockAccount2, mockE164Number, mockTransactionDataLegacy } from 'test/values'

const store = createMockStore({
  account: {
    e164PhoneNumber: mockE164Number,
  },
  web3: {
    account: mockAccount2,
  },
})

const mockScreenProps = getMockStackScreenProps(Screens.PaymentRequestConfirmationLegacy, {
  transactionData: mockTransactionDataLegacy,
})

describe('PaymentRequestConfirmation', () => {
  it('renders correctly for request payment confirmation (Legacy)', () => {
    const tree = render(
      <Provider store={store}>
        <PaymentRequestConfirmationLegacy {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('updates the comment/reason', () => {
    const tree = render(
      <Provider store={store}>
        <PaymentRequestConfirmationLegacy {...mockScreenProps} />
      </Provider>
    )

    const input = tree.getByTestId('commentInput/request')
    const comment = 'A comment!'
    fireEvent.changeText(input, comment)
    expect(tree.queryAllByDisplayValue(comment)).toHaveLength(1)
  })
})

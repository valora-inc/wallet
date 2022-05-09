import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import OutgoingPaymentRequestListScreen from 'src/paymentRequest/OutgoingPaymentRequestListScreen'
import { PaymentRequest } from 'src/paymentRequest/types'
import { createMockPaymentRequest } from 'src/paymentRequest/testValues'
import { Currency } from 'src/utils/currencies'
import { createMockStore } from 'test/utils'
import { mockAccount, mockE164Number } from 'test/values'

const requests = [
  createMockPaymentRequest({
    amount: '20',
    comment: 'Just the best',
    requesterE164Number: '+1555-867-5309',
    requesterAddress: mockAccount,
  }),
  createMockPaymentRequest({
    amount: '102',
    comment: 'Just the best for the best. Thanos & Zeus Gods of ultimate Power',
    requesterE164Number: mockE164Number,
    requesterAddress: mockAccount,
  }),
  createMockPaymentRequest({
    amount: '1',
    comment: 'Just the best but less',
    requesterE164Number: mockE164Number,
    requesterAddress: mockAccount,
  }),
]

function testStore(outgoingPaymentRequests: PaymentRequest[]) {
  return createMockStore({
    stableToken: { balances: { [Currency.Dollar]: '120' } },
    paymentRequest: { outgoingPaymentRequests },
  })
}

describe('OutgoingPaymentRequestListScreen', () => {
  it('renders correctly with requests', () => {
    const store = testStore(requests)

    const tree = render(
      <Provider store={store}>
        <OutgoingPaymentRequestListScreen />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly with no requests', () => {
    const store = testStore([])

    const tree = render(
      <Provider store={store}>
        <OutgoingPaymentRequestListScreen />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})

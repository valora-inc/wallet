import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import IncomingPaymentRequestListScreen from 'src/paymentRequest/IncomingPaymentRequestListScreen'
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

function testStore(incomingPaymentRequests: PaymentRequest[]) {
  return createMockStore({
    stableToken: { balances: { [Currency.Dollar]: '120', [Currency.Euro]: '10' } },
    paymentRequest: { incomingPaymentRequests },
  })
}

describe('IncomingPaymentRequestListScreen', () => {
  it('renders correctly with requests', () => {
    const store = testStore(requests)

    const tree = render(
      <Provider store={store}>
        <IncomingPaymentRequestListScreen />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly with no requests', () => {
    const store = testStore([])

    const tree = render(
      <Provider store={store}>
        <IncomingPaymentRequestListScreen />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})

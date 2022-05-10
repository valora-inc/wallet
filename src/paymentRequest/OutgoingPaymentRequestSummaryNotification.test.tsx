import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import OutgoingPaymentRequestSummaryNotification from 'src/paymentRequest/OutgoingPaymentRequestSummaryNotification'
import { createMockStore } from 'test/utils'
import { mockE164Number, mockPaymentRequests } from 'test/values'

const store = createMockStore()

describe('OutgoingPaymentRequestSummaryNotification', () => {
  it('renders correctly for multiple requests', () => {
    const tree = render(
      <Provider store={store}>
        <OutgoingPaymentRequestSummaryNotification requests={mockPaymentRequests} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly for just one alone', () => {
    const tree = render(
      <Provider store={store}>
        <OutgoingPaymentRequestSummaryNotification requests={mockPaymentRequests.slice(0, 1)} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders a number when the address mapping is cached', () => {
    const storeWithMapping = createMockStore({
      identity: { addressToE164Number: { mockAccount: mockE164Number } },
    })
    const tree = render(
      <Provider store={storeWithMapping}>
        <OutgoingPaymentRequestSummaryNotification requests={mockPaymentRequests.slice(0, 1)} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})

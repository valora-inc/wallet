import { render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import EscrowedPaymentReminderSummaryNotification from 'src/escrow/EscrowedPaymentReminderSummaryNotification'
import { escrowPaymentDouble } from 'src/escrow/testValues'
import { createMockStore } from 'test/utils'

const fakePayments = [escrowPaymentDouble({}), escrowPaymentDouble({})]
const store = createMockStore()

describe('EscrowedPaymentReminderSummaryNotification', () => {
  it('renders correctly', () => {
    const tree = render(
      <Provider store={store}>
        <EscrowedPaymentReminderSummaryNotification payments={fakePayments} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  describe('when more than 2 requests', () => {
    it('renders just two', () => {
      const tree = render(
        <Provider store={store}>
          <EscrowedPaymentReminderSummaryNotification payments={fakePayments} />
        </Provider>
      )
      expect(tree).toMatchSnapshot()
    })
  })
  describe('when more 1 requests', () => {
    it('renders just it alone', () => {
      const tree = render(
        <Provider store={store}>
          <EscrowedPaymentReminderSummaryNotification payments={fakePayments.slice(0, 1)} />
        </Provider>
      )
      expect(tree).toMatchSnapshot()
    })
  })
})

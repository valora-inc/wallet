import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { EscrowedPayment } from 'src/escrow/actions'
import EscrowedPaymentListScreen from 'src/escrow/EscrowedPaymentListScreen'
import { escrowPaymentDouble } from 'src/escrow/testValues'
import { Currency } from 'src/utils/currencies'
import { createMockStore } from 'test/utils'

const payments = [escrowPaymentDouble({}), escrowPaymentDouble({}), escrowPaymentDouble({})]

function testStore(sentEscrowedPayments: EscrowedPayment[]) {
  return createMockStore({
    stableToken: { balances: { [Currency.Dollar]: '120' } },
    escrow: { sentEscrowedPayments },
  })
}

describe('EscrowedPaymentListScreen', () => {
  it('renders correctly with payments', () => {
    const store = testStore(payments)

    const tree = render(
      <Provider store={store}>
        <EscrowedPaymentListScreen />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly with no payments', () => {
    const store = testStore([])

    const tree = render(
      <Provider store={store}>
        <EscrowedPaymentListScreen />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})

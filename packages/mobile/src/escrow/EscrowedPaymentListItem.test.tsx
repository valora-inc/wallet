import * as React from 'react'
import { Share } from 'react-native'
import { fireEvent, flushMicrotasksQueue, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import EscrowedPaymentListItem from 'src/escrow/EscrowedPaymentListItem'
import { createMockStore } from 'test/utils'
import { mockEscrowedPayment } from 'test/values'

const store = createMockStore()
Share.share = jest.fn()

describe('EscrowedPaymentReminderNotification', () => {
  it('renders correctly', () => {
    const tree = render(
      <Provider store={store}>
        <EscrowedPaymentListItem payment={mockEscrowedPayment} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('opens the share dialog', async () => {
    const contact = render(
      <Provider store={store}>
        <EscrowedPaymentListItem payment={mockEscrowedPayment} />
      </Provider>
    )

    fireEvent.press(
      contact.getByTestId('EscrowedPaymentListItem/CallToActions/global:remind/Button')
    )
    await flushMicrotasksQueue()
    expect(Share.share).toHaveBeenCalled()
  })
})

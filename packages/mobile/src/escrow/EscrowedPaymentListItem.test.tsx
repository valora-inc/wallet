import { fireEvent, render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Share } from 'react-native'
import { Provider } from 'react-redux'
import EscrowedPaymentListItem from 'src/escrow/EscrowedPaymentListItem'
import { WEI_PER_TOKEN } from 'src/geth/consts'
import { Currency } from 'src/utils/currencies'
import { amountFromComponent, createMockStore, flushMicrotasksQueue } from 'test/utils'
import { mockEscrowedPayment } from 'test/values'

const store = createMockStore()
Share.share = jest.fn()

describe('EscrowedPaymentReminderNotification', () => {
  it('renders correctly', () => {
    const tree = render(
      <Provider store={store}>
        <EscrowedPaymentListItem
          payment={{
            ...mockEscrowedPayment,
            amount: new BigNumber(10).multipliedBy(WEI_PER_TOKEN),
          }}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
    const component = tree.getByTestId('EscrowedPaymentListItem/amount/value')
    // Local currency exchange rate for cUSD is 1.33
    expect(amountFromComponent(component)).toEqual('₱13.30')
  })

  it('renders correctly with cEUR', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <EscrowedPaymentListItem
          payment={{
            ...mockEscrowedPayment,
            amount: new BigNumber(10).multipliedBy(WEI_PER_TOKEN),
            currency: Currency.Euro,
          }}
        />
      </Provider>
    )

    const component = getByTestId('EscrowedPaymentListItem/amount/value')
    // Local currency exchange rate for cEUR is 2
    expect(amountFromComponent(component)).toEqual('₱20.00')
  })

  it('opens the share dialog', async () => {
    const contact = render(
      <Provider store={store}>
        <EscrowedPaymentListItem payment={mockEscrowedPayment} />
      </Provider>
    )

    fireEvent.press(contact.getByTestId('EscrowedPaymentListItem/CallToActions/remind/Button'))
    await flushMicrotasksQueue()
    expect(Share.share).toHaveBeenCalled()
  })
})

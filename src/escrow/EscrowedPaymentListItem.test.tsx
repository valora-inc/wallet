import { fireEvent, render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Share } from 'react-native'
import { Provider } from 'react-redux'
import EscrowedPaymentListItem from 'src/escrow/EscrowedPaymentListItem'
import { WEI_PER_TOKEN } from 'src/geth/consts'
import { createMockStore, flushMicrotasksQueue, getElementText } from 'test/utils'
import { mockCeurAddress, mockEscrowedPayment } from 'test/values'

const store = createMockStore()
Share.share = jest.fn()

describe('EscrowedPaymentReminderNotification', () => {
  it('renders correctly', () => {
    const tree = render(
      <Provider store={store}>
        <EscrowedPaymentListItem
          payment={{
            ...mockEscrowedPayment,
            amount: new BigNumber(10).multipliedBy(WEI_PER_TOKEN).toString(),
          }}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
    const component = tree.getByTestId('EscrowedPaymentListItem/amount')
    // Local currency exchange rate for cUSD is 1.33
    expect(getElementText(component)).toEqual('₱13.30')
  })

  it('renders correctly with cEUR', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <EscrowedPaymentListItem
          payment={{
            ...mockEscrowedPayment,
            amount: new BigNumber(10).multipliedBy(WEI_PER_TOKEN).toString(),
            tokenAddress: mockCeurAddress,
          }}
        />
      </Provider>
    )

    const component = getByTestId('EscrowedPaymentListItem/amount')
    // cEUR price in USD is defined as 1.2 in test/schemas.
    expect(getElementText(component)).toEqual('₱15.96')
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

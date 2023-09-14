import { act, fireEvent, render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Share } from 'react-native'
import { Provider } from 'react-redux'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import EscrowedPaymentListItem from 'src/escrow/EscrowedPaymentListItem'
import { NotificationBannerCTATypes, NotificationBannerTypes } from 'src/home/NotificationBox'
import { WEI_PER_TOKEN } from 'src/web3/consts'
import { createMockStore, getElementText } from 'test/utils'
import { mockCeurAddress, mockEscrowedPayment } from 'test/values'

const store = createMockStore()
Share.share = jest.fn()

jest.mock('src/analytics/ValoraAnalytics')

describe('EscrowedPaymentReminderNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

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

    await act(() => {
      fireEvent.press(contact.getByTestId('EscrowedPaymentListItem/CallToActions/remind/Button'))
    })

    expect(Share.share).toHaveBeenCalled()
  })

  it('emits correct analytics event when CTA button is pressed', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <EscrowedPaymentListItem payment={mockEscrowedPayment} index={4} />
      </Provider>
    )

    const remindButton = getByTestId('EscrowedPaymentListItem/CallToActions/remind/Button')
    fireEvent.press(remindButton)

    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenLastCalledWith(HomeEvents.notification_select, {
      notificationType: NotificationBannerTypes.escrow_tx_pending,
      selectedAction: NotificationBannerCTATypes.remind,
      notificationPositionInList: 4,
    })
  })

  it('emits correct analytics event when notification is dismissed', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <EscrowedPaymentListItem payment={mockEscrowedPayment} index={4} />
      </Provider>
    )

    const cancelButton = getByTestId('EscrowedPaymentListItem/CallToActions/reclaim/Button')
    fireEvent.press(cancelButton)

    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenLastCalledWith(HomeEvents.notification_select, {
      notificationType: NotificationBannerTypes.escrow_tx_pending,
      selectedAction: NotificationBannerCTATypes.reclaim,
      notificationPositionInList: 4,
    })
  })
})

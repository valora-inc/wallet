import { fireEvent, render } from '@testing-library/react-native'
import { noop } from 'lodash'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { NotificationBannerCTATypes, NotificationType } from 'src/home/types'
import { cancelPaymentRequest, updatePaymentRequestNotified } from 'src/paymentRequest/actions'
import OutgoingPaymentRequestListItem from 'src/paymentRequest/OutgoingPaymentRequestListItem'
import { RecipientType } from 'src/recipients/recipient'
import { createMockStore } from 'test/utils'

jest.mock('src/analytics/ValoraAnalytics')

const store = createMockStore()

const commonProps = {
  id: '1',
  amount: '24',
  comment: 'Hey thanks for the loan, Ill pay you back ASAP. LOVE YOU',
  requestee: {
    e164PhoneNumber: '5126608970',
    displayId: '5126608970',
    address: '0x91623f625e23ac1400',
    name: '5126608970',
    contact: undefined,
    recipientType: RecipientType.Address,
  },
  cancelPaymentRequest: noop as typeof cancelPaymentRequest,
  updatePaymentRequestNotified: noop as typeof updatePaymentRequestNotified,
  index: 4,
}

describe('OutgoingPaymentRequestListItem', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    const tree = render(
      <Provider store={store}>
        <OutgoingPaymentRequestListItem {...commonProps} />
      </Provider>
    )

    expect(tree).toMatchSnapshot()
  })

  it('emits correct analytics event when CTA button is pressed', () => {
    const { getByText } = render(
      <Provider store={store}>
        <OutgoingPaymentRequestListItem {...commonProps} />
      </Provider>
    )

    fireEvent.press(getByText('remind'))

    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenLastCalledWith(HomeEvents.notification_select, {
      notificationType: NotificationType.outgoing_tx_request,
      notificationId: `${NotificationType.outgoing_tx_request}/1`,
      selectedAction: NotificationBannerCTATypes.remind,
      notificationPositionInList: 4,
    })
  })

  it('emits correct analytics event when notification is dismissed', () => {
    const { getByText } = render(
      <Provider store={store}>
        <OutgoingPaymentRequestListItem {...commonProps} />
      </Provider>
    )

    fireEvent.press(getByText('cancel'))

    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenLastCalledWith(HomeEvents.notification_select, {
      notificationType: NotificationType.outgoing_tx_request,
      notificationId: `${NotificationType.outgoing_tx_request}/1`,
      selectedAction: NotificationBannerCTATypes.decline,
      notificationPositionInList: 4,
    })
  })
})

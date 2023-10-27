import { act, fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import SendSelectRecipient from 'src/send/SendSelectRecipient'
import { createMockStore } from 'test/utils'
import { mockRecipient, mockRecipient2 } from 'test/values'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { SendEvents } from 'src/analytics/Events'

const defaultStore = {
  send: {
    inviteRewardsVersion: 'disabled',
    recentRecipients: [mockRecipient, mockRecipient2],
    showSendToAddressWarning: true,
  },
}

describe('SendRedesign', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('emits event when invite button is pressed', async () => {
    const store = createMockStore(defaultStore)

    const { getByTestId } = render(
      <Provider store={store}>
        <SendSelectRecipient />
      </Provider>
    )
    await act(() => {
      fireEvent.press(getByTestId('SelectRecipient/Invite'))
    })
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SendEvents.send_select_recipient_invite)
  })
  it('navigates to QR screen when QR button is pressed', async () => {
    const store = createMockStore(defaultStore)

    const { getByTestId } = render(
      <Provider store={store}>
        <SendSelectRecipient />
      </Provider>
    )
    fireEvent.press(getByTestId('SelectRecipient/QR'))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SendEvents.send_select_recipient_scan_qr)
    expect(navigate).toHaveBeenCalledWith(Screens.QRNavigator, {
      screen: Screens.QRScanner,
    })
  })
  it('shows get started section when no prior recipients', async () => {
    const store = createMockStore({})

    const { getByTestId } = render(
      <Provider store={store}>
        <SendSelectRecipient />
      </Provider>
    )
    expect(getByTestId('SelectRecipient/GetStarted')).toBeTruthy()
  })
  it('shows recents when prior recipients exist', async () => {
    const store = createMockStore(defaultStore)

    const { getByTestId } = render(
      <Provider store={store}>
        <SendSelectRecipient />
      </Provider>
    )
    expect(getByTestId('SelectRecipient/RecipientPicker')).toBeTruthy()
  })
})

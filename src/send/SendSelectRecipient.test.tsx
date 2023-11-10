import { act, fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import SendSelectRecipient from 'src/send/SendSelectRecipient'
import { requestContactsPermission } from 'src/utils/permissions'
import { createMockStore } from 'test/utils'
import { mockPhoneRecipientCache, mockRecipient, mockRecipient2 } from 'test/values'

jest.mock('src/utils/permissions')

const defaultStore = {
  send: {
    recentRecipients: [mockRecipient, mockRecipient2],
  },
  recipients: {
    phoneRecipientCache: mockPhoneRecipientCache,
  },
}

describe('SendSelectRecipient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(requestContactsPermission).mockResolvedValue(false)
  })

  it('shows contacts when send to contacts button is pressed and contact permission is granted', async () => {
    jest.mocked(requestContactsPermission).mockResolvedValue(true)
    const store = createMockStore(defaultStore)

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <SendSelectRecipient />
      </Provider>
    )
    await act(() => {
      fireEvent.press(getByTestId('SelectRecipient/Contacts'))
    })
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SendEvents.send_select_recipient_contacts)
    expect(getByTestId('SelectRecipient/ContactRecipientPicker')).toBeTruthy()
    expect(queryByTestId('SelectRecipient/RecentRecipientPicker')).toBeFalsy()
  })
  it('stays on current screen when send to contacts button is pressed and contact permission is denied', async () => {
    const store = createMockStore(defaultStore)

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <SendSelectRecipient />
      </Provider>
    )
    await act(() => {
      fireEvent.press(getByTestId('SelectRecipient/Contacts'))
    })
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SendEvents.send_select_recipient_contacts)
    expect(getByTestId('SelectRecipient/RecentRecipientPicker')).toBeTruthy()
    expect(queryByTestId('SelectRecipient/ContactRecipientPicker')).toBeFalsy()
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
    expect(getByTestId('SelectRecipient/RecentRecipientPicker')).toBeTruthy()
  })
})

import { act, fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import SendSelectRecipient from 'src/send/SendSelectRecipient'
import { createMockStore } from 'test/utils'
import { mockPhoneRecipientCache, mockRecipient, mockRecipient2 } from 'test/values'

jest.mock('src/utils/permissions')
jest.mock('react-native-device-info', () => ({ getFontScaleSync: () => 1 }))
// this mock defaults to granting all permissions
jest.mock('react-native-permissions', () => require('react-native-permissions/mock'))

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
  })

  it('shows contacts when send to contacts button is pressed and conditions are satisfied', async () => {
    const store = createMockStore({ ...defaultStore, app: { phoneNumberVerified: true } })

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <SendSelectRecipient />
      </Provider>
    )
    await act(() => {
      fireEvent.press(getByTestId('SelectRecipient/Contacts'))
    })
    expect(getByTestId('SelectRecipient/ContactRecipientPicker')).toBeTruthy()
    expect(queryByTestId('SelectRecipient/QR')).toBeFalsy()
    expect(queryByTestId('SelectRecipient/Contacts')).toBeFalsy()
    expect(queryByTestId('SelectRecipient/GetStarted')).toBeFalsy()
    expect(queryByTestId('SelectRecipient/RecentRecipientPicker')).toBeFalsy()
  })
  it('does not show contacts when send to contacts button is pressed and conditions are not satisfied', async () => {
    const store = createMockStore(defaultStore)

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <SendSelectRecipient />
      </Provider>
    )
    await act(() => {
      fireEvent.press(getByTestId('SelectRecipient/Contacts'))
    })
    expect(getByTestId('SelectRecipient/RecentRecipientPicker')).toBeTruthy()
    expect(queryByTestId('SelectRecipient/ContactRecipientPicker')).toBeFalsy()
  })
  it('shows QR, sync contacts and get started section when no prior recipients', async () => {
    const store = createMockStore({})

    const { getByTestId } = render(
      <Provider store={store}>
        <SendSelectRecipient />
      </Provider>
    )
    expect(getByTestId('SelectRecipient/Contacts')).toBeTruthy()
    expect(getByTestId('SelectRecipient/QR')).toBeTruthy()
    expect(getByTestId('SelectRecipient/GetStarted')).toBeTruthy()
  })
  it('shows QR, sync contacts and recents when prior recipients exist', async () => {
    const store = createMockStore(defaultStore)

    const { getByTestId } = render(
      <Provider store={store}>
        <SendSelectRecipient />
      </Provider>
    )
    expect(getByTestId('SelectRecipient/Contacts')).toBeTruthy()
    expect(getByTestId('SelectRecipient/QR')).toBeTruthy()
    expect(getByTestId('SelectRecipient/RecentRecipientPicker')).toBeTruthy()
  })
})

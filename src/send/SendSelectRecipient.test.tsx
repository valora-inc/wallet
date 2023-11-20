import { act, fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import SendSelectRecipient from 'src/send/SendSelectRecipient'
import { getRecipientVerificationStatus } from 'src/recipients/recipient'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockPhoneRecipientCache, mockRecipient, mockRecipient2, mockAccount } from 'test/values'
import { RecipientVerificationStatus } from 'src/identity/types'
import { SendOrigin } from 'src/analytics/types'
import Clipboard from '@react-native-clipboard/clipboard'
import { Screens } from 'src/navigator/Screens'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { SendEvents } from 'src/analytics/Events'
import { navigate } from 'src/navigator/NavigationService'

jest.mock('@react-native-clipboard/clipboard')
jest.mock('src/utils/IosVersionUtils')
jest.mock('src/recipients/RecipientPicker')
jest.mock('src/recipients/recipient', () => ({
  ...(jest.requireActual('src/recipients/recipient') as any),
  getRecipientVerificationStatus: jest.fn(),
}))

// this mock defaults to granting all permissions
jest.mock('react-native-permissions', () => require('react-native-permissions/mock'))

const mockScreenProps = ({
  defaultTokenIdOverride,
  forceTokenId,
}: {
  defaultTokenIdOverride?: string
  forceTokenId?: boolean
}) =>
  getMockStackScreenProps(Screens.SendSelectRecipient, {
    defaultTokenIdOverride,
    forceTokenId,
  })

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
    jest.mocked(Clipboard.getString).mockResolvedValue('')
    jest.mocked(Clipboard.hasString).mockResolvedValue(false)
  })

  it('shows contacts when send to contacts button is pressed and conditions are satisfied', async () => {
    const store = createMockStore({ ...defaultStore, app: { phoneNumberVerified: true } })

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <SendSelectRecipient {...mockScreenProps({})} />
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
        <SendSelectRecipient {...mockScreenProps({})} />
      </Provider>
    )
    await act(() => {
      fireEvent.press(getByTestId('SelectRecipient/Contacts'))
    })
    expect(getByTestId('SelectRecipient/RecentRecipientPicker')).toBeTruthy()
    expect(queryByTestId('SelectRecipient/ContactRecipientPicker')).toBeFalsy()
  })

  it('navigates to QR screen when QR button is pressed', async () => {
    const store = createMockStore(defaultStore)

    const { getByTestId } = render(
      <Provider store={store}>
        <SendSelectRecipient {...mockScreenProps({})} />
      </Provider>
    )
    fireEvent.press(getByTestId('SelectRecipient/QR'))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SendEvents.send_select_recipient_scan_qr)
    expect(navigate).toHaveBeenCalledWith(Screens.QRNavigator, {
      screen: Screens.QRScanner,
    })
  })
  it('shows QR, sync contacts and get started section when no prior recipients', async () => {
    const store = createMockStore({})

    const { getByTestId } = render(
      <Provider store={store}>
        <SendSelectRecipient {...mockScreenProps({})} />
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
        <SendSelectRecipient {...mockScreenProps({})} />
      </Provider>
    )
    expect(getByTestId('SelectRecipient/Contacts')).toBeTruthy()
    expect(getByTestId('SelectRecipient/QR')).toBeTruthy()
    expect(getByTestId('SelectRecipient/RecentRecipientPicker')).toBeTruthy()
  })
  it('shows search when text is entered and result is present', async () => {
    const store = createMockStore(defaultStore)

    const { getByTestId } = render(
      <Provider store={store}>
        <SendSelectRecipient {...mockScreenProps({})} />
      </Provider>
    )
    const searchInput = getByTestId('SendSelectRecipientSearchInput')
    await act(() => {
      fireEvent.changeText(searchInput, 'John Doe')
    })
    expect(getByTestId('SelectRecipient/AllRecipientsPicker')).toBeTruthy()
  })
  it('shows no results available when text is entered and no results', async () => {
    const store = createMockStore(defaultStore)

    const { getByTestId } = render(
      <Provider store={store}>
        <SendSelectRecipient {...mockScreenProps({})} />
      </Provider>
    )
    const searchInput = getByTestId('SendSelectRecipientSearchInput')
    await act(() => {
      fireEvent.changeText(searchInput, 'Fake Name')
    })
    expect(getByTestId('SelectRecipient/NoResults')).toBeTruthy()
  })
  it('navigates to send amount when search result next button is pressed', async () => {
    jest
      .mocked(getRecipientVerificationStatus)
      .mockReturnValue(RecipientVerificationStatus.VERIFIED)

    const store = createMockStore(defaultStore)

    const { getByTestId } = render(
      <Provider store={store}>
        <SendSelectRecipient {...mockScreenProps({})} />
      </Provider>
    )
    const searchInput = getByTestId('SendSelectRecipientSearchInput')

    await act(() => {
      fireEvent.changeText(searchInput, 'George Bogart')
    })
    await act(() => {
      fireEvent.press(getByTestId('RecipientItem'))
    })

    expect(getByTestId('SendOrInviteButton')).toBeTruthy()

    await act(() => {
      fireEvent.press(getByTestId('SendOrInviteButton'))
    })
    expect(navigate).toHaveBeenCalledWith(Screens.SendAmount, {
      isFromScan: false,
      defaultTokenIdOverride: undefined,
      forceTokenId: undefined,
      recipient: expect.any(Object),
      origin: SendOrigin.AppSendFlow,
    })
  })
  it('navigates to invite modal when search result next button is pressed', async () => {
    jest
      .mocked(getRecipientVerificationStatus)
      .mockReturnValue(RecipientVerificationStatus.UNVERIFIED)

    const store = createMockStore(defaultStore)

    const { getByTestId } = render(
      <Provider store={store}>
        <SendSelectRecipient {...mockScreenProps({})} />
      </Provider>
    )
    const searchInput = getByTestId('SendSelectRecipientSearchInput')

    await act(() => {
      fireEvent.changeText(searchInput, 'George Bogart')
    })
    await act(() => {
      fireEvent.press(getByTestId('RecipientItem'))
    })

    expect(getByTestId('SendOrInviteButton')).toBeTruthy()

    await act(() => {
      fireEvent.press(getByTestId('SendOrInviteButton'))
    })

    expect(getByTestId('InviteModalContainer')).toBeTruthy()
  })
  it('shows paste button if clipboard has address content', async () => {
    const store = createMockStore(defaultStore)

    const { findByTestId } = render(
      <Provider store={store}>
        <SendSelectRecipient {...mockScreenProps({})} />
      </Provider>
    )
    await act(() => {
      jest.mocked(Clipboard.getString).mockResolvedValue(mockAccount)
      jest.mocked(Clipboard.hasString).mockResolvedValue(true)
    })

    jest.runOnlyPendingTimers()
    const pasteButton = await findByTestId('PasteAddressButton')
    expect(pasteButton).toBeTruthy()

    await act(() => {
      fireEvent.press(pasteButton)
    })
    const pasteButtonAfterPress = findByTestId('PasteAddressButton')
    await expect(pasteButtonAfterPress).rejects.toThrow()
  })
})

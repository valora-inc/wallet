import { act, fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import SendSelectRecipient from 'src/send/SendSelectRecipient'
import { getRecipientVerificationStatus } from 'src/recipients/recipient'
import { requestContactsPermission } from 'src/utils/permissions'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockPhoneRecipientCache, mockRecipient, mockRecipient2, mockAccount } from 'test/values'
import { RecipientVerificationStatus } from 'src/identity/types'
import { SendOrigin } from 'src/analytics/types'
import Clipboard from '@react-native-clipboard/clipboard'

jest.mock('@react-native-clipboard/clipboard')
jest.mock('src/utils/IosVersionUtils')
jest.mock('src/utils/permissions')
jest.mock('src/recipients/RecipientPicker')
jest.mock('src/recipients/recipient', () => ({
  ...(jest.requireActual('src/recipients/recipient') as any),
  getRecipientVerificationStatus: jest.fn(),
}))

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
    jest.mocked(requestContactsPermission).mockResolvedValue(false)
    jest.mocked(Clipboard.getString).mockResolvedValue('')
    jest.mocked(Clipboard.hasString).mockResolvedValue(false)
  })

  it('shows contacts when send to contacts button is pressed and contact permission is granted', async () => {
    jest.mocked(requestContactsPermission).mockResolvedValue(true)
    const store = createMockStore(defaultStore)

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <SendSelectRecipient {...mockScreenProps({})} />
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
        <SendSelectRecipient {...mockScreenProps({})} />
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
        <SendSelectRecipient {...mockScreenProps({})} />
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
        <SendSelectRecipient {...mockScreenProps({})} />
      </Provider>
    )
    expect(getByTestId('SelectRecipient/GetStarted')).toBeTruthy()
  })
  it('shows recents when prior recipients exist', async () => {
    const store = createMockStore(defaultStore)

    const { getByTestId } = render(
      <Provider store={store}>
        <SendSelectRecipient {...mockScreenProps({})} />
      </Provider>
    )
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
    fireEvent.changeText(searchInput, 'John Doe')
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
    fireEvent.changeText(searchInput, 'Fake Name')
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
    fireEvent.changeText(searchInput, 'George Bogart')
    fireEvent.press(getByTestId('RecipientItem-0'))
    expect(getByTestId('SendOrInviteButton')).toBeTruthy()

    fireEvent.press(getByTestId('SendOrInviteButton'))
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
    fireEvent.changeText(searchInput, 'George Bogart')
    fireEvent.press(getByTestId('RecipientItem-0'))
    expect(getByTestId('SendOrInviteButton')).toBeTruthy()

    fireEvent.press(getByTestId('SendOrInviteButton'))
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

    fireEvent.press(pasteButton)

    const pasteButtonAfterPress = findByTestId('PasteAddressButton')
    await expect(pasteButtonAfterPress).rejects.toThrow()
  })
})

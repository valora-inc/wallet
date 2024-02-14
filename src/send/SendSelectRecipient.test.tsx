import Clipboard from '@react-native-clipboard/clipboard'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { SendOrigin } from 'src/analytics/types'
import { fetchAddressVerification, fetchAddressesAndValidate } from 'src/identity/actions'
import { AddressValidationType } from 'src/identity/reducer'
import { RecipientVerificationStatus } from 'src/identity/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RecipientType, getRecipientVerificationStatus } from 'src/recipients/recipient'
import SendSelectRecipient from 'src/send/SendSelectRecipient'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import {
  mockAccount,
  mockAccount2,
  mockAccount3,
  mockAddressRecipient,
  mockDisplayNumber2Invite,
  mockE164Number2Invite,
  mockE164Number3,
  mockPhoneRecipientCache,
  mockRecipient,
  mockRecipient2,
} from 'test/values'

jest.mock('@react-native-clipboard/clipboard')
jest.mock('src/utils/IosVersionUtils')
jest.mock('src/recipients/resolve-id')
jest.mock('src/recipients/recipient', () => ({
  ...(jest.requireActual('src/recipients/recipient') as any),
  getRecipientVerificationStatus: jest.fn(),
}))

jest.mock('react-native-device-info', () => ({ getFontScaleSync: () => 1 }))
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
const storeWithPhoneVerified = {
  ...defaultStore,
  app: { phoneNumberVerified: true },
}

describe('SendSelectRecipient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(Clipboard.getString).mockResolvedValue('')
    jest.mocked(Clipboard.hasString).mockResolvedValue(false)
  })

  it('shows contacts when send to contacts button is pressed and conditions are satisfied', async () => {
    const store = createMockStore(storeWithPhoneVerified)

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

    const store = createMockStore(storeWithPhoneVerified)

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
    expect(getByTestId('SendOrInviteButton')).toHaveTextContent('sendSelectRecipient.buttons.send')

    await act(() => {
      fireEvent.press(getByTestId('SendOrInviteButton'))
    })
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      SendEvents.send_select_recipient_send_press,
      {
        recipientType: RecipientType.PhoneNumber,
      }
    )

    expect(navigate).toHaveBeenCalledWith(Screens.SendEnterAmount, {
      isFromScan: false,
      defaultTokenIdOverride: undefined,
      forceTokenId: undefined,
      recipient: expect.any(Object),
      origin: SendOrigin.AppSendFlow,
    })
  })
  it('navigates to send amount when address recipient is pressed', async () => {
    const store = createMockStore(defaultStore)

    const { getByTestId } = render(
      <Provider store={store}>
        <SendSelectRecipient {...mockScreenProps({})} />
      </Provider>
    )
    const searchInput = getByTestId('SendSelectRecipientSearchInput')

    await act(() => {
      fireEvent.changeText(searchInput, mockAddressRecipient.address)
    })
    await act(() => {
      fireEvent.press(getByTestId('RecipientItem'))
    })

    expect(getByTestId('SendOrInviteButton')).toBeTruthy()
    expect(getByTestId('SendOrInviteButton')).toHaveTextContent('sendSelectRecipient.buttons.send')

    await act(() => {
      fireEvent.press(getByTestId('SendOrInviteButton'))
    })
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      SendEvents.send_select_recipient_send_press,
      {
        recipientType: RecipientType.Address,
      }
    )
    expect(navigate).toHaveBeenCalledWith(Screens.SendEnterAmount, {
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

    const store = createMockStore(storeWithPhoneVerified)

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
    expect(getByTestId('SendOrInviteButton')).toHaveTextContent(
      'sendSelectRecipient.buttons.invite'
    )

    await act(() => {
      fireEvent.press(getByTestId('SendOrInviteButton'))
    })

    expect(getByTestId('InviteModalContainer')).toBeTruthy()
  })
  it('does not show unknown address info text when searching for known valora address', async () => {
    jest
      .mocked(getRecipientVerificationStatus)
      .mockReturnValue(RecipientVerificationStatus.VERIFIED)

    const store = createMockStore(storeWithPhoneVerified)

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <SendSelectRecipient {...mockScreenProps({})} />
      </Provider>
    )
    await waitFor(() => {
      expect(getByTestId('SendSelectRecipientSearchInput')).toBeTruthy()
    })
    const searchInput = getByTestId('SendSelectRecipientSearchInput')

    await act(() => {
      fireEvent.changeText(searchInput, mockAccount2)
    })

    expect(getByTestId('RecipientItem')).toHaveTextContent(
      'feedItemAddress, {"address":"0x1ff4...bc42"}'
    )

    await act(() => {
      fireEvent.press(getByTestId('RecipientItem'))
    })

    expect(store.getActions()).toEqual([fetchAddressVerification(mockAccount2.toLowerCase())])
    expect(queryByTestId('UnknownAddressInfo')).toBeFalsy()
    expect(getByTestId('SendOrInviteButton')).toBeTruthy()
  })
  it('does not show unknown address info text when searching for phone number', async () => {
    jest
      .mocked(getRecipientVerificationStatus)
      .mockReturnValue(RecipientVerificationStatus.UNVERIFIED)

    const store = createMockStore(storeWithPhoneVerified)

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <SendSelectRecipient {...mockScreenProps({})} />
      </Provider>
    )
    await waitFor(() => {
      expect(getByTestId('SendSelectRecipientSearchInput')).toBeTruthy()
    })
    const searchInput = getByTestId('SendSelectRecipientSearchInput')

    await act(() => {
      fireEvent.changeText(searchInput, mockE164Number2Invite)
    })
    expect(getByTestId('RecipientItem')).toHaveTextContent(mockDisplayNumber2Invite)
    await act(() => {
      fireEvent.press(getByTestId('RecipientItem'))
    })

    expect(store.getActions()).toEqual([fetchAddressesAndValidate(mockE164Number2Invite)])
    expect(queryByTestId('UnknownAddressInfo')).toBeFalsy()
    expect(getByTestId('SendOrInviteButton')).toBeTruthy()
  })

  it('shows unknown address info text when searching for unknown address after making address verification request', async () => {
    jest
      .mocked(getRecipientVerificationStatus)
      .mockReturnValue(RecipientVerificationStatus.UNVERIFIED)

    const store = createMockStore(storeWithPhoneVerified)

    const { getByTestId } = render(
      <Provider store={store}>
        <SendSelectRecipient {...mockScreenProps({})} />
      </Provider>
    )
    await waitFor(() => {
      expect(getByTestId('SendSelectRecipientSearchInput')).toBeTruthy()
    })
    const searchInput = getByTestId('SendSelectRecipientSearchInput')

    await act(() => {
      fireEvent.changeText(searchInput, mockAccount2)
    })

    // ensure its an address recipient (not an address that's tied to a contact)
    expect(getByTestId('RecipientItem')).toHaveTextContent(
      'feedItemAddress, {"address":"0x1ff4...bc42"}'
    )

    await act(() => {
      fireEvent.press(getByTestId('RecipientItem'))
    })

    expect(store.getActions()).toEqual([fetchAddressVerification(mockAccount2.toLowerCase())])
    expect(getByTestId('UnknownAddressInfo')).toBeTruthy()
    expect(getByTestId('SendOrInviteButton')).toBeTruthy()
  })
  it('shows unknown address info text and skips CPV request when searching for any address if PN not verified', async () => {
    const store = createMockStore(defaultStore)

    const { getByTestId } = render(
      <Provider store={store}>
        <SendSelectRecipient {...mockScreenProps({})} />
      </Provider>
    )
    await waitFor(() => {
      expect(getByTestId('SendSelectRecipientSearchInput')).toBeTruthy()
    })
    const searchInput = getByTestId('SendSelectRecipientSearchInput')

    await act(() => {
      fireEvent.changeText(searchInput, mockAccount2)
    })

    // ensure its an address recipient (not an address that's tied to a contact)
    expect(getByTestId('RecipientItem')).toHaveTextContent(
      'feedItemAddress, {"address":"0x1ff4...bc42"}'
    )

    await act(() => {
      fireEvent.press(getByTestId('RecipientItem'))
    })

    expect(store.getActions()).toEqual([])
    expect(getByTestId('UnknownAddressInfo')).toBeTruthy()
    expect(getByTestId('SendOrInviteButton')).toBeTruthy()
  })
  it('shows unknown address info text and send button when searching for address with cached phone number but no longer connected to the phone number', async () => {
    jest
      .mocked(getRecipientVerificationStatus)
      .mockReturnValue(RecipientVerificationStatus.UNVERIFIED)

    const store = createMockStore(storeWithPhoneVerified)

    const { getByTestId } = render(
      <Provider store={store}>
        <SendSelectRecipient {...mockScreenProps({})} />
      </Provider>
    )
    await waitFor(() => {
      expect(getByTestId('SendSelectRecipientSearchInput')).toBeTruthy()
    })
    const searchInput = getByTestId('SendSelectRecipientSearchInput')

    await act(() => {
      fireEvent.changeText(searchInput, mockAccount)
    })

    expect(getByTestId('RecipientItem')).toHaveTextContent(mockRecipient.name)
    expect(getByTestId('RecipientItem')).toHaveTextContent(mockRecipient.displayNumber)

    await act(() => {
      fireEvent.press(getByTestId('RecipientItem'))
    })

    expect(store.getActions()).toEqual([fetchAddressVerification(mockAccount)])
    expect(getByTestId('UnknownAddressInfo')).toBeTruthy()
    expect(getByTestId('SendOrInviteButton')).toBeTruthy()
    expect(getByTestId('SendOrInviteButton')).toHaveTextContent('send')
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

  describe('Invite Rewards', () => {
    it('shows invite rewards card when invite rewards are active and number is verified', async () => {
      const store = createMockStore({
        ...storeWithPhoneVerified,
        send: {
          ...storeWithPhoneVerified.send,
          inviteRewardsVersion: 'v5',
        },
      })

      const { findByTestId } = render(
        <Provider store={store}>
          <SendSelectRecipient {...mockScreenProps({})} />
        </Provider>
      )

      const inviteRewardsCard = await findByTestId('InviteRewardsCard')
      expect(inviteRewardsCard).toHaveTextContent('inviteRewardsBannerCUSD.title')
      expect(inviteRewardsCard).toHaveTextContent('inviteRewardsBannerCUSD.body')
    })

    it('does not show invite rewards card when invite rewards are not active', async () => {
      const store = createMockStore({
        ...storeWithPhoneVerified,
        send: {
          ...storeWithPhoneVerified.send,
          inviteRewardsVersion: 'none',
        },
      })

      const { queryByTestId } = render(
        <Provider store={store}>
          <SendSelectRecipient {...mockScreenProps({})} />
        </Provider>
      )

      expect(queryByTestId('InviteRewardsCard')).toBeFalsy()
    })

    it('does not show invite rewards card when invite rewards are active and number is not verified', async () => {
      const store = createMockStore({
        ...defaultStore,
        send: {
          ...defaultStore.send,
          inviteRewardsVersion: 'v5',
        },
      })

      const { queryByTestId } = render(
        <Provider store={store}>
          <SendSelectRecipient {...mockScreenProps({})} />
        </Provider>
      )

      expect(queryByTestId('InviteRewardsCard')).toBeFalsy()
    })
  })
  it('navigates to send amount when phone number recipient with single address', async () => {
    jest
      .mocked(getRecipientVerificationStatus)
      .mockReturnValue(RecipientVerificationStatus.VERIFIED)

    const store = createMockStore({
      ...storeWithPhoneVerified,
      identity: {
        secureSendPhoneNumberMapping: {
          [mockE164Number3]: { addressValidationType: AddressValidationType.NONE },
        },
        e164NumberToAddress: { [mockE164Number3]: [mockAccount3] },
      },
    })

    const { getByTestId } = render(
      <Provider store={store}>
        <SendSelectRecipient {...mockScreenProps({})} />
      </Provider>
    )
    const searchInput = getByTestId('SendSelectRecipientSearchInput')

    await act(() => {
      fireEvent.changeText(searchInput, mockE164Number3)
    })
    await act(() => {
      fireEvent.press(getByTestId('RecipientItem'))
    })

    expect(getByTestId('SendOrInviteButton')).toBeTruthy()

    await act(() => {
      fireEvent.press(getByTestId('SendOrInviteButton'))
    })
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      SendEvents.send_select_recipient_send_press,
      {
        recipientType: RecipientType.PhoneNumber,
      }
    )
    expect(navigate).toHaveBeenCalledWith(Screens.SendEnterAmount, {
      isFromScan: false,
      defaultTokenIdOverride: undefined,
      forceTokenId: undefined,
      recipient: {
        address: mockAccount3,
        displayNumber: '(415) 555-0123',
        e164PhoneNumber: mockE164Number3,
        recipientType: 'PhoneNumber',
      },
      origin: SendOrigin.AppSendFlow,
    })
  })
  it('navigates to secure send flow when phone number recipient with multiple addresses, first time seeing it', async () => {
    jest
      .mocked(getRecipientVerificationStatus)
      .mockReturnValue(RecipientVerificationStatus.VERIFIED)

    const store = createMockStore({
      ...storeWithPhoneVerified,
      identity: {
        secureSendPhoneNumberMapping: {
          [mockE164Number3]: { addressValidationType: AddressValidationType.PARTIAL },
        },
        e164NumberToAddress: {
          [mockE164Number3]: [mockAccount2.toLowerCase(), mockAccount3.toLowerCase()],
        },
        addressToE164Number: {
          [mockAccount2.toLowerCase()]: mockE164Number3,
          [mockAccount3.toLowerCase()]: mockE164Number3,
        },
      },
    })

    const { getByTestId } = render(
      <Provider store={store}>
        <SendSelectRecipient {...mockScreenProps({})} />
      </Provider>
    )
    const searchInput = getByTestId('SendSelectRecipientSearchInput')

    await act(() => {
      fireEvent.changeText(searchInput, mockE164Number3)
    })
    await act(() => {
      fireEvent.press(getByTestId('RecipientItem'))
    })

    expect(getByTestId('SendOrInviteButton')).toBeTruthy()

    await act(() => {
      fireEvent.press(getByTestId('SendOrInviteButton'))
    })
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      SendEvents.send_select_recipient_send_press,
      {
        recipientType: RecipientType.PhoneNumber,
      }
    )
    expect(navigate).toHaveBeenCalledWith(Screens.ValidateRecipientIntro, {
      defaultTokenIdOverride: undefined,
      forceTokenId: undefined,
      recipient: expect.any(Object),
      origin: SendOrigin.AppSendFlow,
    })
  })
  it('navigates to send enter amount when phone number recipient with multiple addresses, already done secure send', async () => {
    jest
      .mocked(getRecipientVerificationStatus)
      .mockReturnValue(RecipientVerificationStatus.VERIFIED)

    const store = createMockStore({
      ...storeWithPhoneVerified,
      identity: {
        secureSendPhoneNumberMapping: {
          [mockE164Number3]: {
            addressValidationType: AddressValidationType.NONE,
            address: mockAccount3,
          },
        },
        e164NumberToAddress: {
          [mockE164Number3]: [mockAccount2.toLowerCase(), mockAccount3.toLowerCase()],
        },
        addressToE164Number: {
          [mockAccount2.toLowerCase()]: mockE164Number3,
          [mockAccount3.toLowerCase()]: mockE164Number3,
        },
      },
    })

    const { getByTestId } = render(
      <Provider store={store}>
        <SendSelectRecipient {...mockScreenProps({})} />
      </Provider>
    )
    const searchInput = getByTestId('SendSelectRecipientSearchInput')

    await act(() => {
      fireEvent.changeText(searchInput, mockE164Number3)
    })
    await act(() => {
      fireEvent.press(getByTestId('RecipientItem'))
    })

    expect(getByTestId('SendOrInviteButton')).toBeTruthy()

    await act(() => {
      fireEvent.press(getByTestId('SendOrInviteButton'))
    })
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      SendEvents.send_select_recipient_send_press,
      {
        recipientType: RecipientType.PhoneNumber,
      }
    )
    expect(navigate).toHaveBeenCalledWith(Screens.SendEnterAmount, {
      isFromScan: false,
      defaultTokenIdOverride: undefined,
      forceTokenId: undefined,
      recipient: {
        address: mockAccount3,
        displayNumber: '(415) 555-0123',
        e164PhoneNumber: mockE164Number3,
        recipientType: 'PhoneNumber',
      },
      origin: SendOrigin.AppSendFlow,
    })
  })
  it.each([{ searchAddress: mockAccount2 }, { searchAddress: mockAccount3 }])(
    'navigates to send enter amount with correct address if a an address is entered which also has a phone number with secure send not done',
    async ({ searchAddress }) => {
      jest
        .mocked(getRecipientVerificationStatus)
        .mockReturnValue(RecipientVerificationStatus.VERIFIED)

      const store = createMockStore({
        ...storeWithPhoneVerified,
        identity: {
          secureSendPhoneNumberMapping: {
            [mockE164Number3]: {
              addressValidationType: AddressValidationType.PARTIAL,
            },
          },
          e164NumberToAddress: {
            [mockE164Number3]: [mockAccount2.toLowerCase(), mockAccount3.toLowerCase()],
          },
          addressToE164Number: {
            [mockAccount2.toLowerCase()]: mockE164Number3,
            [mockAccount3.toLowerCase()]: mockE164Number3,
          },
        },
      })

      const { getByTestId } = render(
        <Provider store={store}>
          <SendSelectRecipient {...mockScreenProps({})} />
        </Provider>
      )
      const searchInput = getByTestId('SendSelectRecipientSearchInput')

      await act(() => {
        fireEvent.changeText(searchInput, searchAddress)
      })
      await act(() => {
        fireEvent.press(getByTestId('RecipientItem'))
      })

      expect(getByTestId('SendOrInviteButton')).toBeTruthy()

      await act(() => {
        fireEvent.press(getByTestId('SendOrInviteButton'))
      })
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        SendEvents.send_select_recipient_send_press,
        {
          recipientType: RecipientType.Address,
        }
      )
      expect(navigate).toHaveBeenCalledWith(Screens.SendEnterAmount, {
        isFromScan: false,
        defaultTokenIdOverride: undefined,
        forceTokenId: undefined,
        recipient: {
          address: searchAddress.toLowerCase(),
          e164PhoneNumber: mockE164Number3,
          recipientType: RecipientType.Address,
          contactId: undefined,
          displayNumber: undefined,
          name: undefined,
          thumbnailPath: undefined,
        },
        origin: SendOrigin.AppSendFlow,
      })
    }
  )
  it.each([{ searchAddress: mockAccount2 }, { searchAddress: mockAccount3 }])(
    'navigates to send enter amount with correct address if a an address is entered which also has a phone number with secure send done with different address',
    async ({ searchAddress }) => {
      jest
        .mocked(getRecipientVerificationStatus)
        .mockReturnValue(RecipientVerificationStatus.VERIFIED)

      const store = createMockStore({
        ...storeWithPhoneVerified,
        identity: {
          secureSendPhoneNumberMapping: {
            [mockE164Number3]: {
              addressValidationType: AddressValidationType.NONE,
              address: mockAccount3,
            },
          },
          e164NumberToAddress: {
            [mockE164Number3]: [mockAccount2.toLowerCase(), mockAccount3.toLowerCase()],
          },
          addressToE164Number: {
            [mockAccount2.toLowerCase()]: mockE164Number3,
            [mockAccount3.toLowerCase()]: mockE164Number3,
          },
        },
      })

      const { getByTestId } = render(
        <Provider store={store}>
          <SendSelectRecipient {...mockScreenProps({})} />
        </Provider>
      )
      const searchInput = getByTestId('SendSelectRecipientSearchInput')

      await act(() => {
        fireEvent.changeText(searchInput, searchAddress)
      })
      await act(() => {
        fireEvent.press(getByTestId('RecipientItem'))
      })

      expect(getByTestId('SendOrInviteButton')).toBeTruthy()

      await act(() => {
        fireEvent.press(getByTestId('SendOrInviteButton'))
      })
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        SendEvents.send_select_recipient_send_press,
        {
          recipientType: RecipientType.Address,
        }
      )
      expect(navigate).toHaveBeenCalledWith(Screens.SendEnterAmount, {
        isFromScan: false,
        defaultTokenIdOverride: undefined,
        forceTokenId: undefined,
        recipient: {
          address: searchAddress.toLowerCase(),
          e164PhoneNumber: mockE164Number3,
          recipientType: RecipientType.Address,
          contactId: undefined,
          displayNumber: undefined,
          name: undefined,
          thumbnailPath: undefined,
        },
        origin: SendOrigin.AppSendFlow,
      })
    }
  )
})

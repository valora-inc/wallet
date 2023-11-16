import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import { Platform } from 'react-native'
import { RESULTS, check, request } from 'react-native-permissions'
import { Provider } from 'react-redux'
import { SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import SelectRecipientButtons from 'src/send/SelectRecipientButtons'
import { navigateToPhoneSettings } from 'src/utils/linking'
import { createMockStore } from 'test/utils'

jest.mock('react-native-permissions', () => require('react-native-permissions/mock'))

const renderComponent = (phoneNumberVerified = false) => {
  const onPermissionsGranted = jest.fn()
  const tree = render(
    <Provider store={createMockStore({ app: { phoneNumberVerified } })}>
      <SelectRecipientButtons onContactsPermissionGranted={onPermissionsGranted} />
    </Provider>
  )
  return { ...tree, onPermissionsGranted }
}

describe('SelectRecipientButtons', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(check).mockResolvedValue(RESULTS.DENIED)
  })

  it('renders QR and contacts button with no check mark on contacts if phone number is not verified', () => {
    const { getByTestId, queryByTestId } = renderComponent()
    expect(getByTestId('SelectRecipient/QR')).toBeTruthy()
    expect(getByTestId('SelectRecipient/Contacts')).toBeTruthy()
    expect(queryByTestId('SelectRecipient/Contacts/checkmark')).toBeFalsy()
  })
  it('renders QR and contacts button with no check mark on contacts if phone number is verified but contact permission is not granted', () => {
    const { getByTestId, queryByTestId } = renderComponent(true)
    expect(getByTestId('SelectRecipient/QR')).toBeTruthy()
    expect(getByTestId('SelectRecipient/Contacts')).toBeTruthy()
    expect(queryByTestId('SelectRecipient/Contacts/checkmark')).toBeFalsy()
  })
  it('renders QR and contacts button with check mark on contacts if phone number is verified and contact permission is granted', async () => {
    jest.mocked(check).mockResolvedValue(RESULTS.GRANTED)

    const { getByTestId } = renderComponent(true)
    expect(getByTestId('SelectRecipient/QR')).toBeTruthy()
    expect(getByTestId('SelectRecipient/Contacts')).toBeTruthy()
    await waitFor(() => {
      expect(getByTestId('SelectRecipient/Contacts/checkmark')).toBeTruthy()
    })
  })
  it('navigates to QR screen when QR button is pressed', () => {
    const { getByTestId } = renderComponent()
    fireEvent.press(getByTestId('SelectRecipient/QR'))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SendEvents.send_select_recipient_scan_qr)
    expect(navigate).toHaveBeenCalledWith(Screens.QRNavigator, {
      screen: Screens.QRScanner,
    })
  })
  it('invokes permissions granted callback when contacts button is pressed with phone verified and contacts permission granted', async () => {
    jest.mocked(check).mockResolvedValue(RESULTS.GRANTED)
    const { getByTestId, onPermissionsGranted } = renderComponent(true)
    await act(() => {
      fireEvent.press(getByTestId('SelectRecipient/Contacts'))
    })
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SendEvents.send_select_recipient_contacts, {
      phoneNumberVerified: true,
      contactsPermissionStatus: RESULTS.GRANTED,
    })
    expect(onPermissionsGranted).toHaveBeenCalledWith()
    expect(check).toHaveBeenCalledTimes(2) // one on load and one when pressing the button
    expect(request).not.toHaveBeenCalled()
  })

  it('shows connect phone number modal if phone is not verified', async () => {
    const { getByTestId, onPermissionsGranted } = renderComponent(false)
    await act(() => {
      fireEvent.press(getByTestId('SelectRecipient/Contacts'))
    })
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SendEvents.send_select_recipient_contacts, {
      phoneNumberVerified: false,
      contactsPermissionStatus: RESULTS.DENIED,
    })
    expect(onPermissionsGranted).not.toHaveBeenCalled()
    expect(check).toHaveBeenCalledTimes(2)
    expect(request).not.toHaveBeenCalled()
    expect(getByTestId('SelectRecipient/PhoneNumberModal')).toBeVisible()

    await act(() => {
      fireEvent.press(getByTestId('SelectRecipient/PhoneNumberModal/SecondaryAction'))
    })
    await waitFor(() => {
      expect(getByTestId('SelectRecipient/PhoneNumberModal')).not.toBeVisible()
    })
    await act(() => {
      fireEvent.press(getByTestId('SelectRecipient/Contacts'))
    })
    expect(getByTestId('SelectRecipient/PhoneNumberModal')).toBeVisible()
    await act(() => {
      fireEvent.press(getByTestId('SelectRecipient/PhoneNumberModal/PrimaryAction'))
    })
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith(Screens.VerificationStartScreen, {
        hideOnboardingStep: true,
      })
    })
  })

  it('shows enable contacts modal if phone verified but contacts permission is blocked', async () => {
    jest.mocked(check).mockResolvedValue(RESULTS.BLOCKED)
    const { getByTestId, onPermissionsGranted } = renderComponent(true)
    await act(() => {
      fireEvent.press(getByTestId('SelectRecipient/Contacts'))
    })
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SendEvents.send_select_recipient_contacts, {
      phoneNumberVerified: true,
      contactsPermissionStatus: RESULTS.BLOCKED,
    })
    expect(onPermissionsGranted).not.toHaveBeenCalled()
    expect(request).not.toHaveBeenCalled()
    expect(getByTestId('SelectRecipient/ContactsModal')).toBeVisible()

    await act(() => {
      fireEvent.press(getByTestId('SelectRecipient/ContactsModal/SecondaryAction'))
    })
    await waitFor(() => {
      expect(getByTestId('SelectRecipient/ContactsModal')).not.toBeVisible()
    })
    await act(() => {
      fireEvent.press(getByTestId('SelectRecipient/Contacts'))
    })
    expect(getByTestId('SelectRecipient/ContactsModal')).toBeVisible()
    await act(() => {
      fireEvent.press(getByTestId('SelectRecipient/ContactsModal/PrimaryAction'))
    })
    expect(navigateToPhoneSettings).toHaveBeenCalled()
  })

  it('requests permission if phone is verified but contacts permission is denied and invokes callback if request is granted', async () => {
    jest.mocked(request).mockResolvedValue(RESULTS.GRANTED)
    const { getByTestId, onPermissionsGranted } = renderComponent(true)
    await act(() => {
      fireEvent.press(getByTestId('SelectRecipient/Contacts'))
    })
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SendEvents.send_select_recipient_contacts, {
      phoneNumberVerified: true,
      contactsPermissionStatus: RESULTS.DENIED,
    })
    expect(request).toHaveBeenCalled()
    expect(onPermissionsGranted).toHaveBeenCalled()
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      SendEvents.request_contacts_permission_started
    )
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      SendEvents.request_contacts_permission_completed,
      { permissionStatus: RESULTS.GRANTED }
    )
  })

  it('requests permission if phone is verified but contacts permission is denied and does nothing if request is denied', async () => {
    jest.mocked(request).mockResolvedValue(RESULTS.DENIED)
    const { getByTestId, onPermissionsGranted } = renderComponent(true)
    await act(() => {
      fireEvent.press(getByTestId('SelectRecipient/Contacts'))
    })
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SendEvents.send_select_recipient_contacts, {
      phoneNumberVerified: true,
      contactsPermissionStatus: RESULTS.DENIED,
    })
    expect(request).toHaveBeenCalled()
    expect(onPermissionsGranted).not.toHaveBeenCalled()
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      SendEvents.request_contacts_permission_started
    )
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      SendEvents.request_contacts_permission_completed,
      { permissionStatus: RESULTS.DENIED }
    )
    expect(getByTestId('SelectRecipient/ContactsModal')).not.toBeVisible()
  })

  it.each([
    { os: 'ios' as const, showsModal: false, testName: 'does nothing' },
    { os: 'android' as const, showsModal: true, testName: 'shows modal' },
  ])(
    'requests permission if phone is verified but contacts permission is denied and $testName if request is blocked on $os',
    async ({ os, showsModal }) => {
      Platform.OS = os
      jest.mocked(request).mockResolvedValue(RESULTS.BLOCKED)
      const { getByTestId, onPermissionsGranted } = renderComponent(true)
      await act(() => {
        fireEvent.press(getByTestId('SelectRecipient/Contacts'))
      })
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        SendEvents.send_select_recipient_contacts,
        {
          phoneNumberVerified: true,
          contactsPermissionStatus: RESULTS.DENIED,
        }
      )
      expect(request).toHaveBeenCalled()
      expect(onPermissionsGranted).not.toHaveBeenCalled()
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        SendEvents.request_contacts_permission_started
      )
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        SendEvents.request_contacts_permission_completed,
        { permissionStatus: RESULTS.BLOCKED }
      )
      expect(getByTestId('SelectRecipient/ContactsModal').props.visible).toEqual(showsModal)
    }
  )
})

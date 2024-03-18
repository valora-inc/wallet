import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import { FetchMock } from 'jest-fetch-mock'
import React from 'react'
import { Provider } from 'react-redux'
import { showError } from 'src/alert/actions'
import { KeylessBackupEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import KeylessBackupPhoneCodeInput from 'src/keylessBackup/KeylessBackupPhoneCodeInput'
import { valoraKeyshareIssued } from 'src/keylessBackup/slice'
import { KeylessBackupFlow } from 'src/keylessBackup/types'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import networkConfig from 'src/web3/networkConfig'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'

const mockFetch = fetch as FetchMock
const store = createMockStore()

const renderComponent = (keylessBackupFlow: KeylessBackupFlow = KeylessBackupFlow.Setup) =>
  render(
    <Provider store={store}>
      <MockedNavigator
        component={KeylessBackupPhoneCodeInput}
        params={{
          keylessBackupFlow,
          e164Number: '+15555555555',
        }}
      />
    </Provider>
  )

describe('KeylessBackupPhoneCodeInput', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    store.clearActions()
    mockFetch.resetMocks()
  })

  it('displays the correct components and requests sms code on mount', async () => {
    const { getByTestId, getByText } = renderComponent()

    expect(getByText('phoneVerificationInput.title')).toBeTruthy()
    expect(
      getByText('phoneVerificationInput.description, {"phoneNumber":"+15555555555"}')
    ).toBeTruthy()
    expect(getByText('phoneVerificationInput.help')).toBeTruthy()
    expect(getByTestId('PhoneVerificationCode')).toBeTruthy()
    expect(getByTestId('CancelButton')).toBeTruthy()
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))
    expect(mockFetch).toHaveBeenCalledWith(`${networkConfig.cabIssueSmsCodeUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{"phoneNumber":"+15555555555","clientPlatform":"android","clientBundleId":"org.celo.mobile.debug"}',
    })
  })

  it('displays an error if verification code request fails', async () => {
    mockFetch.mockResponseOnce(JSON.stringify({ message: 'something went wrong' }), { status: 500 })
    renderComponent()

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))
    expect(store.getActions()).toEqual(
      expect.arrayContaining([showError(ErrorMessages.PHONE_NUMBER_VERIFICATION_FAILURE)])
    )
  })

  it('verifies the sms code and stores keyshare', async () => {
    mockFetch.mockResponseOnce(JSON.stringify({}), {
      status: 200,
    })
    mockFetch.mockResponseOnce(
      JSON.stringify({ keyshare: 'valora-keyshare', token: 'abc.def.ghi' }),
      {
        status: 200,
      }
    )

    const { getByTestId } = renderComponent(KeylessBackupFlow.Setup)

    await act(() => {
      fireEvent.changeText(getByTestId('PhoneVerificationCode'), '123456')
    })

    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1))
    expect(mockFetch).toHaveBeenNthCalledWith(2, `${networkConfig.cabIssueValoraKeyshareUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{"phoneNumber":"+15555555555","smsCode":"123456","clientPlatform":"android","clientBundleId":"org.celo.mobile.debug"}',
    })
    expect(getByTestId('PhoneVerificationCode/CheckIcon')).toBeTruthy()

    expect(store.getActions()).toEqual([
      valoraKeyshareIssued({
        keyshare: 'valora-keyshare',
        keylessBackupFlow: KeylessBackupFlow.Setup,
        jwt: 'abc.def.ghi',
      }),
    ])

    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(Screens.KeylessBackupProgress, {
      keylessBackupFlow: KeylessBackupFlow.Setup,
    })
  })

  it('shows error in verifying sms code', async () => {
    mockFetch.mockResponseOnce(JSON.stringify({}), {
      status: 200,
    })
    mockFetch.mockRejectedValue(JSON.stringify({ message: 'Not OK' }))

    const { getByTestId } = renderComponent()

    await act(() => {
      fireEvent.changeText(getByTestId('PhoneVerificationCode'), '123456')
    })

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))
    expect(mockFetch).toHaveBeenNthCalledWith(2, `${networkConfig.cabIssueValoraKeyshareUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{"phoneNumber":"+15555555555","smsCode":"123456","clientPlatform":"android","clientBundleId":"org.celo.mobile.debug"}',
    })
    expect(getByTestId('PhoneVerificationCode/ErrorIcon')).toBeTruthy()
    expect(store.getActions()).toEqual([])

    jest.runOnlyPendingTimers()
    expect(navigate).not.toHaveBeenCalled()
  })
  it('displays the help bottom sheet and track analytics event when pressing the help button', async () => {
    const { getByTestId } = renderComponent()

    expect(getByTestId('KeylessBackupPhoneCodeInputHelp')).toBeTruthy()
    fireEvent.press(getByTestId('KeylessBackupPhoneCodeInputHelp'))
    expect(getByTestId('KeylessBackupPhoneCodeInput/HelpInfoBottomSheet')).toBeTruthy()
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      KeylessBackupEvents.cab_phone_verification_help,
      { keylessBackupFlow: KeylessBackupFlow.Setup }
    )
  })
  it('tracks analytics event when pressing go back button', async () => {
    const { getByTestId } = renderComponent()

    expect(getByTestId('KeylessBackupPhoneCodeInputHelp')).toBeTruthy()
    fireEvent.press(getByTestId('KeylessBackupPhoneCodeInputHelp'))
    expect(getByTestId('KeylessBackupPhoneCodeInput/HelpInfoBottomSheet/GoBack')).toBeTruthy()
    fireEvent.press(getByTestId('KeylessBackupPhoneCodeInput/HelpInfoBottomSheet/GoBack'))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      KeylessBackupEvents.cab_phone_verification_help_go_back,
      { keylessBackupFlow: KeylessBackupFlow.Setup }
    )
  })
  it('goes to home screen and track analytics event when pressing skip button in setup flow', async () => {
    const { getByTestId } = renderComponent()

    expect(getByTestId('KeylessBackupPhoneCodeInputHelp')).toBeTruthy()
    fireEvent.press(getByTestId('KeylessBackupPhoneCodeInputHelp'))
    expect(getByTestId('KeylessBackupPhoneCodeInput/HelpInfoBottomSheet/Skip')).toBeTruthy()
    fireEvent.press(getByTestId('KeylessBackupPhoneCodeInput/HelpInfoBottomSheet/Skip'))
    expect(navigateHome).toHaveBeenCalledWith()
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      KeylessBackupEvents.cab_phone_verification_help_skip,
      { keylessBackupFlow: KeylessBackupFlow.Setup }
    )
  })
  it('goes to ImportSelect screen and track analytics event when pressing skip button in restore flow', async () => {
    const { getByTestId } = renderComponent(KeylessBackupFlow.Restore)

    expect(getByTestId('KeylessBackupPhoneCodeInputHelp')).toBeTruthy()
    fireEvent.press(getByTestId('KeylessBackupPhoneCodeInputHelp'))
    expect(getByTestId('KeylessBackupPhoneCodeInput/HelpInfoBottomSheet/Skip')).toBeTruthy()
    fireEvent.press(getByTestId('KeylessBackupPhoneCodeInput/HelpInfoBottomSheet/Skip'))
    expect(navigate).toHaveBeenCalledWith(Screens.ImportSelect)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      KeylessBackupEvents.cab_phone_verification_help_skip,
      { keylessBackupFlow: KeylessBackupFlow.Restore }
    )
  })
})

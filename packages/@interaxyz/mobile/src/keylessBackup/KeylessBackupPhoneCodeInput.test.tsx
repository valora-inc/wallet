import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import { FetchMock } from 'jest-fetch-mock'
import React from 'react'
import { Provider } from 'react-redux'
import { showError } from 'src/alert/actions'
import { KeylessBackupEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import KeylessBackupPhoneCodeInput from 'src/keylessBackup/KeylessBackupPhoneCodeInput'
import { appKeyshareIssued } from 'src/keylessBackup/slice'
import { KeylessBackupFlow, KeylessBackupOrigin } from 'src/keylessBackup/types'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import networkConfig from 'src/web3/networkConfig'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'

const mockFetch = fetch as FetchMock
const store = createMockStore()

const renderComponent = ({
  keylessBackupFlow = KeylessBackupFlow.Setup,
  origin = KeylessBackupOrigin.Onboarding,
}: { keylessBackupFlow?: KeylessBackupFlow; origin?: KeylessBackupOrigin } = {}) =>
  render(
    <Provider store={store}>
      <MockedNavigator
        component={KeylessBackupPhoneCodeInput}
        params={{
          keylessBackupFlow,
          origin,
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

  it.each([
    {
      keylessBackupFlow: KeylessBackupFlow.Setup,
      origin: KeylessBackupOrigin.Onboarding,
      leftHeader: 'BackButton',
    },
    {
      keylessBackupFlow: KeylessBackupFlow.Setup,
      origin: KeylessBackupOrigin.Settings,
      leftHeader: 'CancelButton',
    },
    {
      keylessBackupFlow: KeylessBackupFlow.Restore,
      origin: KeylessBackupOrigin.Onboarding,
      leftHeader: 'CancelButton',
    },
  ])(
    'displays the correct components and requests sms code on mount (flow: $keylessBackupFlow, origin: $origin)',
    async ({ keylessBackupFlow, origin, leftHeader }) => {
      const { getByTestId, getByText } = renderComponent({ keylessBackupFlow, origin })

      expect(getByText('phoneVerificationInput.title')).toBeTruthy()
      expect(
        getByText('phoneVerificationInput.description, {"phoneNumber":"+15555555555"}')
      ).toBeTruthy()
      expect(getByText('phoneVerificationInput.help')).toBeTruthy()
      expect(getByTestId('PhoneVerificationCode')).toBeTruthy()
      expect(getByTestId(leftHeader)).toBeTruthy()
      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))
      expect(mockFetch).toHaveBeenCalledWith(`${networkConfig.cabIssueSmsCodeUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{"phoneNumber":"+15555555555","clientPlatform":"android","clientBundleId":"org.celo.mobile.debug"}',
      })
    }
  )

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
    mockFetch.mockResponseOnce(JSON.stringify({ keyshare: 'app-keyshare', token: 'abc.def.ghi' }), {
      status: 200,
    })

    const { getByTestId } = renderComponent()

    await act(() => {
      fireEvent.changeText(getByTestId('PhoneVerificationCode'), '123456')
    })

    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1))
    expect(mockFetch).toHaveBeenNthCalledWith(2, `${networkConfig.cabIssueAppKeyshareUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{"phoneNumber":"+15555555555","smsCode":"123456","clientPlatform":"android","clientBundleId":"org.celo.mobile.debug"}',
    })
    expect(getByTestId('PhoneVerificationCode/CheckIcon')).toBeTruthy()

    expect(store.getActions()).toEqual([
      appKeyshareIssued({
        keyshare: 'app-keyshare',
        keylessBackupFlow: KeylessBackupFlow.Setup,
        jwt: 'abc.def.ghi',
        origin: KeylessBackupOrigin.Onboarding,
      }),
    ])

    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(Screens.KeylessBackupProgress, {
      keylessBackupFlow: KeylessBackupFlow.Setup,
      origin: KeylessBackupOrigin.Onboarding,
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
    expect(mockFetch).toHaveBeenNthCalledWith(2, `${networkConfig.cabIssueAppKeyshareUrl}`, {
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
  it.each([
    {
      keylessBackupFlow: KeylessBackupFlow.Setup,
      origin: KeylessBackupOrigin.Onboarding,
      body: 'bodyCloudBackupOnboarding',
      primaryCta: 'useRecoveryPhrase',
      secondaryCta: 'dismiss',
    },
    {
      keylessBackupFlow: KeylessBackupFlow.Setup,
      origin: KeylessBackupOrigin.Settings,
      body: 'body',
      primaryCta: 'dismiss',
      secondaryCta: 'skip',
    },
    {
      keylessBackupFlow: KeylessBackupFlow.Restore,
      origin: KeylessBackupOrigin.Onboarding,
      body: 'body',
      primaryCta: 'dismiss',
      secondaryCta: 'skip',
    },
  ])(
    'displays the help bottom sheet and track analytics event when pressing the help button (flow: $keylessBackupFlow, origin: $origin)',
    async ({ keylessBackupFlow, origin, body, primaryCta, secondaryCta }) => {
      const { getByTestId, getByText } = renderComponent({ keylessBackupFlow, origin })

      expect(getByTestId('KeylessBackupPhoneCodeInputHelp')).toBeTruthy()
      fireEvent.press(getByTestId('KeylessBackupPhoneCodeInputHelp'))
      expect(getByTestId('KeylessBackupPhoneCodeInput/HelpInfoBottomSheet')).toBeTruthy()
      expect(AppAnalytics.track).toHaveBeenCalledWith(
        KeylessBackupEvents.cab_phone_verification_help,
        { keylessBackupFlow, origin }
      )
      expect(getByText(`phoneVerificationInput.helpDialog.${body}`)).toBeTruthy()
      expect(
        getByTestId('KeylessBackupPhoneCodeInput/HelpInfoBottomSheet/PrimaryCta')
      ).toHaveTextContent(`phoneVerificationInput.helpDialog.${primaryCta}`)
      expect(
        getByTestId('KeylessBackupPhoneCodeInput/HelpInfoBottomSheet/SecondaryCta')
      ).toHaveTextContent(`phoneVerificationInput.helpDialog.${secondaryCta}`)
    }
  )
  it('tracks go back analytics event when pressing primary cta in recovery flow', async () => {
    const { getByTestId } = renderComponent({ keylessBackupFlow: KeylessBackupFlow.Restore })

    fireEvent.press(getByTestId('KeylessBackupPhoneCodeInputHelp'))
    fireEvent.press(getByTestId('KeylessBackupPhoneCodeInput/HelpInfoBottomSheet/PrimaryCta'))
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      KeylessBackupEvents.cab_phone_verification_help_go_back,
      { keylessBackupFlow: KeylessBackupFlow.Restore, origin: KeylessBackupOrigin.Onboarding }
    )
  })
  it('goes to recovery education and track analytics event when pressing primary cta in setup flow on onboarding', async () => {
    const { getByTestId } = renderComponent()

    fireEvent.press(getByTestId('KeylessBackupPhoneCodeInputHelp'))
    fireEvent.press(getByTestId('KeylessBackupPhoneCodeInput/HelpInfoBottomSheet/PrimaryCta'))
    expect(navigate).toHaveBeenCalledWith(Screens.AccountKeyEducation)
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      KeylessBackupEvents.cab_phone_verification_help_use_phrase,
      { keylessBackupFlow: KeylessBackupFlow.Setup, origin: KeylessBackupOrigin.Onboarding }
    )
  })
  it('goes to home screen and track analytics event when pressing secondary cta in setup flow on settings', async () => {
    const { getByTestId } = renderComponent({ origin: KeylessBackupOrigin.Settings })

    fireEvent.press(getByTestId('KeylessBackupPhoneCodeInputHelp'))
    fireEvent.press(getByTestId('KeylessBackupPhoneCodeInput/HelpInfoBottomSheet/SecondaryCta'))
    expect(navigateHome).toHaveBeenCalledWith()
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      KeylessBackupEvents.cab_phone_verification_help_skip,
      { keylessBackupFlow: KeylessBackupFlow.Setup, origin: KeylessBackupOrigin.Settings }
    )
  })
  it('goes to ImportSelect screen and track analytics event when pressing secondary cta in restore flow', async () => {
    const { getByTestId } = renderComponent({ keylessBackupFlow: KeylessBackupFlow.Restore })

    fireEvent.press(getByTestId('KeylessBackupPhoneCodeInputHelp'))
    fireEvent.press(getByTestId('KeylessBackupPhoneCodeInput/HelpInfoBottomSheet/SecondaryCta'))
    expect(navigate).toHaveBeenCalledWith(Screens.ImportSelect)
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      KeylessBackupEvents.cab_phone_verification_help_skip,
      { keylessBackupFlow: KeylessBackupFlow.Restore, origin: KeylessBackupOrigin.Onboarding }
    )
  })
  it('tracks go back analytics event when pressing secondary cta in setup flow in onboarding', async () => {
    const { getByTestId } = renderComponent()

    fireEvent.press(getByTestId('KeylessBackupPhoneCodeInputHelp'))
    fireEvent.press(getByTestId('KeylessBackupPhoneCodeInput/HelpInfoBottomSheet/SecondaryCta'))
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      KeylessBackupEvents.cab_phone_verification_help_go_back,
      { keylessBackupFlow: KeylessBackupFlow.Setup, origin: KeylessBackupOrigin.Onboarding }
    )
  })
})

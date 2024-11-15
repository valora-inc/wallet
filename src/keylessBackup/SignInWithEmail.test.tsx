import { fireEvent, render, waitFor } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { KeylessBackupEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import SignInWithEmail from 'src/keylessBackup/SignInWithEmail'
import { auth0SignInCompleted } from 'src/keylessBackup/slice'
import { KeylessBackupFlow, KeylessBackupOrigin } from 'src/keylessBackup/types'
import { noHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import Logger from 'src/utils/Logger'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'

const mockAuthorize = jest.fn()
const mockGetCredentials = jest.fn()
const mockClearCredentials = jest.fn()

jest.mock('react-native-auth0', () => ({
  useAuth0: jest.fn(() => ({
    authorize: mockAuthorize,
    getCredentials: mockGetCredentials,
    clearCredentials: mockClearCredentials,
  })),
}))

jest.mock('src/statsig')

const store = createMockStore()
const renderComponent = (
  keylessBackupFlow: KeylessBackupFlow = KeylessBackupFlow.Setup,
  origin: KeylessBackupOrigin = KeylessBackupOrigin.Settings,
  storeOverride?: ReturnType<typeof createMockStore>
) =>
  render(
    <Provider store={storeOverride ?? store}>
      <MockedNavigator
        component={SignInWithEmail}
        params={{
          keylessBackupFlow,
          origin,
        }}
        options={noHeader}
      />
    </Provider>
  )

describe('SignInWithEmail', () => {
  let logWarnSpy: jest.SpyInstance
  let logDebugSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    store.clearActions()
    mockAuthorize.mockResolvedValue(undefined)
    mockGetCredentials.mockResolvedValue({ idToken: 'mock-token' })
    jest
      .mocked(getFeatureGate)
      .mockImplementation(
        (gate) =>
          gate === StatsigFeatureGates.SHOW_APPLE_IN_CAB ||
          gate === StatsigFeatureGates.SHOW_ONBOARDING_PHONE_VERIFICATION
      )
    logWarnSpy = jest.spyOn(Logger, 'warn')
    logDebugSpy = jest.spyOn(Logger, 'debug')
  })

  it('spins when no address and coming from setup flow in onboarding', () => {
    const storeNoAddress = createMockStore({ web3: { account: undefined } })
    const { getByTestId } = renderComponent(
      KeylessBackupFlow.Setup,
      KeylessBackupOrigin.Onboarding,
      storeNoAddress
    )
    expect(getByTestId('SignInWithEmail/Spinner')).toBeTruthy()
  })

  it('does not spin when no address and coming from setup flow in settings', () => {
    const storeNoAddress = createMockStore({ web3: { account: undefined } })
    const { queryByTestId } = renderComponent(
      KeylessBackupFlow.Setup,
      KeylessBackupOrigin.Settings,
      storeNoAddress
    )
    expect(queryByTestId('SignInWithEmail/Spinner')).toBeFalsy()
  })

  it('does not spin  when no address and coming from recovery flow', () => {
    const { queryByTestId } = renderComponent(KeylessBackupFlow.Setup)
    expect(queryByTestId('SignInWithEmail/Spinner')).toBeFalsy()
  })

  it.each([
    [KeylessBackupFlow.Setup, 'subtitle'],
    [KeylessBackupFlow.Restore, 'subtitleRestore'],
  ])('renders correctly for %s', async (flow, subtitleText) => {
    const { getByTestId, getByText } = renderComponent(flow)

    expect(getByText('signInWithEmail.title')).toBeTruthy()
    expect(getByText(`signInWithEmail.${subtitleText}`)).toBeTruthy()
    expect(getByTestId('SignInWithEmail/Google')).toBeTruthy()
    expect(getByTestId('CancelButton')).toBeTruthy()
  })

  describe.each([
    { provider: 'apple', testId: 'SignInWithEmail/Apple' },
    { provider: 'google-oauth2', testId: 'SignInWithEmail/Google' },
  ])('Google and Apple buttons', ({ provider, testId }) => {
    it(`pressing ${testId} button invokes authorize and dispatches action with idToken on success`, async () => {
      const { getByTestId } = renderComponent()
      const continueButton = getByTestId(testId)
      fireEvent.press(continueButton)
      expect(AppAnalytics.track).toHaveBeenCalledWith('cab_sign_in_start', {
        keylessBackupFlow: KeylessBackupFlow.Setup,
        origin: KeylessBackupOrigin.Settings,
        provider,
      })
      expect(getByTestId('Button/Loading')).toBeTruthy()
      await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1))
      expect(navigate).toHaveBeenCalledWith(Screens.KeylessBackupPhoneInput, {
        keylessBackupFlow: KeylessBackupFlow.Setup,
        origin: KeylessBackupOrigin.Settings,
      })
      expect(mockClearCredentials).toHaveBeenCalledTimes(1)
      expect(mockAuthorize).toHaveBeenCalledTimes(1)
      expect(mockGetCredentials).toHaveBeenCalledTimes(1)
      expect(store.getActions()).toEqual([
        {
          payload: { keylessBackupFlow: 'setup' },
          type: 'keylessBackup/keylessBackupStarted',
        },
        auth0SignInCompleted({ idToken: 'mock-token' }),
      ])
      expect(AppAnalytics.track).toHaveBeenCalledWith('cab_sign_in_success', {
        keylessBackupFlow: KeylessBackupFlow.Setup,
        origin: KeylessBackupOrigin.Settings,
        provider,
      })
      expect(AppAnalytics.track).toHaveBeenCalledTimes(2)
      expect(logWarnSpy).not.toHaveBeenCalled()
    })
    it(`pressing ${testId} button invokes authorize and logs warning if authorize fails`, async () => {
      mockAuthorize.mockRejectedValue(new Error('auth failed'))
      const { getByTestId, queryByTestId } = renderComponent()
      const continueButton = getByTestId(testId)
      fireEvent.press(continueButton)
      expect(getByTestId('Button/Loading')).toBeTruthy()
      expect(AppAnalytics.track).toHaveBeenCalledWith('cab_sign_in_start', {
        keylessBackupFlow: KeylessBackupFlow.Setup,
        origin: KeylessBackupOrigin.Settings,
        provider,
      })
      await waitFor(() => expect(logWarnSpy).toHaveBeenCalledTimes(1))
      expect(navigate).not.toHaveBeenCalled()
      expect(mockClearCredentials).toHaveBeenCalledTimes(1)
      expect(mockAuthorize).toHaveBeenCalledTimes(1)
      expect(mockGetCredentials).not.toHaveBeenCalled()
      expect(store.getActions()).toEqual([
        {
          payload: { keylessBackupFlow: 'setup' },
          type: 'keylessBackup/keylessBackupStarted',
        },
      ])
      expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
      expect(queryByTestId('Button/Loading')).toBeNull()
    })

    it(`pressing ${testId} button invokes authorize and logs warning if idToken is not present in credentials`, async () => {
      mockGetCredentials.mockResolvedValue({})
      const { getByTestId, queryByTestId } = renderComponent()
      const continueButton = getByTestId(testId)
      fireEvent.press(continueButton)
      expect(getByTestId('Button/Loading')).toBeTruthy()
      expect(AppAnalytics.track).toHaveBeenCalledWith('cab_sign_in_start', {
        keylessBackupFlow: KeylessBackupFlow.Setup,
        origin: KeylessBackupOrigin.Settings,
        provider,
      })
      await waitFor(() => expect(logWarnSpy).toHaveBeenCalledTimes(1))
      expect(navigate).not.toHaveBeenCalled()
      expect(mockClearCredentials).toHaveBeenCalledTimes(1)
      expect(mockAuthorize).toHaveBeenCalledTimes(1)
      expect(mockGetCredentials).toHaveBeenCalledTimes(1)
      expect(store.getActions()).toEqual([
        {
          payload: { keylessBackupFlow: 'setup' },
          type: 'keylessBackup/keylessBackupStarted',
        },
      ])
      expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
      expect(queryByTestId('Button/Loading')).toBeNull()
    })

    it(`pressing ${testId} button invokes authorize and logs debug message if login is cancelled (empty credentials)`, async () => {
      mockGetCredentials.mockResolvedValue(undefined)
      const { getByTestId, queryByTestId } = renderComponent()
      const continueButton = getByTestId(testId)
      fireEvent.press(continueButton)
      expect(getByTestId('Button/Loading')).toBeTruthy()
      expect(AppAnalytics.track).toHaveBeenCalledWith('cab_sign_in_start', {
        keylessBackupFlow: KeylessBackupFlow.Setup,
        origin: KeylessBackupOrigin.Settings,
        provider,
      })
      await waitFor(() =>
        expect(logDebugSpy).toHaveBeenCalledWith('keylessBackup/SignInWithEmail', 'login cancelled')
      )
      expect(navigate).not.toHaveBeenCalled()
      expect(mockClearCredentials).toHaveBeenCalledTimes(1)
      expect(mockAuthorize).toHaveBeenCalledTimes(1)
      expect(mockGetCredentials).toHaveBeenCalledTimes(1)
      expect(store.getActions()).toEqual([
        {
          payload: { keylessBackupFlow: 'setup' },
          type: 'keylessBackup/keylessBackupStarted',
        },
      ])
      expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
      expect(logWarnSpy).not.toHaveBeenCalled()
      expect(queryByTestId('Button/Loading')).toBeNull()
    })
  })

  it('Apple button is only rendered if feature flag is enabled', async () => {
    jest.mocked(getFeatureGate).mockReturnValueOnce(false)

    const noAppleRender = renderComponent()
    expect(noAppleRender.getByTestId('SignInWithEmail/Google')).toBeTruthy()
    expect(noAppleRender.queryByTestId('SignInWithEmail/Apple')).toBeNull()

    jest.mocked(getFeatureGate).mockReturnValueOnce(true)
    const appleRender = renderComponent()
    expect(appleRender.getByTestId('SignInWithEmail/Google')).toBeTruthy()
    expect(appleRender.getByTestId('SignInWithEmail/Apple')).toBeTruthy()
  })

  it("pressing 'Sign in another way' then 'continue' navigates to recovery phrase education", () => {
    const { getByTestId, getByText } = renderComponent(
      KeylessBackupFlow.Setup,
      KeylessBackupOrigin.Onboarding
    )
    expect(getByText('signInWithEmail.title')).toBeTruthy()
    expect(getByText('signInWithEmail.subtitle')).toBeTruthy()
    expect(getByTestId('SignInWithEmail/Google')).toBeTruthy()
    expect(getByTestId('SignInWithEmail/SignInAnotherWay')).toBeTruthy()

    fireEvent.press(getByTestId('SignInWithEmail/SignInAnotherWay'))
    expect(getByTestId('KeylessBackupSignInWithEmail/BottomSheet')).toBeTruthy()

    fireEvent.press(getByText('signInWithEmail.bottomSheet.continue'))
    expect(navigate).toHaveBeenCalledWith(Screens.AccountKeyEducation, {
      origin: 'cabOnboarding',
    })
    expect(AppAnalytics.track).toHaveBeenCalledWith(KeylessBackupEvents.cab_setup_recovery_phrase)
  })

  it("pressing 'Sign in another way' then 'Skip (not recommended)' navigates to next onboarding screen", () => {
    const { getByTestId, getByText } = renderComponent(
      KeylessBackupFlow.Setup,
      KeylessBackupOrigin.Onboarding
    )
    expect(getByText('signInWithEmail.title')).toBeTruthy()
    expect(getByText('signInWithEmail.subtitle')).toBeTruthy()
    expect(getByTestId('SignInWithEmail/Google')).toBeTruthy()
    expect(getByTestId('SignInWithEmail/SignInAnotherWay')).toBeTruthy()

    fireEvent.press(getByTestId('SignInWithEmail/SignInAnotherWay'))
    expect(getByTestId('KeylessBackupSignInWithEmail/BottomSheet')).toBeTruthy()

    fireEvent.press(getByText('signInWithEmail.bottomSheet.skip'))
    expect(navigate).toHaveBeenCalledWith(Screens.VerificationStartScreen)
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      KeylessBackupEvents.cab_sign_in_with_email_screen_skip,
      {
        keylessBackupFlow: KeylessBackupFlow.Setup,
        origin: KeylessBackupOrigin.Onboarding,
      }
    )
  })
})

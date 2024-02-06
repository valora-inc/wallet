import { fireEvent, render, waitFor } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import SignInWithEmail from 'src/keylessBackup/SignInWithEmail'
import { googleSignInCompleted } from 'src/keylessBackup/slice'
import { KeylessBackupFlow } from 'src/keylessBackup/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
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

const store = createMockStore()
const renderComponent = (keylessBackupFlow: KeylessBackupFlow = KeylessBackupFlow.Setup) =>
  render(
    <Provider store={store}>
      <MockedNavigator
        component={SignInWithEmail}
        params={{
          keylessBackupFlow,
        }}
        options={SignInWithEmail.navigationOptions}
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
    mockGetCredentials.mockResolvedValue({ idToken: 'google-token' })
    logWarnSpy = jest.spyOn(Logger, 'warn')
    logDebugSpy = jest.spyOn(Logger, 'debug')
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

  it('pressing button invokes authorize and dispatches action with idToken on success', async () => {
    const { getByTestId } = renderComponent()
    const continueButton = getByTestId('SignInWithEmail/Google')
    fireEvent.press(continueButton)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith('cab_sign_in_with_google', {
      keylessBackupFlow: KeylessBackupFlow.Setup,
    })
    expect(getByTestId('Button/Loading')).toBeTruthy()
    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1))
    expect(navigate).toHaveBeenCalledWith(Screens.KeylessBackupPhoneInput, {
      keylessBackupFlow: KeylessBackupFlow.Setup,
    })
    expect(mockClearCredentials).toHaveBeenCalledTimes(1)
    expect(mockAuthorize).toHaveBeenCalledTimes(1)
    expect(mockGetCredentials).toHaveBeenCalledTimes(1)
    expect(store.getActions()).toEqual([
      {
        payload: { keylessBackupFlow: 'setup' },
        type: 'keylessBackup/keylessBackupStarted',
      },
      googleSignInCompleted({ idToken: 'google-token' }),
    ])
    expect(ValoraAnalytics.track).toHaveBeenCalledWith('cab_sign_in_with_google_success', {
      keylessBackupFlow: KeylessBackupFlow.Setup,
    })
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(2)
    expect(logWarnSpy).not.toHaveBeenCalled()
  })

  it('pressing button invokes authorize and logs warning if authorize fails', async () => {
    mockAuthorize.mockRejectedValue(new Error('auth failed'))
    const { getByTestId, queryByTestId } = renderComponent()
    const continueButton = getByTestId('SignInWithEmail/Google')
    fireEvent.press(continueButton)
    expect(getByTestId('Button/Loading')).toBeTruthy()
    expect(ValoraAnalytics.track).toHaveBeenCalledWith('cab_sign_in_with_google', {
      keylessBackupFlow: KeylessBackupFlow.Setup,
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
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(queryByTestId('Button/Loading')).toBeNull()
  })

  it('pressing button invokes authorize and logs warning if idToken is not present in credentials', async () => {
    mockGetCredentials.mockResolvedValue({})
    const { getByTestId, queryByTestId } = renderComponent()
    const continueButton = getByTestId('SignInWithEmail/Google')
    fireEvent.press(continueButton)
    expect(getByTestId('Button/Loading')).toBeTruthy()
    expect(ValoraAnalytics.track).toHaveBeenCalledWith('cab_sign_in_with_google', {
      keylessBackupFlow: KeylessBackupFlow.Setup,
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
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(queryByTestId('Button/Loading')).toBeNull()
  })

  it('pressing button invokes authorize and logs debug message if login is cancelled (empty credentials)', async () => {
    mockGetCredentials.mockResolvedValue(undefined)
    const { getByTestId, queryByTestId } = renderComponent()
    const continueButton = getByTestId('SignInWithEmail/Google')
    fireEvent.press(continueButton)
    expect(getByTestId('Button/Loading')).toBeTruthy()
    expect(ValoraAnalytics.track).toHaveBeenCalledWith('cab_sign_in_with_google', {
      keylessBackupFlow: KeylessBackupFlow.Setup,
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
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(logWarnSpy).not.toHaveBeenCalled()
    expect(queryByTestId('Button/Loading')).toBeNull()
  })
})

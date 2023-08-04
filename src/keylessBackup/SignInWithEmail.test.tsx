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

describe('SignInWithEmail', () => {
  const store = createMockStore()
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

  it('pressing button invokes authorize and dispatches action with idToken on success', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <SignInWithEmail />
      </Provider>
    )
    const continueButton = getByTestId('SignInWithEmail/Google')
    fireEvent.press(continueButton)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith('cab_sign_in_with_google')
    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1))
    expect(navigate).toHaveBeenCalledWith(Screens.KeylessBackupPhoneInput, {
      keylessBackupFlow: KeylessBackupFlow.Setup,
    })
    expect(mockClearCredentials).toHaveBeenCalledTimes(1)
    expect(mockAuthorize).toHaveBeenCalledTimes(1)
    expect(mockGetCredentials).toHaveBeenCalledTimes(1)
    expect(store.getActions()).toEqual([googleSignInCompleted({ idToken: 'google-token' })])
    expect(ValoraAnalytics.track).toHaveBeenCalledWith('cab_sign_in_with_google_success')
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(2)
    expect(logWarnSpy).not.toHaveBeenCalled()
  })

  it('pressing button invokes authorize and logs warning if authorize fails', async () => {
    mockAuthorize.mockRejectedValue(new Error('auth failed'))
    const { getByTestId } = render(
      <Provider store={store}>
        <SignInWithEmail />
      </Provider>
    )
    const continueButton = getByTestId('SignInWithEmail/Google')
    fireEvent.press(continueButton)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith('cab_sign_in_with_google')
    await waitFor(() => expect(logWarnSpy).toHaveBeenCalledTimes(1))
    expect(navigate).not.toHaveBeenCalled()
    expect(mockClearCredentials).toHaveBeenCalledTimes(1)
    expect(mockAuthorize).toHaveBeenCalledTimes(1)
    expect(mockGetCredentials).not.toHaveBeenCalled()
    expect(store.getActions()).toEqual([])
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
  })

  it('pressing button invokes authorize and logs warning if idToken is not present in credentials', async () => {
    mockGetCredentials.mockResolvedValue({})
    const { getByTestId } = render(
      <Provider store={store}>
        <SignInWithEmail />
      </Provider>
    )
    const continueButton = getByTestId('SignInWithEmail/Google')
    fireEvent.press(continueButton)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith('cab_sign_in_with_google')
    await waitFor(() => expect(logWarnSpy).toHaveBeenCalledTimes(1))
    expect(navigate).not.toHaveBeenCalled()
    expect(mockClearCredentials).toHaveBeenCalledTimes(1)
    expect(mockAuthorize).toHaveBeenCalledTimes(1)
    expect(mockGetCredentials).toHaveBeenCalledTimes(1)
    expect(store.getActions()).toEqual([])
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
  })

  it('pressing button invokes authorize and logs debug message if login is cancelled (empty credentials)', async () => {
    mockGetCredentials.mockResolvedValue(undefined)
    const { getByTestId } = render(
      <Provider store={store}>
        <SignInWithEmail />
      </Provider>
    )
    const continueButton = getByTestId('SignInWithEmail/Google')
    fireEvent.press(continueButton)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith('cab_sign_in_with_google')
    await waitFor(() =>
      expect(logDebugSpy).toHaveBeenCalledWith('keylessBackup/SignInWithEmail', 'login cancelled')
    )
    expect(navigate).not.toHaveBeenCalled()
    expect(mockClearCredentials).toHaveBeenCalledTimes(1)
    expect(mockAuthorize).toHaveBeenCalledTimes(1)
    expect(mockGetCredentials).toHaveBeenCalledTimes(1)
    expect(store.getActions()).toEqual([])
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(logWarnSpy).not.toHaveBeenCalled()
  })
})

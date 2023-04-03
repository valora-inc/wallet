import { act, render } from '@testing-library/react-native'
import { TFunction } from 'i18next'
import * as React from 'react'
import 'react-native'
import { Text } from 'react-native'
import * as RNLocalize from 'react-native-localize'
import { Provider } from 'react-redux'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import AppInitGate from 'src/app/AppInitGate'
import * as I18n from 'src/i18n'
import * as I18nActions from 'src/i18n/slice'
import { navigateToError } from 'src/navigator/NavigationService'
import { createMockStore, flushMicrotasksQueue } from 'test/utils'
import { mocked } from 'ts-jest/utils'

jest.mock('src/i18n', () => ({
  initI18n: jest.fn(),
  changeLanguage: jest.fn(() => new Promise(setImmediate)),
  t: jest.fn(),
}))

jest.mock('src/navigator/NavigationService', () => ({
  navigateToError: jest.fn().mockReturnValueOnce(undefined),
}))

const mockedI18n = I18n as jest.Mocked<typeof I18n>
const setLanguageSpy = jest.spyOn(I18nActions, 'setLanguage')

const renderAppInitGate = (language: string | null) =>
  render(
    <Provider store={createMockStore({ i18n: { language } })}>
      <AppInitGate loading={<Text>Loading component</Text>}>
        <Text>App</Text>
      </AppInitGate>
    </Provider>
  )

describe('AppInitGate', () => {
  const initI18nPromise = Promise.resolve<TFunction>(jest.fn())
  mockedI18n.initI18n.mockImplementation(jest.fn(() => initI18nPromise))

  const initAnalyticsPromise = Promise.resolve()
  mocked(ValoraAnalytics.init).mockImplementation(jest.fn(() => initAnalyticsPromise))

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render the fallback before i18n and analytics is initialised, and the app after initialisation', async () => {
    const { getByText, queryByText } = renderAppInitGate(null)

    expect(getByText('Loading component')).toBeTruthy()
    expect(queryByText('App')).toBeFalsy()

    await act(() => initI18nPromise)
    await act(() => initAnalyticsPromise)

    expect(getByText('App')).toBeTruthy()
    expect(queryByText('Loading component')).toBeFalsy()
    expect(navigateToError).not.toHaveBeenCalled()
  })

  it('should initialise i18n with the store language if it exists', async () => {
    renderAppInitGate('pt-BR')
    await act(() => initI18nPromise)
    await act(() => initAnalyticsPromise)

    expect(mockedI18n.initI18n).toHaveBeenCalledTimes(1)
    expect(mockedI18n.initI18n).toHaveBeenCalledWith('pt-BR', false, '0')
    expect(setLanguageSpy).not.toHaveBeenCalled()
    expect(navigateToError).not.toHaveBeenCalled()
  })

  it('should initialise i18n with the best language available and set the store language', async () => {
    jest
      .spyOn(RNLocalize, 'findBestAvailableLanguage')
      .mockReturnValue({ languageTag: 'de', isRTL: true })

    renderAppInitGate(null)
    await act(() => initI18nPromise)
    await act(() => initAnalyticsPromise)

    expect(mockedI18n.initI18n).toHaveBeenCalledTimes(1)
    expect(mockedI18n.initI18n).toHaveBeenCalledWith('de', false, '0')
    expect(setLanguageSpy).toHaveBeenCalledWith('de')
    expect(navigateToError).not.toHaveBeenCalled()
  })

  it('should initialise i18n with the default fallback language', async () => {
    jest.spyOn(RNLocalize, 'findBestAvailableLanguage').mockReturnValueOnce(undefined)

    renderAppInitGate(null)
    await act(() => initI18nPromise)
    await act(() => initAnalyticsPromise)

    expect(mockedI18n.initI18n).toHaveBeenCalledTimes(1)
    expect(mockedI18n.initI18n).toHaveBeenCalledWith('en-US', false, '0')
    expect(setLanguageSpy).not.toHaveBeenCalled()
    expect(navigateToError).not.toHaveBeenCalled()
  })

  it('should show error screen in case of failed i18n init', async () => {
    const initI18nPromise = Promise.reject('some error')
    mockedI18n.initI18n.mockImplementationOnce(jest.fn(() => initI18nPromise))
    renderAppInitGate(null)

    await act(flushMicrotasksQueue)

    expect(mockedI18n.initI18n).toHaveBeenCalledTimes(1)
    expect(navigateToError).toHaveBeenCalledWith('appInitFailed', 'some error')
  })

  it('should show error screen in case of failed analytics init', async () => {
    mocked(ValoraAnalytics.init).mockRejectedValueOnce('some analytics error')
    renderAppInitGate(null)

    await act(flushMicrotasksQueue)

    expect(mockedI18n.initI18n).toHaveBeenCalledTimes(1)
    expect(navigateToError).toHaveBeenCalledWith('appInitFailed', 'some analytics error')
  })
})

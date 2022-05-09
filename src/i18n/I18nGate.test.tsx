import { act, render } from '@testing-library/react-native'
import { TFunction } from 'i18next'
import * as React from 'react'
import 'react-native'
import { Text } from 'react-native'
import * as RNLocalize from 'react-native-localize'
import { Provider } from 'react-redux'
import * as I18n from 'src/i18n'
import I18nGate from 'src/i18n/I18nGate'
import * as I18nActions from 'src/i18n/slice'
import { navigateToError } from 'src/navigator/NavigationService'
import { createMockStore, flushMicrotasksQueue } from 'test/utils'

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

const renderI18nGate = (language: string | null) =>
  render(
    <Provider store={createMockStore({ i18n: { language } })}>
      <I18nGate loading={<Text>Loading component</Text>}>
        <Text>App</Text>
      </I18nGate>
    </Provider>
  )

describe('I18nGate', () => {
  const initI18nPromise = Promise.resolve<TFunction>(jest.fn())
  mockedI18n.initI18n.mockImplementation(jest.fn(() => initI18nPromise))

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render the fallback before i18n is initialised, and the app after initialisation', async () => {
    const { getByText, queryByText } = renderI18nGate(null)

    expect(getByText('Loading component')).toBeTruthy()
    expect(queryByText('App')).toBeFalsy()

    await act(() => initI18nPromise)

    expect(getByText('App')).toBeTruthy()
    expect(queryByText('Loading component')).toBeFalsy()
  })

  it('should initialise i18n with the store language if it exists', async () => {
    renderI18nGate('pt-BR')
    await act(() => initI18nPromise)

    expect(mockedI18n.initI18n).toHaveBeenCalledTimes(1)
    expect(mockedI18n.initI18n).toHaveBeenCalledWith('pt-BR', false, '0')
    expect(setLanguageSpy).not.toHaveBeenCalled()
  })

  it('should initialise i18n with the best language available and set the store language', async () => {
    jest
      .spyOn(RNLocalize, 'findBestAvailableLanguage')
      .mockReturnValue({ languageTag: 'de', isRTL: true })

    renderI18nGate(null)
    await act(() => initI18nPromise)

    expect(mockedI18n.initI18n).toHaveBeenCalledTimes(1)
    expect(mockedI18n.initI18n).toHaveBeenCalledWith('de', false, '0')
    expect(setLanguageSpy).toHaveBeenCalledWith('de')
  })

  it('should initialise i18n with the default fallback language', async () => {
    jest.spyOn(RNLocalize, 'findBestAvailableLanguage').mockReturnValueOnce(undefined)

    renderI18nGate(null)
    await act(() => initI18nPromise)

    expect(mockedI18n.initI18n).toHaveBeenCalledTimes(1)
    expect(mockedI18n.initI18n).toHaveBeenCalledWith('en-US', false, '0')
    expect(setLanguageSpy).not.toHaveBeenCalled()
  })

  it('should show error screen in case of failed i18n init', async () => {
    const initI18nPromise = Promise.reject('some error')
    mockedI18n.initI18n.mockImplementationOnce(jest.fn(() => initI18nPromise))
    renderI18nGate(null)

    await act(flushMicrotasksQueue)

    expect(mockedI18n.initI18n).toHaveBeenCalledTimes(1)
    expect(navigateToError).toHaveBeenCalledWith('appInitFailed', 'some error')
  })
})

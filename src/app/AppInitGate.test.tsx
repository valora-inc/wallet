import { act, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Text } from 'react-native'
import * as RNLocalize from 'react-native-localize'
import { Provider } from 'react-redux'
import AppInitGate from 'src/app/AppInitGate'
import { initI18n } from 'src/i18n'
import * as I18nActions from 'src/i18n/slice'
import { navigateToError } from 'src/navigator/NavigationService'
import { waitUntilSagasFinishLoading } from 'src/redux/sagas'
import { createMockStore } from 'test/utils'
import { mocked } from 'ts-jest/utils'

jest.mock('src/redux/sagas', () => ({
  ...(jest.requireActual('src/redux/sagas') as any),
  waitUntilSagasFinishLoading: jest.fn(),
}))

jest.mock('src/i18n', () => ({
  ...(jest.requireActual('src/i18n') as any),
  initI18n: jest.fn().mockResolvedValue(jest.fn()),
  changeLanguage: jest.fn().mockResolvedValue(jest.fn()),
  t: jest.fn(),
}))

jest.mock('src/navigator/NavigationService', () => ({
  navigateToError: jest.fn().mockReturnValueOnce(undefined),
}))

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
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each`
    delayedInit    | sagasInitTime | i18nInitTime
    ${'i18n'}      | ${1000}       | ${5000}
    ${'root saga'} | ${1000}       | ${5000}
  `(
    'should render the fallback before $delayedInit is initialised',
    async ({ sagasInitTime, i18nInitTime }) => {
      mocked(initI18n).mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, i18nInitTime))
      )
      mocked(waitUntilSagasFinishLoading).mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, sagasInitTime))
      )
      const { getByText, queryByText } = renderAppInitGate(null)

      expect(getByText('Loading component')).toBeTruthy()
      expect(queryByText('App')).toBeFalsy()

      act(() => jest.advanceTimersByTime(2000))

      expect(getByText('Loading component')).toBeTruthy()
      expect(queryByText('App')).toBeFalsy()

      act(() => jest.advanceTimersByTime(5000))

      await waitFor(() => expect(getByText('App')).toBeTruthy())
      expect(queryByText('Loading component')).toBeFalsy()
      expect(navigateToError).not.toHaveBeenCalled()
    }
  )

  it('should initialise i18n with the store language if it exists', async () => {
    renderAppInitGate('pt-BR')

    await waitFor(() => expect(initI18n).toHaveBeenCalledTimes(1))
    expect(initI18n).toHaveBeenCalledWith('pt-BR', false, '0')
    expect(setLanguageSpy).not.toHaveBeenCalled()
    expect(navigateToError).not.toHaveBeenCalled()
  })

  it('should initialise i18n with the best language available and set the store language', async () => {
    jest
      .spyOn(RNLocalize, 'findBestAvailableLanguage')
      .mockReturnValue({ languageTag: 'de', isRTL: true })

    renderAppInitGate(null)

    await waitFor(() => expect(initI18n).toHaveBeenCalledTimes(1))
    expect(initI18n).toHaveBeenCalledWith('de', false, '0')
    expect(setLanguageSpy).toHaveBeenCalledWith('de')
    expect(navigateToError).not.toHaveBeenCalled()
  })

  it('should initialise i18n with the default fallback language', async () => {
    jest.spyOn(RNLocalize, 'findBestAvailableLanguage').mockReturnValueOnce(undefined)
    renderAppInitGate(null)

    await waitFor(() => expect(initI18n).toHaveBeenCalledTimes(1))
    expect(initI18n).toHaveBeenCalledWith('en-US', false, '0')
    expect(setLanguageSpy).not.toHaveBeenCalled()
    expect(navigateToError).not.toHaveBeenCalled()
  })

  it('should show error screen in case of failed i18n init', async () => {
    mocked(initI18n).mockRejectedValueOnce('some error')
    renderAppInitGate(null)

    await waitFor(() => expect(initI18n).toHaveBeenCalledTimes(1))
    expect(navigateToError).toHaveBeenCalledWith('appInitFailed', 'some error')
  })
})

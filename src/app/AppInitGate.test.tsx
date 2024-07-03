import { act, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import { Text } from 'react-native'
import * as RNLocalize from 'react-native-localize'
import { Provider } from 'react-redux'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { appMounted } from 'src/app/actions'
import AppInitGate from 'src/app/AppInitGate'
import { setLanguage } from 'src/i18n/slice'
import { navigateToError } from 'src/navigator/NavigationService'
import { waitUntilSagasFinishLoading } from 'src/redux/sagas'
import { createMockStore } from 'test/utils'

jest.mock('src/redux/store')
jest.mock('src/analytics/ValoraAnalytics')
jest.mock('src/redux/sagas', () => ({
  ...(jest.requireActual('src/redux/sagas') as any),
  waitUntilSagasFinishLoading: jest.fn(),
}))

jest.mock('src/i18n', () => ({
  ...(jest.requireActual('src/i18n') as any),
  changeLanguage: jest.fn().mockResolvedValue(jest.fn()),
  t: jest.fn(),
}))

jest.mock('src/navigator/NavigationService', () => ({
  navigateToError: jest.fn(),
}))

const renderAppInitGate = (language: string | null = 'en-US') => {
  const store = createMockStore({ i18n: { language } })
  const tree = render(
    <Provider store={store}>
      <AppInitGate appStartedMillis={1682415628} reactLoadTime={1682418628}>
        <Text>App</Text>
      </AppInitGate>
    </Provider>
  )

  return { ...tree, store }
}

beforeAll(() => {
  jest.useFakeTimers({ now: new Date(1682420628) })
})

describe('AppInitGate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the fallback before initialised', async () => {
    jest
      .mocked(waitUntilSagasFinishLoading)
      .mockImplementationOnce(() => new Promise((resolve) => setTimeout(resolve, 5000)))
    const { getByText, queryByText, store } = renderAppInitGate()
    await act(() => {
      jest.advanceTimersByTime(2000)
    })

    expect(queryByText('App')).toBeFalsy()

    await act(() => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => expect(getByText('App')).toBeTruthy())
    expect(store.getActions()).toEqual([appMounted()])
    expect(ValoraAnalytics.startSession).toHaveBeenCalledWith(
      'app_launched',
      expect.objectContaining({
        appLoadDuration: 12,
        deviceHeight: 1334,
        deviceWidth: 750,
        reactLoadDuration: 3,
      })
    )
    expect(navigateToError).not.toHaveBeenCalled()
  })

  it('should update the language if none was set', async () => {
    jest
      .spyOn(RNLocalize, 'findBestLanguageTag')
      .mockReturnValue({ languageTag: 'de-DE', isRTL: true })

    const { getByText, store } = renderAppInitGate(null)

    await waitFor(() => expect(getByText('App')).toBeTruthy())
    expect(store.getActions()).toEqual([setLanguage('de-DE'), appMounted()])
    expect(navigateToError).not.toHaveBeenCalled()
  })

  it('should show error screen in case of failed i18n init', async () => {
    jest.mocked(waitUntilSagasFinishLoading).mockRejectedValueOnce('some error')
    renderAppInitGate()

    await waitFor(() => expect(waitUntilSagasFinishLoading).toHaveBeenCalledTimes(1))
    expect(navigateToError).toHaveBeenCalledWith('appInitFailed', 'some error')
  })
})

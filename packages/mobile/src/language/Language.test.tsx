import { fireEvent, render } from '@testing-library/react-native'
import { localesList } from 'locales'
import * as React from 'react'
import 'react-native'
import deviceInfoModule from 'react-native-device-info'
import { Provider } from 'react-redux'
import useChangeLanguage from 'src/i18n/useChangeLanguage'
import Language from 'src/language/Language'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mocked } from 'ts-jest/utils'

jest.mock('src/i18n/useChangeLanguage')

jest.mock('react-native-device-info')

const mockedUseChangeLanguage = mocked(useChangeLanguage)
const mockedDeviceInfoModule = mocked(deviceInfoModule)

describe('Language', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly and sets the right language', () => {
    const changeLanguageSpy = jest.fn().mockResolvedValue(true)
    mockedUseChangeLanguage.mockImplementation(() => changeLanguageSpy)

    // seedrandom('ec3789a252e2cb17')() is larger than 0.5
    mockedDeviceInfoModule.getUniqueId.mockImplementation(() => 'ec3789a252e2cb17')

    const store = createMockStore()

    const { getByText } = render(
      <Provider store={store}>
        <Language {...getMockStackScreenProps(Screens.Language)} />
      </Provider>
    )

    localesList.forEach(({ name }) => {
      expect(getByText(name)).toBeDefined()
    })

    fireEvent.press(getByText('Español'))
    jest.runOnlyPendingTimers()
    expect(changeLanguageSpy).toHaveBeenCalledWith('es-419')
    expect(navigate).toHaveBeenCalledWith(Screens.OnboardingEducationScreen)
  })

  it('navigates to welcome screen if skip onboarding education screen flag is turned on', () => {
    const changeLanguageSpy = jest.fn().mockResolvedValue(true)
    mockedUseChangeLanguage.mockImplementation(() => changeLanguageSpy)

    // seedrandom('7646fb0d146383e8')() is smaller than 0.5
    mockedDeviceInfoModule.getUniqueId.mockImplementation(() => '7646fb0d146383e8')

    const store = createMockStore()
    const { getByText } = render(
      <Provider store={store}>
        <Language {...getMockStackScreenProps(Screens.Language)} />
      </Provider>
    )

    fireEvent.press(getByText('Español'))
    jest.runOnlyPendingTimers()
    expect(changeLanguageSpy).toHaveBeenCalledWith('es-419')
    expect(navigate).toHaveBeenCalledWith(Screens.Welcome)
  })
})

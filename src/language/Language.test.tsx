import { fireEvent, render } from '@testing-library/react-native'
import { localesList } from 'locales'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import useChangeLanguage from 'src/i18n/useChangeLanguage'
import Language from 'src/language/Language'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mocked } from 'ts-jest/utils'

jest.mock('src/i18n/useChangeLanguage')

const mockedUseChangeLanguage = mocked(useChangeLanguage)

describe('Language', () => {
  it('renders correctly and sets the right language', () => {
    const changeLanguageSpy = jest.fn().mockResolvedValue(true)
    mockedUseChangeLanguage.mockImplementation(() => changeLanguageSpy)

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
})

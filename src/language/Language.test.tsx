import { fireEvent, render } from '@testing-library/react-native'
import { localesList } from 'locales'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { SettingsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import useChangeLanguage from 'src/i18n/useChangeLanguage'
import Language from 'src/language/Language'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mocked } from 'ts-jest/utils'

jest.mock('src/i18n/useChangeLanguage')
jest.mock('src/analytics/ValoraAnalytics')

const mockedUseChangeLanguage = mocked(useChangeLanguage)

describe('Language', () => {
  localesList.forEach(({ name, code }) => {
    it(`renders correctly and sets the right language when the language is ${name}`, () => {
      const changeLanguageSpy = jest.fn().mockResolvedValue(true)
      mockedUseChangeLanguage.mockImplementation(() => changeLanguageSpy)

      const store = createMockStore()
      const { getByText } = render(
        <Provider store={store}>
          <Language {...getMockStackScreenProps(Screens.Language)} />
        </Provider>
      )

      fireEvent.press(getByText(name))
      jest.runOnlyPendingTimers()
      expect(changeLanguageSpy).toHaveBeenCalledWith(code)
      expect(navigate).toHaveBeenCalledWith(Screens.Welcome)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(SettingsEvents.language_select, {
        language: code,
      })
    })
  })
})

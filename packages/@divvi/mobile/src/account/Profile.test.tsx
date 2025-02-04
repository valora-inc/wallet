import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { MockStoreEnhanced } from 'redux-mock-store'
import { saveName } from 'src/account/actions'
import Profile from 'src/account/Profile'
import { showError, showMessage } from 'src/alert/actions'
import { SettingsEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { generateRandomUsername } from 'src/nameGenerator'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

jest.mock('src/analytics/AppAnalytics')
jest.mock('src/nameGenerator')

describe('Profile', () => {
  let store: MockStoreEnhanced
  beforeEach(() => {
    jest.clearAllMocks()
    store = createMockStore({})
  })

  describe('when updating name', () => {
    const name = 'New Name'
    it('edits name', () => {
      const { getByDisplayValue, getByTestId } = render(
        <Provider store={store}>
          <Profile {...getMockStackScreenProps(Screens.Profile)} />
        </Provider>
      )

      const input = getByDisplayValue((store.getState() as RootState).account.name!)
      fireEvent.changeText(input, name)
      expect(store.getActions().length).toEqual(0)

      fireEvent.press(getByTestId('SaveButton'))
      expect(store.getActions()).toEqual([saveName(name), showMessage('nameSaved')])
      expect(AppAnalytics.track).toHaveBeenCalledWith(SettingsEvents.profile_save)
    })

    it('generate name fills in name with random name', () => {
      jest.mocked(generateRandomUsername).mockReturnValue('Random username')
      const { getByTestId } = render(
        <Provider store={store}>
          <Profile {...getMockStackScreenProps(Screens.Profile)} />
        </Provider>
      )
      fireEvent.press(getByTestId('GenerateNameButton'))
      expect(store.getActions().length).toEqual(0)

      fireEvent.press(getByTestId('SaveButton'))
      expect(store.getActions()).toEqual([saveName('Random username'), showMessage('nameSaved')])
      expect(AppAnalytics.track).toHaveBeenCalledWith(SettingsEvents.profile_generate_name)
      expect(AppAnalytics.track).toHaveBeenCalledWith(SettingsEvents.profile_save)
    })

    it('serves error banner when attempting to save empty name', () => {
      const { getByDisplayValue, getByTestId } = render(
        <Provider store={store}>
          <Profile {...getMockStackScreenProps(Screens.Profile)} />
        </Provider>
      )

      const input = getByDisplayValue((store.getState() as RootState).account.name!)
      fireEvent.changeText(input, '')

      fireEvent.press(getByTestId('SaveButton'))

      expect(store.getActions()).toEqual([showError(ErrorMessages.MISSING_FULL_NAME)])
      expect(AppAnalytics.track).not.toHaveBeenCalledWith(SettingsEvents.profile_save)
    })
  })
})

import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { MockStoreEnhanced } from 'redux-mock-store'
import { saveNameAndPicture } from 'src/account/actions'
import Profile from 'src/account/Profile'
import { showError, showMessage } from 'src/alert/actions'
import { SettingsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { generateRandomUsername } from 'src/nameGenerator'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mocked } from 'ts-jest/utils'

jest.mock('src/analytics/ValoraAnalytics')
jest.mock('src/nameGenerator')

describe('Profile', () => {
  let store: MockStoreEnhanced
  beforeEach(() => {
    jest.clearAllMocks()
    store = createMockStore({})
  })

  it('renders correctly', () => {
    const { toJSON } = render(
      <Provider store={store}>
        <Profile {...getMockStackScreenProps(Screens.Profile)} />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
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
      expect(store.getActions()).toEqual([
        saveNameAndPicture(name, null),
        showMessage('namePictureSaved'),
      ])
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(SettingsEvents.profile_save)
    })

    it('generate name fills in name with random name', () => {
      mocked(generateRandomUsername).mockReturnValue('Random username')
      const { getByTestId } = render(
        <Provider store={store}>
          <Profile {...getMockStackScreenProps(Screens.Profile)} />
        </Provider>
      )
      fireEvent.press(getByTestId('GenerateNameButton'))
      expect(store.getActions().length).toEqual(0)

      fireEvent.press(getByTestId('SaveButton'))
      expect(store.getActions()).toEqual([
        saveNameAndPicture('Random username', null),
        showMessage('namePictureSaved'),
      ])
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(SettingsEvents.profile_generate_name)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(SettingsEvents.profile_save)
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
      expect(ValoraAnalytics.track).not.toHaveBeenCalledWith(SettingsEvents.profile_save)
    })
  })
})

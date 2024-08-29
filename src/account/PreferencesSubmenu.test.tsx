import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import PreferencesSubmenu from 'src/account/PreferencesSubmenu'
import { Screens } from 'src/navigator/Screens'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { navigate } from 'src/navigator/NavigationService'
import { hapticFeedbackSet } from 'src/app/actions'

describe('PreferencesSubmenu', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows the expected menu items', () => {
    const store = createMockStore()
    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={PreferencesSubmenu}></MockedNavigator>
      </Provider>
    )
    expect(getByText('languageSettings')).toBeTruthy()
    expect(getByText('localCurrencySetting')).toBeTruthy()
    expect(getByText('hapticFeedback')).toBeTruthy()
  })

  it('navigates to language select', async () => {
    const store = createMockStore()
    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={PreferencesSubmenu}></MockedNavigator>
      </Provider>
    )
    fireEvent.press(getByText('languageSettings'))
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith(Screens.Language, { nextScreen: 'MockedScreen' })
    )
  })

  it('navigates to currency select', async () => {
    const store = createMockStore()
    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={PreferencesSubmenu}></MockedNavigator>
      </Provider>
    )
    fireEvent.press(getByText('localCurrencySetting'))
    await waitFor(() => expect(navigate).toHaveBeenCalledWith(Screens.SelectLocalCurrency))
  })

  it('toggles haptic feedback', async () => {
    const store = createMockStore({})
    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={PreferencesSubmenu}></MockedNavigator>
      </Provider>
    )

    store.clearActions()
    fireEvent(getByText('hapticFeedback'), 'valueChange', true)

    expect(store.getActions()).toEqual([hapticFeedbackSet(true)])
  })
})

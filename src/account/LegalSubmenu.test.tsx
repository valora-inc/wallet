import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import LegalSubmenu from 'src/account/LegalSubmenu'
import { Screens } from 'src/navigator/Screens'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { SettingsEvents } from 'src/analytics/Events'
import { navigateToURI } from 'src/utils/linking'
import { navigate } from 'src/navigator/NavigationService'
import { PRIVACY_LINK, TOS_LINK } from 'src/config'

jest.mock('src/utils/linking')

describe('LegalSubmenu', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows the expected menu items', () => {
    const store = createMockStore()
    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={LegalSubmenu}></MockedNavigator>
      </Provider>
    )
    expect(getByText('licenses')).toBeTruthy()
    expect(getByText('termsOfServiceLink')).toBeTruthy()
    expect(getByText('privacyPolicy')).toBeTruthy()
  })

  it('navigates to licenses', () => {
    const store = createMockStore()
    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={LegalSubmenu}></MockedNavigator>
      </Provider>
    )
    fireEvent.press(getByText('licenses'))
    expect(navigate).toHaveBeenCalledWith(Screens.Licenses)
    expect(AppAnalytics.track).toHaveBeenCalledWith(SettingsEvents.licenses_view)
  })

  it('navigates to terms', () => {
    const store = createMockStore()
    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={LegalSubmenu}></MockedNavigator>
      </Provider>
    )
    fireEvent.press(getByText('termsOfServiceLink'))
    expect(navigateToURI).toHaveBeenCalledWith(TOS_LINK)
    expect(AppAnalytics.track).toHaveBeenCalledWith(SettingsEvents.tos_view)
  })

  it('navigates to privacy policy', () => {
    const store = createMockStore()
    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={LegalSubmenu}></MockedNavigator>
      </Provider>
    )
    fireEvent.press(getByText('privacyPolicy'))
    expect(navigateToURI).toHaveBeenCalledWith(PRIVACY_LINK)
  })
})

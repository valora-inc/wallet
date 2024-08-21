import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import LegalSubmenu from 'src/account/LegalSubmenu'
import { Screens } from 'src/navigator/Screens'
import MockedNavigator from 'test/MockedNavigator'
import { FetchMock } from 'jest-fetch-mock/types'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockE164Number } from 'test/values'
import networkConfig from 'src/web3/networkConfig'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import * as Keychain from 'react-native-keychain'
const mockFetch = fetch as FetchMock
const mockedKeychain = jest.mocked(Keychain)
import Logger from 'src/utils/Logger'
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
    const { queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={LegalSubmenu}></MockedNavigator>
      </Provider>
    )
    expect(queryByTestId('LegalSubmenu/Licenses')).toBeTruthy()
    expect(queryByTestId('LegalSubmenu/Terms')).toBeTruthy()
    expect(queryByTestId('LegalSubmenu/Privacy')).toBeTruthy()
  })

  it('navigates to licenses', async () => {
    const store = createMockStore()
    const tree = render(
      <Provider store={store}>
        <MockedNavigator component={LegalSubmenu}></MockedNavigator>
      </Provider>
    )
    fireEvent.press(tree.getByText('licenses'))
    await waitFor(() => expect(navigate).toHaveBeenCalledWith(Screens.Licenses))
    expect(AppAnalytics.track).toHaveBeenCalledWith(SettingsEvents.licenses_view)
  })

  it('navigates to terms', async () => {
    const store = createMockStore()
    const tree = render(
      <Provider store={store}>
        <MockedNavigator component={LegalSubmenu}></MockedNavigator>
      </Provider>
    )
    fireEvent.press(tree.getByText('termsOfServiceLink'))
    await waitFor(() => expect(navigateToURI).toHaveBeenCalledWith(TOS_LINK))
    expect(AppAnalytics.track).toHaveBeenCalledWith(SettingsEvents.tos_view)
  })

  it('navigates to privacy policy', async () => {
    const store = createMockStore()
    const tree = render(
      <Provider store={store}>
        <MockedNavigator component={LegalSubmenu}></MockedNavigator>
      </Provider>
    )
    fireEvent.press(tree.getByText('privacyPolicy'))
    await waitFor(() => expect(navigateToURI).toHaveBeenCalledWith(PRIVACY_LINK))
  })
})

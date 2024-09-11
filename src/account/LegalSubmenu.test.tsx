import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import LegalSubmenu from 'src/account/LegalSubmenu'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { SettingsEvents } from 'src/analytics/Events'
import { PRIVACY_LINK } from 'src/config'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getDynamicConfigParams } from 'src/statsig'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import { navigateToURI } from 'src/utils/linking'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'

jest.mock('src/utils/linking')
jest.mock('src/statsig')

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
    const tosLink = 'https://example.com/tos'
    jest.mocked(getDynamicConfigParams).mockImplementation(({ configName }) => {
      if (configName === StatsigDynamicConfigs.APP_CONFIG) {
        return {
          externalLinks: {
            tos: tosLink,
          },
        }
      }
      return {} as any
    })

    const store = createMockStore()
    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={LegalSubmenu}></MockedNavigator>
      </Provider>
    )
    fireEvent.press(getByText('termsOfServiceLink'))
    expect(navigateToURI).toHaveBeenCalledWith(tosLink)
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

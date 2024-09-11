import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import LegalSubmenu from 'src/account/LegalSubmenu'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { SettingsEvents } from 'src/analytics/Events'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getDynamicConfigParams } from 'src/statsig'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import { navigateToURI } from 'src/utils/linking'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'

jest.mock('src/utils/linking')
jest.mock('src/statsig')

const mockTosLink = 'https://example.com/tos'
const mockPrivacyLink = 'https://example.com/privacy'

describe('LegalSubmenu', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(getDynamicConfigParams).mockImplementation(({ configName }) => {
      if (configName === StatsigDynamicConfigs.APP_CONFIG) {
        return {
          links: {
            tos: mockTosLink,
            privacy: mockPrivacyLink,
          },
        }
      }
      return {} as any
    })
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
    expect(navigateToURI).toHaveBeenCalledWith(mockTosLink)
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
    expect(navigateToURI).toHaveBeenCalledWith(mockPrivacyLink)
  })
})

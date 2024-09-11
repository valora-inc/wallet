import dynamicLinks from '@react-native-firebase/dynamic-links'
import { render, waitFor } from '@testing-library/react-native'
import CleverTap from 'clevertap-react-native'
import * as React from 'react'
import { Linking } from 'react-native'
import { Provider } from 'react-redux'
import NavigatorWrapper from 'src/navigator/NavigatorWrapper'
import { getDynamicConfigParams } from 'src/statsig'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import { createMockStore } from 'test/utils'

jest.mock('src/statsig')
jest.mock('src/navigator/NavigationService', () => ({
  ...(jest.requireActual('src/navigator/NavigationService') as any),
  navigatorIsReadyRef: { current: false },
  navigate: jest.fn(),
}))
jest.mock('src/sentry/Sentry', () => ({
  ...(jest.requireActual('src/sentry/Sentry') as any),
  sentryRoutingInstrumentation: { registerNavigationContainer: jest.fn() },
}))

const mockDynamicLinksOnLink = jest.fn().mockReturnValue(jest.fn())
const mockDynamicLinksGetInitialLink = jest.fn()
jest.mock('@react-native-firebase/dynamic-links', () => () => ({
  onLink: mockDynamicLinksOnLink,
  getInitialLink: mockDynamicLinksGetInitialLink,
}))
jest.mock('clevertap-react-native', () => ({
  getInitialUrl: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
}))

describe('NavigatorWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('initializes the deep links handlers', async () => {
    jest.mocked(getDynamicConfigParams).mockImplementation(({ configName }) => {
      if (configName === StatsigDynamicConfigs.APP_CONFIG) {
        return {
          minRequiredVersion: '0.0.1', // matches DeviceInfo mocks
        }
      }
      return {} as any
    })

    const { queryByText } = render(
      <Provider store={createMockStore()}>
        <NavigatorWrapper />
      </Provider>
    )

    await waitFor(() => expect(CleverTap.addListener).toHaveBeenCalled())
    expect(Linking.addEventListener).toHaveBeenCalled()
    expect(dynamicLinks().onLink).toHaveBeenCalled()
    expect(CleverTap.getInitialUrl).toHaveBeenCalled()
    expect(Linking.getInitialURL).toHaveBeenCalled()
    expect(dynamicLinks().getInitialLink).toHaveBeenCalled()
    expect(queryByText('appUpdateAvailable')).toBeFalsy()
  })

  it('shows the upgrade screen if the version is below the minimum', () => {
    jest.mocked(getDynamicConfigParams).mockImplementation(({ configName }) => {
      if (configName === StatsigDynamicConfigs.APP_CONFIG) {
        return {
          minRequiredVersion: '2.0.0', // greater than DeviceInfo mocks
        }
      }
      return {} as any
    })

    const { getByText } = render(
      <Provider store={createMockStore()}>
        <NavigatorWrapper />
      </Provider>
    )

    expect(getByText('appUpdateAvailable')).toBeTruthy()
  })
})

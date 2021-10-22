import Analytics from '@segment/analytics-react-native'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalyticsModule from 'src/analytics/ValoraAnalytics'
import { mocked } from 'ts-jest/utils'

jest.mock('@segment/analytics-react-native', () => ({
  __esModule: true,
  default: {
    setup: jest.fn().mockResolvedValue(undefined),
    identify: jest.fn().mockResolvedValue(undefined),
    track: jest.fn().mockResolvedValue(undefined),
    screen: jest.fn().mockResolvedValue(undefined),
  },
}))
jest.mock('@segment/analytics-react-native-adjust', () => ({}))
jest.mock('@segment/analytics-react-native-clevertap', () => ({}))
jest.mock('@segment/analytics-react-native-firebase', () => ({}))
jest.mock('react-native-permissions', () => ({}))
jest.mock('@sentry/react-native', () => ({ init: jest.fn() }))
jest.unmock('src/analytics/ValoraAnalytics')

Date.now = jest.fn(() => 1482363367071)

const mockedAnalytics = mocked(Analytics)

// Disable __DEV__ so analytics is enabled
// @ts-ignore
global.__DEV__ = false

describe('ValoraAnalytics', () => {
  let ValoraAnalytics: typeof ValoraAnalyticsModule

  beforeEach(() => {
    jest.clearAllMocks()
    jest.isolateModules(() => {
      ValoraAnalytics = require('src/analytics/ValoraAnalytics').default
    })
  })

  it('delays identify calls until async init has finished', async () => {
    ValoraAnalytics.identify('0xUSER', { someUserProp: 'testValue' })
    expect(mockedAnalytics.identify).not.toHaveBeenCalled()

    await ValoraAnalytics.init()
    // Now that init has finished identify should have been called
    expect(mockedAnalytics.identify).toHaveBeenCalledWith('0xUSER', { someUserProp: 'testValue' })

    // And now test that identify calls go trough directly
    mockedAnalytics.identify.mockClear()
    ValoraAnalytics.identify('0xUSER2', { someUserProp: 'testValue2' })
    expect(mockedAnalytics.identify).toHaveBeenCalledWith('0xUSER2', { someUserProp: 'testValue2' })
  })

  it('delays track calls until async init has finished', async () => {
    ValoraAnalytics.track(HomeEvents.drawer_navigation, { navigateTo: 'somewhere' })
    expect(mockedAnalytics.track).not.toHaveBeenCalled()

    await ValoraAnalytics.init()
    // Now that init has finished track should have been called
    expect(mockedAnalytics.track).toHaveBeenCalledWith('drawer_navigation', {
      navigateTo: 'somewhere',
      celoNetwork: 'alfajores',
      sessionId: '',
      timestamp: 1482363367071,
      userAddress: '',
    })

    // And now test that track calls go trough directly
    mockedAnalytics.track.mockClear()
    ValoraAnalytics.track(HomeEvents.drawer_navigation, { navigateTo: 'somewhere else' })
    expect(mockedAnalytics.track).toHaveBeenCalledWith('drawer_navigation', {
      navigateTo: 'somewhere else',
      celoNetwork: 'alfajores',
      sessionId: '',
      timestamp: 1482363367071,
      userAddress: '',
    })
  })

  it('delays screen calls until async init has finished', async () => {
    ValoraAnalytics.page('Some Page', { someProp: 'testValue' })
    expect(mockedAnalytics.screen).not.toHaveBeenCalled()

    await ValoraAnalytics.init()
    // Now that init has finished identify should have been called
    expect(mockedAnalytics.screen).toHaveBeenCalledWith('Some Page', { someProp: 'testValue' })

    // And now test that identify calls go trough directly
    mockedAnalytics.screen.mockClear()
    ValoraAnalytics.page('Some Page2', { someProp: 'testValue2' })
    expect(mockedAnalytics.screen).toHaveBeenCalledWith('Some Page2', { someProp: 'testValue2' })
  })
})

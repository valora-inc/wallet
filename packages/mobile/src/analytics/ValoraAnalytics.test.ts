import Analytics from '@segment/analytics-react-native'
import { PincodeType } from 'src/account/reducer'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalyticsModule from 'src/analytics/ValoraAnalytics'
import { store } from 'src/redux/store'
import { getMockStoreData } from 'test/utils'
import {
  mockCeloAddress,
  mockCeurAddress,
  mockCusdAddress,
  mockTestTokenAddress,
} from 'test/values'
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
jest.mock('src/redux/store', () => ({ store: { getState: jest.fn() } }))

const mockDeviceId = 'abc-def-123' // mocked in __mocks__/react-native-device-info.ts (but importing from that file causes weird errors)
const expectedSessionId = 'b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'

Date.now = jest.fn(() => 1482363367071)

const mockedAnalytics = mocked(Analytics)

const mockStore = mocked(store)
const state = getMockStoreData({
  tokens: {
    tokenBalances: {
      [mockCusdAddress]: {
        address: mockCusdAddress,
        symbol: 'cUSD',
        usdPrice: '1',
        balance: '10',
        priceFetchedAt: Date.now(),
      },
      [mockCeurAddress]: {
        address: mockCeurAddress,
        symbol: 'cEUR',
        usdPrice: '1.2',
        balance: '20',
        priceFetchedAt: Date.now(),
      },
      [mockCeloAddress]: {
        address: mockCeloAddress,
        symbol: 'CELO',
        usdPrice: '5',
        balance: '0',
        priceFetchedAt: Date.now(),
      },
      [mockTestTokenAddress]: {
        address: mockTestTokenAddress,
        symbol: 'TT',
        balance: '10',
        priceFetchedAt: Date.now(),
      },
      '0xMOO': {
        address: '0xMOO',
        symbol: 'MOO',
        usdPrice: '4',
        balance: '0',
        priceFetchedAt: Date.now(),
      },
      '0xUBE': {
        address: '0xUBE',
        symbol: 'UBE',
        usdPrice: '2',
        balance: '1',
        priceFetchedAt: Date.now(),
      },
    },
  },
  account: {
    pincodeType: PincodeType.CustomPin,
  },
})
mockStore.getState.mockImplementation(() => state)

// Disable __DEV__ so analytics is enabled
// @ts-ignore
global.__DEV__ = false

const defaultSuperProperties = {
  sAccountAddress: '0x0000000000000000000000000000000000007E57',
  sAppBuildNumber: '1',
  sAppBundleId: 'org.celo.mobile.debug',
  sAppVersion: '0.0.1',
  sCeloBalance: 0,
  sCeurBalance: 20,
  sCountryCodeAlpha2: 'US',
  sCurrentScreenId: undefined,
  sCusdBalance: 10,
  sDeviceId: mockDeviceId,
  sDeviceLanguage: 'en-US',
  sHasCompletedBackup: false,
  sHasVerifiedNumber: false,
  sLanguage: 'es-419',
  sLocalCurrencyCode: 'PHP',
  sOtherTenTokens: 'UBE:1,TT:10',
  sPhoneCountryCallingCode: '+1',
  sPhoneCountryCodeAlpha2: 'US',
  sPincodeType: 'CustomPin',
  sPrevScreenId: undefined,
  sTokenCount: 4,
  sTotalBalanceUsd: 36,
  sWalletAddress: '0x0000000000000000000000000000000000007e57',
}

const defaultProperties = {
  ...defaultSuperProperties,
  celoNetwork: 'alfajores',
  sessionId: expectedSessionId,
  timestamp: 1482363367071,
  userAddress: '0x0000000000000000000000000000000000007e57',
}

describe('ValoraAnalytics', () => {
  let ValoraAnalytics: typeof ValoraAnalyticsModule

  beforeEach(() => {
    jest.clearAllMocks()
    jest.unmock('src/analytics/ValoraAnalytics')
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
    expect(mockedAnalytics.track).toHaveBeenCalledTimes(1)
    expect(mockedAnalytics.track).toHaveBeenCalledWith(HomeEvents.drawer_navigation, {
      ...defaultProperties,
      navigateTo: 'somewhere',
    })

    // And now test that track calls go trough directly
    mockedAnalytics.track.mockClear()
    ValoraAnalytics.track(HomeEvents.drawer_navigation, { navigateTo: 'somewhere else' })
    expect(mockedAnalytics.track).toHaveBeenCalledTimes(1)
    expect(mockedAnalytics.track).toHaveBeenCalledWith(HomeEvents.drawer_navigation, {
      ...defaultProperties,
      navigateTo: 'somewhere else',
    })
  })

  it('delays screen calls until async init has finished', async () => {
    ValoraAnalytics.page('Some Page', { someProp: 'testValue' })
    expect(mockedAnalytics.screen).not.toHaveBeenCalled()

    await ValoraAnalytics.init()
    // Now that init has finished identify should have been called
    expect(mockedAnalytics.screen).toHaveBeenCalledTimes(1)
    expect(mockedAnalytics.screen).toHaveBeenCalledWith('Some Page', {
      ...defaultProperties,
      sCurrentScreenId: 'Some Page',
      someProp: 'testValue',
    })

    // And now test that page calls go trough directly
    mockedAnalytics.screen.mockClear()
    ValoraAnalytics.page('Some Page2', { someProp: 'testValue2' })
    expect(mockedAnalytics.screen).toHaveBeenCalledTimes(1)
    expect(mockedAnalytics.screen).toHaveBeenCalledWith('Some Page2', {
      ...defaultProperties,
      sCurrentScreenId: 'Some Page2',
      someProp: 'testValue2',
      sPrevScreenId: 'Some Page',
    })
  })

  it('adds super properties to all tracked events', async () => {
    await ValoraAnalytics.init()
    ValoraAnalytics.track(HomeEvents.drawer_navigation, { navigateTo: 'somewhere else' })
    expect(mockedAnalytics.track).toHaveBeenCalledTimes(1)
    expect(mockedAnalytics.track).toHaveBeenCalledWith(HomeEvents.drawer_navigation, {
      ...defaultProperties,
      navigateTo: 'somewhere else',
    })
  })

  it('adds super properties to all screen events', async () => {
    await ValoraAnalytics.init()
    ValoraAnalytics.page('ScreenA', { someProp: 'someValue' })
    expect(mockedAnalytics.screen).toHaveBeenCalledTimes(1)
    expect(mockedAnalytics.screen).toHaveBeenCalledWith('ScreenA', {
      ...defaultProperties,
      someProp: 'someValue',
      sCurrentScreenId: 'ScreenA',
    })
  })
})

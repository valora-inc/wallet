import { createClient } from '@segment/analytics-react-native'
import { PincodeType } from 'src/account/reducer'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalyticsModule from 'src/analytics/ValoraAnalytics'
import { store } from 'src/redux/store'
import { Statsig } from 'statsig-react-native'
import { getMockStoreData } from 'test/utils'
import {
  mockCeloAddress,
  mockCeurAddress,
  mockCusdAddress,
  mockTestTokenAddress,
} from 'test/values'
import { mocked } from 'ts-jest/utils'

jest.mock('@segment/analytics-react-native')
jest.mock('@segment/analytics-react-native-plugin-adjust')
jest.mock('@segment/analytics-react-native-plugin-clevertap')
jest.mock('@segment/analytics-react-native-plugin-firebase')
jest.mock('react-native-permissions', () => ({}))
jest.mock('@sentry/react-native', () => ({ init: jest.fn() }))
jest.mock('src/redux/store', () => ({ store: { getState: jest.fn() } }))
jest.mock('src/config', () => ({
  // @ts-expect-error
  ...jest.requireActual('src/config'),
  STATSIG_API_KEY: 'statsig-key',
}))
jest.mock('statsig-react-native')

const mockDeviceId = 'abc-def-123' // mocked in __mocks__/react-native-device-info.ts (but importing from that file causes weird errors)
const expectedSessionId = '205ac8350460ad427e35658006b409bbb0ee86c22c57648fe69f359c2da648'
const mockWalletAddress = '0x12AE66CDc592e10B60f9097a7b0D3C59fce29876' // deliberately using checksummed version here

Date.now = jest.fn(() => 1482363367071)

const mockCreateSegmentClient = mocked(createClient)

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
        isCoreToken: true,
      },
      [mockCeurAddress]: {
        address: mockCeurAddress,
        symbol: 'cEUR',
        usdPrice: '1.2',
        balance: '20',
        priceFetchedAt: Date.now(),
        isCoreToken: true,
      },
      [mockCeloAddress]: {
        address: mockCeloAddress,
        symbol: 'CELO',
        usdPrice: '5',
        balance: '0',
        priceFetchedAt: Date.now(),
        isCoreToken: true,
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
  web3: {
    account: mockWalletAddress,
    mtwAddress: null,
  },
  account: {
    pincodeType: PincodeType.CustomPin,
  },
  app: {
    phoneNumberVerified: true,
  },
})

// Disable __DEV__ so analytics is enabled
// @ts-ignore
global.__DEV__ = false

const defaultSuperProperties = {
  sAccountAddress: mockWalletAddress, // test for backwards compatibility (this field is NOT lower-cased)
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
  sHasVerifiedNumberCPV: true,
  sLanguage: 'es-419',
  sLocalCurrencyCode: 'PHP',
  sOtherTenTokens: 'UBE:1,TT:10',
  sPhoneCountryCallingCode: '+1',
  sPhoneCountryCodeAlpha2: 'US',
  sPincodeType: 'CustomPin',
  sPrevScreenId: undefined,
  sTokenCount: 4,
  sTotalBalanceUsd: 36,
  sWalletAddress: mockWalletAddress.toLowerCase(), // test for backwards compatibility (this field is lower-cased)
  sSuperchargingAmountInUsd: 24,
  sSuperchargingToken: 'cEUR',
}

const defaultProperties = {
  ...defaultSuperProperties,
  celoNetwork: 'alfajores',
  sessionId: expectedSessionId,
  timestamp: 1482363367071,
  userAddress: mockWalletAddress.toLowerCase(), // test for backwards compatibility (this field is lower-cased)
  statsigEnvironment: {
    tier: 'development',
  },
}

describe('ValoraAnalytics', () => {
  let ValoraAnalytics: typeof ValoraAnalyticsModule
  const mockPromiseFactory = () =>
    jest.fn().mockReturnValue({
      then: jest.fn(),
      catch: jest.fn(),
    })
  const mockSegmentClient = {
    identify: mockPromiseFactory(),
    track: mockPromiseFactory(),
    screen: mockPromiseFactory(),
    flush: mockPromiseFactory(),
    userInfo: { get: jest.fn().mockReturnValue({ anonymousId: 'anonId' }) },
    reset: jest.fn(),
    add: jest.fn(),
  }
  mockCreateSegmentClient.mockReturnValue(mockSegmentClient as any)

  beforeEach(() => {
    jest.clearAllMocks()
    jest.unmock('src/analytics/ValoraAnalytics')
    jest.isolateModules(() => {
      ValoraAnalytics = require('src/analytics/ValoraAnalytics').default
    })
    mockStore.getState.mockImplementation(() => state)
  })

  it('creates statsig client on initialization with wallet address as user id', async () => {
    mockStore.getState.mockImplementation(() =>
      getMockStoreData({
        web3: { account: '0x1234ABC', mtwAddress: '0x0000' },
        account: { startOnboardingTime: 1234 },
      })
    )
    await ValoraAnalytics.init()
    expect(Statsig.initialize).toHaveBeenCalledWith(
      'statsig-key',
      { userID: '0x1234abc', custom: { startOnboardingTime: 1234 } },
      { environment: { tier: 'development' }, overrideStableID: 'anonId', localMode: false }
    )
  })

  it('creates statsig client on initialization with null as user id if wallet address is not set', async () => {
    mockStore.getState.mockImplementation(() =>
      getMockStoreData({ web3: { account: undefined }, account: { startOnboardingTime: 1234 } })
    )
    await ValoraAnalytics.init()
    expect(Statsig.initialize).toHaveBeenCalledWith(
      'statsig-key',
      {
        userID: undefined,
        custom: {
          startOnboardingTime: 1234,
        },
      },
      {
        environment: { tier: 'development' },
        overrideStableID: 'anonId',
        localMode: false,
      }
    )
  })

  it('delays identify calls until async init has finished', async () => {
    ValoraAnalytics.identify('0xUSER', { someUserProp: 'testValue' })
    expect(mockSegmentClient.identify).not.toHaveBeenCalled()

    await ValoraAnalytics.init()
    // Now that init has finished identify should have been called
    expect(mockSegmentClient.identify).toHaveBeenCalledWith('0xUSER', { someUserProp: 'testValue' })

    // And now test that identify calls go trough directly
    mockSegmentClient.identify.mockClear()
    ValoraAnalytics.identify('0xUSER2', { someUserProp: 'testValue2' })
    expect(mockSegmentClient.identify).toHaveBeenCalledWith('0xUSER2', {
      someUserProp: 'testValue2',
    })
  })

  it('delays track calls until async init has finished', async () => {
    ValoraAnalytics.track(HomeEvents.drawer_navigation, { navigateTo: 'somewhere' })
    expect(mockSegmentClient.track).not.toHaveBeenCalled()

    await ValoraAnalytics.init()
    // Now that init has finished track should have been called
    expect(mockSegmentClient.track).toHaveBeenCalledTimes(1)
    expect(mockSegmentClient.track).toHaveBeenCalledWith(HomeEvents.drawer_navigation, {
      ...defaultProperties,
      navigateTo: 'somewhere',
    })

    // And now test that track calls go trough directly
    mockSegmentClient.track.mockClear()
    ValoraAnalytics.track(HomeEvents.drawer_navigation, { navigateTo: 'somewhere else' })
    expect(mockSegmentClient.track).toHaveBeenCalledTimes(1)
    expect(mockSegmentClient.track).toHaveBeenCalledWith(HomeEvents.drawer_navigation, {
      ...defaultProperties,
      navigateTo: 'somewhere else',
    })
  })

  it('delays screen calls until async init has finished', async () => {
    ValoraAnalytics.page('Some Page', { someProp: 'testValue' })
    expect(mockSegmentClient.screen).not.toHaveBeenCalled()

    await ValoraAnalytics.init()
    // Now that init has finished identify should have been called
    expect(mockSegmentClient.screen).toHaveBeenCalledTimes(1)
    expect(mockSegmentClient.screen).toHaveBeenCalledWith('Some Page', {
      ...defaultProperties,
      sCurrentScreenId: 'Some Page',
      someProp: 'testValue',
    })

    // And now test that page calls go trough directly
    mockSegmentClient.screen.mockClear()
    ValoraAnalytics.page('Some Page2', { someProp: 'testValue2' })
    expect(mockSegmentClient.screen).toHaveBeenCalledTimes(1)
    expect(mockSegmentClient.screen).toHaveBeenCalledWith('Some Page2', {
      ...defaultProperties,
      sCurrentScreenId: 'Some Page2',
      someProp: 'testValue2',
      sPrevScreenId: 'Some Page',
    })
  })

  it('adds super properties to all tracked events', async () => {
    await ValoraAnalytics.init()
    ValoraAnalytics.track(HomeEvents.drawer_navigation, { navigateTo: 'somewhere else' })
    expect(mockSegmentClient.track).toHaveBeenCalledTimes(1)
    expect(mockSegmentClient.track).toHaveBeenCalledWith(HomeEvents.drawer_navigation, {
      ...defaultProperties,
      navigateTo: 'somewhere else',
    })
  })

  it('adds super properties to all screen events', async () => {
    await ValoraAnalytics.init()
    ValoraAnalytics.page('ScreenA', { someProp: 'someValue' })
    expect(mockSegmentClient.screen).toHaveBeenCalledTimes(1)
    expect(mockSegmentClient.screen).toHaveBeenCalledWith('ScreenA', {
      ...defaultProperties,
      someProp: 'someValue',
      sCurrentScreenId: 'ScreenA',
    })
  })

  it('returns a different sessionId if the time is different', async () => {
    const timestamp = 1482363367070
    Date.now = jest.fn(() => timestamp)
    await ValoraAnalytics.init()
    ValoraAnalytics.page('ScreenA')
    expect(mockSegmentClient.screen).toHaveBeenCalledTimes(1)
    expect(mockSegmentClient.screen).toHaveBeenCalledWith('ScreenA', {
      ...defaultProperties,
      sCurrentScreenId: 'ScreenA',
      sessionId: '97250a67361e6d463a59b4baed530010befe1d234ef0446b6197fbe08d5471',
      timestamp,
    })
  })
})

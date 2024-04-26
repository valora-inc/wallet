import { createClient } from '@segment/analytics-react-native'
import { PincodeType } from 'src/account/reducer'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalyticsModule from 'src/analytics/ValoraAnalytics'
import { store } from 'src/redux/store'
import { getDefaultStatsigUser, getDynamicConfigParams, getFeatureGate } from 'src/statsig'
import { NetworkId } from 'src/transactions/types'
import { Statsig } from 'statsig-react-native'
import { getMockStoreData } from 'test/utils'
import {
  mockCeloAddress,
  mockCeloTokenId,
  mockCeurAddress,
  mockCeurTokenId,
  mockCusdAddress,
  mockCusdTokenId,
  mockPositions,
  mockTestTokenAddress,
  mockTestTokenTokenId,
} from 'test/values'

jest.mock('@segment/analytics-react-native')
jest.mock('@segment/analytics-react-native-plugin-adjust')
jest.mock('@segment/analytics-react-native-plugin-clevertap')
jest.mock('@segment/analytics-react-native-plugin-firebase')
jest.mock('@sentry/react-native', () => ({ init: jest.fn() }))
jest.mock('src/redux/store', () => ({ store: { getState: jest.fn() } }))
jest.mock('src/config', () => ({
  ...(jest.requireActual('src/config') as any),
  STATSIG_API_KEY: 'statsig-key',
}))
jest.mock('statsig-react-native')
jest.mock('src/statsig')
jest.mock('src/web3/networkConfig', () => {
  const originalModule = jest.requireActual('src/web3/networkConfig')
  return {
    ...originalModule,
    __esModule: true,
    default: {
      ...originalModule.default,
      defaultNetworkId: 'celo-alfajores',
    },
  }
})

const mockDeviceId = 'abc-def-123' // mocked in __mocks__/react-native-device-info.ts (but importing from that file causes weird errors)
const expectedSessionId = '205ac8350460ad427e35658006b409bbb0ee86c22c57648fe69f359c2da648'
const mockWalletAddress = '0x12AE66CDc592e10B60f9097a7b0D3C59fce29876' // deliberately using checksummed version here

const mockCreateSegmentClient = jest.mocked(createClient)

const mockStore = jest.mocked(store)
const state = getMockStoreData({
  tokens: {
    tokenBalances: {
      [mockCusdTokenId]: {
        address: mockCusdAddress,
        tokenId: mockCusdTokenId,
        networkId: NetworkId['celo-alfajores'],
        symbol: 'cUSD',
        priceUsd: '1',
        balance: '10',
        priceFetchedAt: Date.now(),
        isFeeCurrency: true,
      },
      [mockCeurTokenId]: {
        address: mockCeurAddress,
        tokenId: mockCeurTokenId,
        networkId: NetworkId['celo-alfajores'],
        symbol: 'cEUR',
        priceUsd: '1.2',
        balance: '20',
        priceFetchedAt: Date.now(),
        isFeeCurrency: true,
      },
      [mockCeloTokenId]: {
        address: mockCeloAddress,
        tokenId: mockCeloTokenId,
        networkId: NetworkId['celo-alfajores'],
        symbol: 'CELO',
        priceUsd: '5',
        balance: '0',
        priceFetchedAt: Date.now(),
        isFeeCurrency: true,
      },
      [mockTestTokenTokenId]: {
        address: mockTestTokenAddress,
        tokenId: mockTestTokenTokenId,
        networkId: NetworkId['celo-alfajores'],
        symbol: 'TT',
        balance: '10',
        priceFetchedAt: Date.now(),
      },
      'celo-alfajores:0xMOO': {
        address: '0xMOO',
        tokenId: 'celo-alfajores:0xMOO',
        networkId: NetworkId['celo-alfajores'],
        symbol: 'MOO',
        priceUsd: '4',
        balance: '0',
        priceFetchedAt: Date.now(),
      },
      'celo-alfajores:0xUBE': {
        address: '0xUBE',
        tokenId: 'celo-alfajores:0xUBE',
        networkId: NetworkId['celo-alfajores'],
        symbol: 'UBE',
        priceUsd: '2',
        balance: '1',
        priceFetchedAt: Date.now(),
      },
    },
  },
  positions: {
    positions: mockPositions,
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
  sHooksPreviewEnabled: false,
  sLanguage: 'es-419',
  sLocalCurrencyCode: 'PHP',
  sNetWorthUsd: 43.910872728527195,
  sOtherTenTokens: 'UBE:1,TT:10',
  sPhoneCountryCallingCode: '+1',
  sPhoneCountryCodeAlpha2: 'US',
  sPincodeType: 'CustomPin',
  sPositionsAppsCount: 1,
  sPositionsCount: 3,
  sPositionsTopTenApps: 'ubeswap:7.91',
  sPrevScreenId: undefined,
  sTokenCount: 4,
  sTopTenPositions: 'ubeswap-G$ / cUSD:4.08,ubeswap-MOO / CELO:2.51,ubeswap-CELO / cUSD:1.32',
  sTotalBalanceUsd: 36,
  sTotalCeloAlfajoresBalanceUsd: 36,
  sTotalPositionsBalanceUsd: 7.910872728527196,
  sWalletAddress: mockWalletAddress.toLowerCase(), // test for backwards compatibility (this field is lower-cased)
  sSuperchargingAmountInUsd: 24,
  sSuperchargingToken: 'cEUR',
  sHasTokenBalance: true,
  sHasCeloAlfajoresTokenBalance: true,
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

beforeAll(() => {
  jest.useFakeTimers({ now: 1482363367071 })
})

describe('ValoraAnalytics', () => {
  let ValoraAnalytics: typeof ValoraAnalyticsModule
  const mockSegmentClient = {
    identify: jest.fn().mockResolvedValue(undefined),
    track: jest.fn().mockResolvedValue(undefined),
    screen: jest.fn().mockResolvedValue(undefined),
    flush: jest.fn().mockResolvedValue(undefined),
    userInfo: {
      get: jest.fn().mockReturnValue({ anonymousId: 'anonId' }),
      set: jest.fn().mockReturnValue(undefined),
    },
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
    jest.mocked(getFeatureGate).mockReturnValue(true)
    jest
      .mocked(getDynamicConfigParams)
      .mockReturnValue({ showBalances: [NetworkId['celo-alfajores']] })
  })

  it('creates statsig client on initialization with default statsig user', async () => {
    jest.mocked(getDefaultStatsigUser).mockReturnValue({ userID: 'someUserId' })
    await ValoraAnalytics.init()
    expect(Statsig.initialize).toHaveBeenCalledWith(
      'statsig-key',
      { userID: 'someUserId' },
      { environment: { tier: 'development' }, overrideStableID: 'anonId', localMode: false }
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
    ValoraAnalytics.track(OnboardingEvents.pin_invalid, { error: 'some error' })
    expect(mockSegmentClient.track).not.toHaveBeenCalled()

    await ValoraAnalytics.init()
    // Now that init has finished track should have been called
    expect(mockSegmentClient.track).toHaveBeenCalledTimes(1)
    expect(mockSegmentClient.track).toHaveBeenCalledWith(OnboardingEvents.pin_invalid, {
      ...defaultProperties,
      error: 'some error',
    })

    // And now test that track calls go trough directly
    mockSegmentClient.track.mockClear()
    ValoraAnalytics.track(OnboardingEvents.pin_invalid, { error: 'some error' })
    expect(mockSegmentClient.track).toHaveBeenCalledTimes(1)
    expect(mockSegmentClient.track).toHaveBeenCalledWith(OnboardingEvents.pin_invalid, {
      ...defaultProperties,
      error: 'some error',
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
    ValoraAnalytics.track(OnboardingEvents.pin_invalid, { error: 'some error' })
    expect(mockSegmentClient.track).toHaveBeenCalledTimes(1)
    expect(mockSegmentClient.track).toHaveBeenCalledWith(OnboardingEvents.pin_invalid, {
      ...defaultProperties,
      error: 'some error',
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

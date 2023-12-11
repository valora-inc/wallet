import { PincodeType } from 'src/account/reducer'
import { getCurrentUserTraits } from 'src/analytics/selectors'
import { getFeatureGate } from 'src/statsig'
import { NetworkId } from 'src/transactions/types'
import { getMockStoreData } from 'test/utils'

jest.mock('src/statsig')

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(getFeatureGate).mockReturnValue(true)
})

describe('getCurrentUserTraits', () => {
  it('returns the current user traits', () => {
    const state = getMockStoreData({
      web3: { mtwAddress: '0x123' },
      account: { defaultCountryCode: '+33', pincodeType: PincodeType.CustomPin },
      app: {
        superchargeTokenConfigByToken: {
          '0xcusd': {
            minBalance: 10,
            maxBalance: 1000,
          },
          '0xceur': {
            minBalance: 10,
            maxBalance: 1000,
          },
        },
        phoneNumberVerified: true,
      },
      tokens: {
        tokenBalances: {
          'celo-alfajores:0xcusd': {
            name: 'Celo Dollars',
            tokenId: 'celo-alfajores:0xcusd',
            networkId: NetworkId['celo-alfajores'],
            address: '0xcusd',
            symbol: 'cUSD',
            decimals: 18,
            imageUrl: '',
            priceUsd: '1',
            balance: '10',
            priceFetchedAt: Date.now(),
            isFeeCurrency: true,
          },
          'celo-alfajores:0xceur': {
            name: 'Celo Euros',
            tokenId: 'celo-alfajores:0xceur',
            networkId: NetworkId['celo-alfajores'],
            address: '0xceur',
            symbol: 'cEUR',
            decimals: 18,
            imageUrl: '',
            priceUsd: '1.2345',
            balance: '21',
            priceFetchedAt: Date.now(),
            isFeeCurrency: true,
          },
          'celo-alfajores:native': {
            name: 'Celo',
            tokenId: 'celo-alfajores:native',
            networkId: NetworkId['celo-alfajores'],
            address: '0xcelo',
            symbol: 'CELO',
            decimals: 18,
            imageUrl: '',
            priceUsd: '5',
            balance: '0',
            isNative: true,
            priceFetchedAt: Date.now(),
            isFeeCurrency: true,
          },
          'celo-alfajores:0xa': {
            name: 'a',
            tokenId: 'celo-alfajores:0xa',
            networkId: NetworkId['celo-alfajores'],
            address: '0xa',
            symbol: 'A',
            decimals: 18,
            imageUrl: '',
            priceUsd: '5',
            balance: '1',
            priceFetchedAt: Date.now(),
          },
          'celo-alfajores:0xb': {
            name: 'b',
            tokenId: 'celo-alfajores:0xb',
            networkId: NetworkId['celo-alfajores'],
            address: '0xb',
            symbol: 'B',
            decimals: 18,
            imageUrl: '',
            priceUsd: '5',
            balance: '3',
            priceFetchedAt: Date.now(),
          },
          'celo-alfajores:0xc': {
            name: 'c',
            tokenId: 'celo-alfajores:0xc',
            networkId: NetworkId['celo-alfajores'],
            address: '0xc',
            symbol: 'C',
            decimals: 18,
            imageUrl: '',
            priceUsd: '5',
            balance: '2',
            priceFetchedAt: Date.now(),
          },
          'celo-alfajores:0xd': {
            name: 'd',
            tokenId: 'celo-alfajores:0xd',
            networkId: NetworkId['celo-alfajores'],
            address: '0xd',
            symbol: 'D',
            decimals: 18,
            imageUrl: '',
            priceUsd: '5',
            balance: '0.01',
            priceFetchedAt: Date.now(),
          },
          'celo-alfajores:0xe': {
            name: 'e',
            tokenId: 'celo-alfajores:0xe',
            networkId: NetworkId['celo-alfajores'],
            address: '0xe',
            symbol: 'E',
            decimals: 18,
            imageUrl: '',
            priceUsd: '5',
            balance: '7',
            priceFetchedAt: Date.now(),
          },
          'celo-alfajores:0xf': {
            name: 'f',
            tokenId: 'celo-alfajores:0xf',
            networkId: NetworkId['celo-alfajores'],
            address: '0xf',
            symbol: 'F',
            decimals: 18,
            imageUrl: '',
            priceUsd: '5',
            balance: '6',
            priceFetchedAt: Date.now(),
          },
          'celo-alfajores:0xg': {
            name: 'g',
            tokenId: 'celo-alfajores:0xg',
            networkId: NetworkId['celo-alfajores'],
            address: '0xg',
            symbol: 'G',
            decimals: 18,
            imageUrl: '',
            priceUsd: '5',
            balance: '10',
            priceFetchedAt: Date.now(),
          },
          'celo-alfajores:0xh': {
            name: 'h',
            tokenId: 'celo-alfajores:0xh',
            networkId: NetworkId['celo-alfajores'],
            address: '0xh',
            symbol: 'H',
            decimals: 18,
            imageUrl: '',
            priceUsd: '5',
            balance: '9.123456789',
            priceFetchedAt: Date.now(),
          },
          'celo-alfajores:0xi': {
            name: 'i',
            tokenId: 'celo-alfajores:0xi',
            networkId: NetworkId['celo-alfajores'],
            address: '0xi',
            symbol: 'I',
            decimals: 18,
            imageUrl: '',
            priceUsd: '5',
            balance: '1000',
            priceFetchedAt: Date.now(),
          },
          'celo-alfajores:0xj': {
            name: 'j',
            tokenId: 'celo-alfajores:0xj',
            networkId: NetworkId['celo-alfajores'],
            address: '0xj',
            symbol: '', // Empty on purpose, will end up using the address
            decimals: 18,
            imageUrl: '',
            priceUsd: '5',
            balance: '11.003',
            priceFetchedAt: Date.now(),
          },
          'celo-alfajores:0xk': {
            name: 'k',
            tokenId: 'celo-alfajores:0xk',
            networkId: NetworkId['celo-alfajores'],
            address: '0xk',
            symbol: 'K',
            decimals: 18,
            imageUrl: '',
            priceUsd: '5',
            balance: '80',
            priceFetchedAt: Date.now(),
          },
        },
      },
      positions: {
        positions: [
          {
            type: 'contract-position',
            network: 'celo',
            address: '0xa',
            appId: 'a',
            displayProps: {
              title: 'Title A',
            },
            balanceUsd: '10',
          },
          {
            type: 'contract-position',
            network: 'celo',
            address: '0xb',
            appId: 'b',
            displayProps: {
              title: 'Title B',
            },
            balanceUsd: '1.11',
          },
          {
            type: 'contract-position',
            network: 'celo',
            address: '0xc',
            appId: 'c',
            displayProps: {
              title: 'Title C',
            },
            balanceUsd: '2.22',
          },
          {
            type: 'contract-position',
            network: 'celo',
            address: '0xd',
            appId: 'd',
            displayProps: {
              title: 'Title D which is really long and should be truncated',
            },
            balanceUsd: '0.01234',
          },
          {
            type: 'contract-position',
            network: 'celo',
            address: '0xe',
            appId: 'b',
            displayProps: {
              title: 'Title E',
            },
            balanceUsd: '70',
          },
        ],
      },
    })
    expect(getCurrentUserTraits(state)).toStrictEqual({
      accountAddress: '0x123',
      appBuildNumber: '1',
      appBundleId: 'org.celo.mobile.debug',
      appVersion: '0.0.1',
      celoBalance: 0,
      ceurBalance: 21,
      countryCodeAlpha2: 'US',
      cusdBalance: 10,
      deviceId: 'abc-def-123',
      deviceLanguage: 'en-US',
      hasCompletedBackup: false,
      hasVerifiedNumber: false,
      hasVerifiedNumberCPV: true,
      hooksPreviewEnabled: false,
      language: 'es-419',
      localCurrencyCode: 'PHP',
      netWorthUsd: 5764.949123945,
      otherTenTokens: 'I:1000,K:80,0xj:11.003,G:10,H:9.12345,E:7,F:6,B:3,C:2,A:1',
      phoneCountryCallingCode: '+33',
      phoneCountryCodeAlpha2: 'FR',
      pincodeType: 'CustomPin',
      positionsAppsCount: 4,
      positionsCount: 5,
      positionsTopTenApps: 'b:71.11,a:10.00,c:2.22,d:0.01',
      tokenCount: 13,
      topTenPositions:
        'b-Title E:70.00,a-Title A:10.00,c-Title C:2.22,b-Title B:1.11,d-Title D which is rea:0.01',
      totalBalanceUsd: 5681.606783945,
      totalPositionsBalanceUsd: 83.34234,
      walletAddress: '0x0000000000000000000000000000000000007e57',
      superchargingToken: 'cEUR',
      superchargingAmountInUsd: 25.9245,
    })
  })
  it('uses wallet address as fallback for accountAddress if MTW is null', () => {
    const state = getMockStoreData({
      web3: { mtwAddress: null },
    })
    expect(getCurrentUserTraits(state).accountAddress).toEqual(
      '0x0000000000000000000000000000000000007E57' // intentionally using non-lower-cased version here (important for backwards compatibility)
    )
  })
})

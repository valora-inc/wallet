import { render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import FiatExchangeCurrencyBottomSheet from 'src/fiatExchanges/FiatExchangeCurrencyBottomSheet'
import { FiatExchangeFlow } from 'src/fiatExchanges/utils'
import { getDynamicConfigParams } from 'src/statsig'
import { NetworkId } from 'src/transactions/types'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import {
  mockCeloAddress,
  mockCeloTokenId,
  mockCeurAddress,
  mockCeurTokenId,
  mockCrealAddress,
  mockCrealTokenId,
  mockCusdAddress,
  mockCusdTokenId,
  mockEthTokenId,
} from 'test/values'

const mockDate = 1588200517518

const MOCK_STORE_DATA = {
  tokens: {
    tokenBalances: {
      [mockCusdTokenId]: {
        tokenId: mockCusdTokenId,
        networkId: NetworkId['celo-alfajores'],
        name: 'cUSD',
        address: mockCusdAddress,
        balance: '0',
        priceUsd: '1',
        symbol: 'cUSD',
        priceFetchedAt: mockDate,
        isSwappable: true,
        showZeroBalance: true,
        isCashInEligible: true,
        isCashOutEligible: true,
      },
      [mockCeurTokenId]: {
        tokenId: mockCeurTokenId,
        networkId: NetworkId['celo-alfajores'],
        name: 'cEUR',
        address: mockCeurAddress,
        balance: '50',
        priceUsd: '0.5',
        symbol: 'cEUR',
        isSupercharged: true,
        priceFetchedAt: mockDate,
        showZeroBalance: true,
        isCashInEligible: true,
        isCashOutEligible: true,
      },
      [mockCeloTokenId]: {
        tokenId: mockCeloTokenId,
        networkId: NetworkId['celo-alfajores'],
        name: 'Celo',
        address: mockCeloAddress,
        balance: '100',
        priceUsd: '0.2',
        symbol: 'CELO',
        isSupercharged: true,
        priceFetchedAt: mockDate,
        showZeroBalance: true,
        isCashInEligible: true,
        isCashOutEligible: true,
      },
      [mockCrealTokenId]: {
        tokenId: mockCrealTokenId,
        networkId: NetworkId['celo-alfajores'],
        name: 'cREAL',
        address: mockCrealAddress,
        balance: '20',
        priceUsd: '0.75',
        symbol: 'cREAL',
        isSupercharged: true,
        priceFetchedAt: mockDate,
        showZeroBalance: true,
        isCashInEligible: true,
      },
      [mockEthTokenId]: {
        tokenId: mockEthTokenId,
        networkId: NetworkId['ethereum-sepolia'],
        name: 'Ether',
        balance: '1',
        priceUsd: '0.1000',
        symbol: 'ETH',
        isSupercharged: true,
        priceFetchedAt: mockDate,
        showZeroBalance: true,
        isCashInEligible: true,
      },
    },
  },
}

jest.mock('src/web3/networkConfig', () => {
  const originalModule = jest.requireActual('src/web3/networkConfig')
  return {
    ...originalModule,
    __esModule: true,
    default: {
      ...originalModule.default,
      defaultNetworkId: 'celo-alfajores',
      spendTokenIds: [
        'celo-alfajores:0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1'.toLowerCase(),
        'celo-alfajores:0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F'.toLowerCase(),
      ],
    },
  }
})

jest.mock('src/statsig', () => ({
  getDynamicConfigParams: jest.fn(),
  getFeatureGate: jest.fn().mockReturnValue(true),
}))

describe(FiatExchangeCurrencyBottomSheet, () => {
  const mockStore = createMockStore(MOCK_STORE_DATA)
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('shows the correct tokens for cash in (multichain disabled, no ETH)', () => {
    jest.mocked(getDynamicConfigParams).mockReturnValue({ showCico: ['celo-alfajores'] })
    const { queryByTestId } = render(
      <Provider store={mockStore}>
        <MockedNavigator
          component={FiatExchangeCurrencyBottomSheet}
          params={{
            flow: FiatExchangeFlow.CashIn,
          }}
        />
      </Provider>
    )
    expect(queryByTestId('cUSDSymbol')).toBeTruthy()
    expect(queryByTestId('cEURSymbol')).toBeTruthy()
    expect(queryByTestId('cREALSymbol')).toBeTruthy()
    expect(queryByTestId('CELOSymbol')).toBeTruthy()
    expect(queryByTestId('ETHSymbol')).toBeFalsy()
  })
  it('shows the correct tokens for cash in (multichain)', () => {
    jest
      .mocked(getDynamicConfigParams)
      .mockReturnValue({ showCico: ['celo-alfajores', 'ethereum-sepolia'] })
    const { queryByTestId } = render(
      <Provider store={mockStore}>
        <MockedNavigator
          component={FiatExchangeCurrencyBottomSheet}
          params={{
            flow: FiatExchangeFlow.CashIn,
          }}
        />
      </Provider>
    )
    expect(queryByTestId('cUSDSymbol')).toBeTruthy()
    expect(queryByTestId('cEURSymbol')).toBeTruthy()
    expect(queryByTestId('cREALSymbol')).toBeTruthy()
    expect(queryByTestId('CELOSymbol')).toBeTruthy()
    expect(queryByTestId('ETHSymbol')).toBeTruthy()
  })
  it('shows the correct tokens for cash out', () => {
    jest.mocked(getDynamicConfigParams).mockReturnValue({ showCico: ['celo-alfajores'] })
    const { queryByTestId } = render(
      <Provider store={mockStore}>
        <MockedNavigator
          component={FiatExchangeCurrencyBottomSheet}
          params={{
            flow: FiatExchangeFlow.CashOut,
          }}
        />
      </Provider>
    )
    expect(queryByTestId('cUSDSymbol')).toBeTruthy()
    expect(queryByTestId('cEURSymbol')).toBeTruthy()
    expect(queryByTestId('cREALSymbol')).toBeFalsy()
    expect(queryByTestId('CELOSymbol')).toBeTruthy()
  })
  it('shows the correct tokens for cash out (multichain)', () => {
    jest
      .mocked(getDynamicConfigParams)
      .mockReturnValue({ showCico: ['celo-alfajores', 'ethereum-sepolia'] })
    const { queryByTestId } = render(
      <Provider store={mockStore}>
        <MockedNavigator
          component={FiatExchangeCurrencyBottomSheet}
          params={{
            flow: FiatExchangeFlow.CashOut,
          }}
        />
      </Provider>
    )
    expect(queryByTestId('cUSDSymbol')).toBeTruthy()
    expect(queryByTestId('cEURSymbol')).toBeTruthy()
    expect(queryByTestId('cREALSymbol')).toBeFalsy()
    expect(queryByTestId('CELOSymbol')).toBeTruthy()
    expect(queryByTestId('ETHSymbol')).toBeFalsy()
  })
  it('shows the correct tokens for cash spend', () => {
    jest.mocked(getDynamicConfigParams).mockReturnValue({ showCico: ['celo-alfajores'] })
    const { queryByTestId } = render(
      <Provider store={mockStore}>
        <MockedNavigator
          component={FiatExchangeCurrencyBottomSheet}
          params={{
            flow: FiatExchangeFlow.Spend,
          }}
        />
      </Provider>
    )
    expect(queryByTestId('cUSDSymbol')).toBeTruthy()
    expect(queryByTestId('cEURSymbol')).toBeTruthy()
    expect(queryByTestId('cREALSymbol')).toBeFalsy()
    expect(queryByTestId('CELOSymbol')).toBeFalsy()
  })
  it('shows the correct tokens for cash spend (multichain)', () => {
    jest
      .mocked(getDynamicConfigParams)
      .mockReturnValue({ showCico: ['celo-alfajores', 'ethereum-sepolia'] })
    const { queryByTestId } = render(
      <Provider store={mockStore}>
        <MockedNavigator
          component={FiatExchangeCurrencyBottomSheet}
          params={{
            flow: FiatExchangeFlow.Spend,
          }}
        />
      </Provider>
    )
    expect(queryByTestId('cUSDSymbol')).toBeTruthy()
    expect(queryByTestId('cEURSymbol')).toBeTruthy()
    expect(queryByTestId('cREALSymbol')).toBeFalsy()
    expect(queryByTestId('CELOSymbol')).toBeFalsy()
    expect(queryByTestId('ETHSymbol')).toBeFalsy()
  })
})

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
        balance: '50',
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
        balance: '0',
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
        balance: '0',
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
        balance: '10',
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
        balance: '0',
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
    jest.mocked(getDynamicConfigParams).mockReturnValue({
      showCico: ['celo-alfajores'],
      tokenInfo: {
        [mockEthTokenId]: { cicoOrder: 1 },
        [mockCeloTokenId]: { cicoOrder: 2 },
        [mockCusdTokenId]: { cicoOrder: 3 },
        [mockCeurTokenId]: { cicoOrder: 4 },
        [mockCrealTokenId]: { cicoOrder: 5 },
      },
    })
  })
  it('shows the correct tokens for cash in (multichain disabled, no ETH)', () => {
    const { queryByTestId, getAllByTestId } = render(
      <Provider store={mockStore}>
        <MockedNavigator
          component={FiatExchangeCurrencyBottomSheet}
          params={{
            flow: FiatExchangeFlow.CashIn,
          }}
        />
      </Provider>
    )
    expect(getAllByTestId('TokenBalanceItem')[0]).toHaveTextContent('CELO')
    expect(getAllByTestId('TokenBalanceItem')[1]).toHaveTextContent('cUSD')
    expect(getAllByTestId('TokenBalanceItem')[2]).toHaveTextContent('cEUR')
    expect(getAllByTestId('TokenBalanceItem')[3]).toHaveTextContent('cREAL')
    expect(queryByTestId('ETHSymbol')).toBeFalsy()
  })
  it('shows the correct tokens for cash in (multichain)', () => {
    jest.mocked(getDynamicConfigParams).mockReturnValue({
      showCico: ['celo-alfajores', 'ethereum-sepolia'],
      tokenInfo: {
        [mockEthTokenId]: { cicoOrder: 1 },
        [mockCeloTokenId]: { cicoOrder: 2 },
        [mockCusdTokenId]: { cicoOrder: 3 },
        [mockCeurTokenId]: { cicoOrder: 4 },
        [mockCrealTokenId]: { cicoOrder: 5 },
      },
    })
    const { getAllByTestId } = render(
      <Provider store={mockStore}>
        <MockedNavigator
          component={FiatExchangeCurrencyBottomSheet}
          params={{
            flow: FiatExchangeFlow.CashIn,
          }}
        />
      </Provider>
    )
    expect(getAllByTestId('TokenBalanceItem')[0]).toHaveTextContent('ETH')
    expect(getAllByTestId('TokenBalanceItem')[1]).toHaveTextContent('CELO')
    expect(getAllByTestId('TokenBalanceItem')[2]).toHaveTextContent('cUSD')
    expect(getAllByTestId('TokenBalanceItem')[3]).toHaveTextContent('cEUR')
    expect(getAllByTestId('TokenBalanceItem')[4]).toHaveTextContent('cREAL')
  })
  it('shows the correct tokens for cash out', () => {
    const { queryByTestId, getAllByTestId } = render(
      <Provider store={mockStore}>
        <MockedNavigator
          component={FiatExchangeCurrencyBottomSheet}
          params={{
            flow: FiatExchangeFlow.CashOut,
          }}
        />
      </Provider>
    )
    expect(getAllByTestId('TokenBalanceItem')[0]).toHaveTextContent('CELO')
    expect(getAllByTestId('TokenBalanceItem')[1]).toHaveTextContent('cUSD')
    expect(getAllByTestId('TokenBalanceItem')[2]).toHaveTextContent('cEUR')
    expect(queryByTestId('cREALSymbol')).toBeFalsy()
  })
  it('shows the correct tokens for cash out (multichain)', () => {
    jest.mocked(getDynamicConfigParams).mockReturnValue({
      showCico: ['celo-alfajores', 'ethereum-sepolia'],
      tokenInfo: {
        [mockEthTokenId]: { cicoOrder: 1 },
        [mockCeloTokenId]: { cicoOrder: 2 },
        [mockCusdTokenId]: { cicoOrder: 3 },
        [mockCeurTokenId]: { cicoOrder: 4 },
        [mockCrealTokenId]: { cicoOrder: 5 },
      },
    })
    const { queryByTestId, getAllByTestId } = render(
      <Provider store={mockStore}>
        <MockedNavigator
          component={FiatExchangeCurrencyBottomSheet}
          params={{
            flow: FiatExchangeFlow.CashOut,
          }}
        />
      </Provider>
    )
    expect(getAllByTestId('TokenBalanceItem')[0]).toHaveTextContent('CELO')
    expect(getAllByTestId('TokenBalanceItem')[1]).toHaveTextContent('cUSD')
    expect(getAllByTestId('TokenBalanceItem')[2]).toHaveTextContent('cEUR')
    expect(queryByTestId('cREALSymbol')).toBeFalsy()
    expect(queryByTestId('ETHSymbol')).toBeFalsy()
  })
  it('shows the correct tokens for cash spend', () => {
    const { queryByTestId, getAllByTestId } = render(
      <Provider store={mockStore}>
        <MockedNavigator
          component={FiatExchangeCurrencyBottomSheet}
          params={{
            flow: FiatExchangeFlow.Spend,
          }}
        />
      </Provider>
    )
    expect(getAllByTestId('TokenBalanceItem')[0]).toHaveTextContent('cUSD')
    expect(getAllByTestId('TokenBalanceItem')[1]).toHaveTextContent('cEUR')
    expect(queryByTestId('CELOSymbol')).toBeFalsy()
    expect(queryByTestId('cREALSymbol')).toBeFalsy()
  })
  it('shows the correct tokens for cash spend (multichain)', () => {
    jest.mocked(getDynamicConfigParams).mockReturnValue({
      showCico: ['celo-alfajores', 'ethereum-sepolia'],
      tokenInfo: {
        [mockEthTokenId]: { cicoOrder: 1 },
        [mockCeloTokenId]: { cicoOrder: 2 },
        [mockCusdTokenId]: { cicoOrder: 3 },
        [mockCeurTokenId]: { cicoOrder: 4 },
        [mockCrealTokenId]: { cicoOrder: 5 },
      },
    })
    const { queryByTestId, getAllByTestId } = render(
      <Provider store={mockStore}>
        <MockedNavigator
          component={FiatExchangeCurrencyBottomSheet}
          params={{
            flow: FiatExchangeFlow.Spend,
          }}
        />
      </Provider>
    )
    expect(getAllByTestId('TokenBalanceItem')[0]).toHaveTextContent('cUSD')
    expect(getAllByTestId('TokenBalanceItem')[1]).toHaveTextContent('cEUR')
    expect(queryByTestId('CELOSymbol')).toBeFalsy()
    expect(queryByTestId('cREALSymbol')).toBeFalsy()
    expect(queryByTestId('ETHSymbol')).toBeFalsy()
  })
  it('shows the correct order when cicoOrder missing/same value', () => {
    jest.mocked(getDynamicConfigParams).mockReturnValue({
      showCico: ['celo-alfajores', 'ethereum-sepolia'],
      tokenInfo: { [mockCusdTokenId]: { cicoOrder: 1 }, [mockCrealTokenId]: { cicoOrder: 1 } },
    })
    const { getAllByTestId } = render(
      <Provider store={mockStore}>
        <MockedNavigator
          component={FiatExchangeCurrencyBottomSheet}
          params={{
            flow: FiatExchangeFlow.CashIn,
          }}
        />
      </Provider>
    )
    expect(getAllByTestId('TokenBalanceItem')[0]).toHaveTextContent('cUSD')
    expect(getAllByTestId('TokenBalanceItem')[1]).toHaveTextContent('cREAL')
    expect(getAllByTestId('TokenBalanceItem')[2]).toHaveTextContent('cEUR')
    expect(getAllByTestId('TokenBalanceItem')[3]).toHaveTextContent('CELO')
    expect(getAllByTestId('TokenBalanceItem')[4]).toHaveTextContent('ETH')
  })
  it('renders correctly if token list is empty', () => {
    const { queryByTestId, getByTestId } = render(
      <Provider store={createMockStore({ tokens: { tokenBalances: {} } })}>
        <MockedNavigator
          component={FiatExchangeCurrencyBottomSheet}
          params={{
            flow: FiatExchangeFlow.CashIn,
          }}
        />
      </Provider>
    )
    expect(queryByTestId('TokenBalanceItem')).toBeFalsy()
    // asserts whether tokenList.length (0) isn't rendered, which causes a
    // crash in the app
    expect(getByTestId('FiatExchangeCurrencyBottomSheet')).not.toHaveTextContent('0')
  })
})

import { fireEvent, render, within } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import FiatExchangeCurrencyBottomSheet from 'src/fiatExchanges/FiatExchangeCurrencyBottomSheet'
import { FiatExchangeFlow } from 'src/fiatExchanges/types'
import { getDynamicConfigParams, getFeatureGate, getMultichainFeatures } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import {
  StatsigDynamicConfigs,
  StatsigFeatureGates,
  StatsigMultiNetworkDynamicConfig,
} from 'src/statsig/types'
import { NetworkId } from 'src/transactions/types'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import {
  mockCeloTokenId,
  mockCeurTokenId,
  mockCrealTokenId,
  mockCusdTokenId,
  mockEthTokenId,
  mockTokenBalances,
} from 'test/values'

const MOCK_STORE_DATA = {
  tokens: {
    tokenBalances: {
      ...mockTokenBalances,
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

jest.mock('src/statsig')

describe(FiatExchangeCurrencyBottomSheet, () => {
  const mockStore = createMockStore(MOCK_STORE_DATA)
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(getFeatureGate).mockReturnValue(false)
    jest.mocked(getMultichainFeatures).mockReturnValue({
      ...DynamicConfigs[StatsigMultiNetworkDynamicConfig.MULTI_CHAIN_FEATURES].defaultValues,
      showCico: [NetworkId['celo-alfajores'], NetworkId['ethereum-sepolia']],
    })
    jest.mocked(getDynamicConfigParams).mockImplementation(({ configName, defaultValues }) => {
      switch (configName) {
        case StatsigDynamicConfigs.CICO_TOKEN_INFO:
          return {
            tokenInfo: {
              [mockEthTokenId]: { cicoOrder: 1 },
              [mockCeloTokenId]: { cicoOrder: 2 },
              [mockCusdTokenId]: { cicoOrder: 3 },
              [mockCeurTokenId]: { cicoOrder: 4 },
              [mockCrealTokenId]: { cicoOrder: 5 },
            },
          }
        case StatsigDynamicConfigs.SWAP_CONFIG:
          return {
            popularTokenIds: [mockEthTokenId, mockCeloTokenId],
          }
        default:
          return defaultValues
      }
    })
  })
  it('shows the correct tokens for cash in', () => {
    const { getAllByTestId } = render(
      <Provider store={mockStore}>
        <MockedNavigator
          component={FiatExchangeCurrencyBottomSheet}
          params={{ flow: FiatExchangeFlow.CashIn }}
        />
      </Provider>
    )
    expect(getAllByTestId('TokenBalanceItem')).toHaveLength(6)
    ;['ETH', 'CELO', 'cUSD', 'cEUR', 'cREAL', 'USDC'].forEach((token, index) => {
      expect(getAllByTestId('TokenBalanceItem')[index]).toHaveTextContent(token)
    })
  })
  it('shows the correct tokens for cash out', () => {
    const { getAllByTestId } = render(
      <Provider store={mockStore}>
        <MockedNavigator
          component={FiatExchangeCurrencyBottomSheet}
          params={{ flow: FiatExchangeFlow.CashOut }}
        />
      </Provider>
    )
    expect(getAllByTestId('TokenBalanceItem')).toHaveLength(2)
    ;['CELO', 'cUSD'].forEach((token, index) => {
      expect(getAllByTestId('TokenBalanceItem')[index]).toHaveTextContent(token)
    })
  })
  it('shows the correct tokens for cash spend', () => {
    const { getAllByTestId } = render(
      <Provider store={mockStore}>
        <MockedNavigator
          component={FiatExchangeCurrencyBottomSheet}
          params={{ flow: FiatExchangeFlow.Spend }}
        />
      </Provider>
    )
    expect(getAllByTestId('TokenBalanceItem')).toHaveLength(2)
    ;['cUSD', 'cEUR'].forEach((token, index) => {
      expect(getAllByTestId('TokenBalanceItem')[index]).toHaveTextContent(token)
    })
  })
  it('shows the correct order when cicoOrder missing/same value', () => {
    jest.mocked(getDynamicConfigParams).mockImplementation(({ configName, defaultValues }) => {
      switch (configName) {
        case StatsigDynamicConfigs.CICO_TOKEN_INFO:
          return {
            tokenInfo: {
              [mockCusdTokenId]: { cicoOrder: 1 },
              [mockCrealTokenId]: { cicoOrder: 1 },
            },
          }
        default:
          return defaultValues
      }
    })
    const { getAllByTestId } = render(
      <Provider store={mockStore}>
        <MockedNavigator
          component={FiatExchangeCurrencyBottomSheet}
          params={{ flow: FiatExchangeFlow.CashIn }}
        />
      </Provider>
    )
    expect(getAllByTestId('TokenBalanceItem')).toHaveLength(6)
    ;['cUSD', 'cREAL', 'cEUR', 'CELO', 'ETH', 'USDC'].forEach((token, index) => {
      expect(getAllByTestId('TokenBalanceItem')[index]).toHaveTextContent(token)
    })
  })

  it.each([{ flow: FiatExchangeFlow.CashOut }, { flow: FiatExchangeFlow.Spend }])(
    `does not show filters for $flow`,
    ({ flow }) => {
      const { queryByTestId } = render(
        <Provider store={mockStore}>
          <MockedNavigator component={FiatExchangeCurrencyBottomSheet} params={{ flow }} />
        </Provider>
      )
      expect(queryByTestId('FilterChipsCarousel')).toBeFalsy()
    }
  )

  it('shows filters for cash in', () => {
    const { getByTestId, getByText } = render(
      <Provider store={mockStore}>
        <MockedNavigator
          component={FiatExchangeCurrencyBottomSheet}
          params={{ flow: FiatExchangeFlow.CashIn }}
        />
      </Provider>
    )
    expect(getByTestId('FilterChipsCarousel')).toBeTruthy()
    expect(getByText('tokenBottomSheet.filters.popular')).toBeTruthy()
    expect(getByText('tokenBottomSheet.filters.stablecoins')).toBeTruthy()
    expect(getByText('tokenBottomSheet.filters.gasTokens')).toBeTruthy()
    expect(getByText('tokenBottomSheet.filters.selectNetwork')).toBeTruthy()
  })

  it('hides the popular filter for UK compliance', () => {
    jest
      .mocked(getFeatureGate)
      .mockImplementation((feature) => feature === StatsigFeatureGates.SHOW_UK_COMPLIANT_VARIANT)
    const { queryByText, getByText } = render(
      <Provider store={mockStore}>
        <MockedNavigator
          component={FiatExchangeCurrencyBottomSheet}
          params={{ flow: FiatExchangeFlow.CashIn }}
        />
      </Provider>
    )

    expect(queryByText('tokenBottomSheet.filters.popular')).toBeFalsy()
    expect(getByText('tokenBottomSheet.filters.stablecoins')).toBeTruthy()
    expect(getByText('tokenBottomSheet.filters.gasTokens')).toBeTruthy()
    expect(getByText('tokenBottomSheet.filters.selectNetwork')).toBeTruthy()
  })

  it('popular filter filters correctly', () => {
    const { getAllByTestId, getByText } = render(
      <Provider store={mockStore}>
        <MockedNavigator
          component={FiatExchangeCurrencyBottomSheet}
          params={{ flow: FiatExchangeFlow.CashIn }}
        />
      </Provider>
    )

    expect(getAllByTestId('TokenBalanceItem')).toHaveLength(6)
    fireEvent.press(getByText('tokenBottomSheet.filters.popular'))
    expect(getAllByTestId('TokenBalanceItem')).toHaveLength(2)
    ;['ETH', 'CELO'].forEach((token, index) => {
      expect(getAllByTestId('TokenBalanceItem')[index]).toHaveTextContent(token)
    })
  })

  it('stablecoin filter filters correctly', () => {
    const { getAllByTestId, getByText } = render(
      <Provider store={mockStore}>
        <MockedNavigator
          component={FiatExchangeCurrencyBottomSheet}
          params={{ flow: FiatExchangeFlow.CashIn }}
        />
      </Provider>
    )

    expect(getAllByTestId('TokenBalanceItem')).toHaveLength(6)
    fireEvent.press(getByText('tokenBottomSheet.filters.stablecoins'))
    expect(getAllByTestId('TokenBalanceItem')).toHaveLength(4)
    ;['cUSD', 'cEUR', 'cREAL', 'USDC'].forEach((token, index) => {
      expect(getAllByTestId('TokenBalanceItem')[index]).toHaveTextContent(token)
    })
  })

  it('gas tokens filter filters correctly', () => {
    const { getAllByTestId, getByText } = render(
      <Provider store={mockStore}>
        <MockedNavigator
          component={FiatExchangeCurrencyBottomSheet}
          params={{ flow: FiatExchangeFlow.CashIn }}
        />
      </Provider>
    )

    expect(getAllByTestId('TokenBalanceItem')).toHaveLength(6)
    fireEvent.press(getByText('tokenBottomSheet.filters.gasTokens'))
    expect(getAllByTestId('TokenBalanceItem')).toHaveLength(5)
    ;['ETH', 'CELO', 'cUSD', 'cEUR', 'cREAL'].forEach((token, index) => {
      expect(getAllByTestId('TokenBalanceItem')[index]).toHaveTextContent(token)
    })
  })

  it('network filter filters correctly', () => {
    const { getAllByTestId, getByText } = render(
      <Provider store={mockStore}>
        <MockedNavigator
          component={FiatExchangeCurrencyBottomSheet}
          params={{ flow: FiatExchangeFlow.CashIn }}
        />
      </Provider>
    )

    const networkMultiSelect = getAllByTestId('MultiSelectBottomSheet')[0]

    expect(getAllByTestId('TokenBalanceItem')).toHaveLength(6)
    fireEvent.press(getByText('tokenBottomSheet.filters.selectNetwork'))

    // select celo filter
    fireEvent.press(within(networkMultiSelect).getByTestId('Celo Alfajores-icon'))
    expect(getAllByTestId('TokenBalanceItem')).toHaveLength(4)
    ;['CELO', 'cUSD', 'cEUR', 'cREAL'].forEach((token, index) => {
      expect(getAllByTestId('TokenBalanceItem')[index]).toHaveTextContent(token)
    })

    // select eth filter
    fireEvent.press(within(networkMultiSelect).getByTestId('Ethereum Sepolia-icon'))
    expect(getAllByTestId('TokenBalanceItem')).toHaveLength(2)
    ;['ETH', 'USDC'].forEach((token, index) => {
      expect(getAllByTestId('TokenBalanceItem')[index]).toHaveTextContent(token)
    })
  })

  it('allows a network to be pre-selected', () => {
    const { getAllByTestId } = render(
      <Provider store={mockStore}>
        <MockedNavigator
          component={FiatExchangeCurrencyBottomSheet}
          params={{ flow: FiatExchangeFlow.CashIn, networkId: 'celo-alfajores' }}
        />
      </Provider>
    )

    expect(getAllByTestId('TokenBalanceItem')).toHaveLength(4)
    ;['CELO', 'cUSD', 'cEUR', 'cREAL'].forEach((token, index) => {
      expect(getAllByTestId('TokenBalanceItem')[index]).toHaveTextContent(token)
    })

    // unselect filter, to prove that the pre-selection yielded different results
    const networkMultiSelect = getAllByTestId('MultiSelectBottomSheet')[0]
    fireEvent.press(within(networkMultiSelect).getByTestId('multiSelect.allNetworks-icon'))
    expect(getAllByTestId('TokenBalanceItem')).toHaveLength(6)
  })
})

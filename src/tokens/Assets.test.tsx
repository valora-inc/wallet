import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import AssetsScreen from 'src/tokens/Assets'
import { NetworkId } from 'src/transactions/types'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import {
  mockCeurAddress,
  mockCeurTokenId,
  mockCusdAddress,
  mockCusdTokenId,
  mockNftAllFields,
  mockNftMinimumFields,
  mockNftNullMetadata,
  mockPositions,
  mockShortcuts,
} from 'test/values'

jest.mock('src/statsig', () => {
  return {
    getFeatureGate: jest.fn(),
    getDynamicConfigParams: jest.fn(() => ({
      showBalances: ['celo-alfajores'],
    })),
  }
})

const storeWithTokenBalances = {
  tokens: {
    tokenBalances: {
      [mockCeurTokenId]: {
        tokenId: mockCeurTokenId,
        priceUsd: '1.16',
        address: mockCeurAddress,
        symbol: 'cEUR',
        imageUrl:
          'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_cEUR.png',
        name: 'Celo Euro',
        decimals: 18,
        balance: '5',
        isCoreToken: true,
        priceFetchedAt: Date.now(),
        networkId: NetworkId['celo-alfajores'],
      },
      [mockCusdTokenId]: {
        tokenId: mockCusdTokenId,
        priceUsd: '1.001',
        address: mockCusdAddress,
        symbol: 'cUSD',
        imageUrl:
          'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_cUSD.png',
        name: 'Celo Dollar',
        decimals: 18,
        balance: '10',
        isCoreToken: true,
        priceFetchedAt: Date.now(),
        networkId: NetworkId['celo-alfajores'],
      },
    },
  },
  positions: {
    positions: [],
  },
}

const storeWithPositions = {
  ...storeWithTokenBalances,
  positions: {
    positions: mockPositions, // Total value of positions is ~$7.91 or ~₱10.52
  },
}

const storeWithPositionsAndClaimableRewards = {
  ...storeWithTokenBalances,
  positions: {
    positions: mockPositions,
    shortcuts: mockShortcuts,
  },
}

const storeWithNfts = {
  ...storeWithTokenBalances,
  nfts: {
    nfts: [mockNftAllFields, mockNftMinimumFields, mockNftNullMetadata],
    nftsLoading: false,
    nftsError: null,
  },
}

describe('AssetsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders tokens and collectibles tabs when positions is disabled', () => {
    jest.mocked(getFeatureGate).mockReturnValue(false)
    const store = createMockStore(storeWithPositions)

    const { getByTestId, getAllByTestId, queryAllByTestId, getByText, queryByText, queryByTestId } =
      render(
        <Provider store={store}>
          <MockedNavigator component={AssetsScreen} />
        </Provider>
      )

    expect(getByTestId('AssetsTokenBalance')).toBeTruthy()
    expect(queryByTestId('AssetsTokenBalance/Info')).toBeFalsy()
    expect(getByTestId('AssetsTokenBalance')).toHaveTextContent('₱21.03')

    expect(getByTestId('Assets/TabBar')).toBeTruthy()
    expect(getAllByTestId('Assets/TabBarItem')).toHaveLength(2)
    expect(getByText('assets.tabBar.tokens')).toBeTruthy()
    expect(getByText('assets.tabBar.collectibles')).toBeTruthy()
    expect(queryByText('assets.tabBar.dappPositions')).toBeFalsy()

    expect(getAllByTestId('TokenBalanceItem')).toHaveLength(2)
    expect(queryAllByTestId('PositionItem')).toHaveLength(0)
  })

  it('renders tokens, collectibles and dapp positions tabs when positions is enabled', () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
    const store = createMockStore(storeWithPositions)

    const { getByTestId, getAllByTestId, queryAllByTestId, getByText, queryByText } = render(
      <Provider store={store}>
        <MockedNavigator component={AssetsScreen} />
      </Provider>
    )

    expect(getByTestId('AssetsTokenBalance')).toBeTruthy()
    expect(getByTestId('AssetsTokenBalance/Info')).toBeTruthy()
    expect(getByTestId('AssetsTokenBalance')).toHaveTextContent('₱31.55')

    expect(getByTestId('Assets/TabBar')).toBeTruthy()
    expect(getAllByTestId('Assets/TabBarItem')).toHaveLength(3)
    expect(getByText('assets.tabBar.tokens')).toBeTruthy()
    expect(getByText('assets.tabBar.collectibles')).toBeTruthy()
    expect(queryByText('assets.tabBar.dappPositions')).toBeTruthy()

    expect(getAllByTestId('TokenBalanceItem')).toHaveLength(2)
    expect(queryAllByTestId('PositionItem')).toHaveLength(0)
  })

  it('hides dapp positions if feature gate is enabled but there are no positions', () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
    const store = createMockStore(storeWithTokenBalances)

    const { getByTestId, getAllByTestId, queryAllByTestId, getByText, queryByTestId, queryByText } =
      render(
        <Provider store={store}>
          <MockedNavigator component={AssetsScreen} />
        </Provider>
      )

    expect(getByTestId('AssetsTokenBalance')).toBeTruthy()
    expect(queryByTestId('AssetsTokenBalance/Info')).toBeFalsy()
    expect(getByTestId('AssetsTokenBalance')).toHaveTextContent('₱21.03')

    expect(getByTestId('Assets/TabBar')).toBeTruthy()
    expect(getAllByTestId('Assets/TabBarItem')).toHaveLength(2)
    expect(getByText('assets.tabBar.tokens')).toBeTruthy()
    expect(getByText('assets.tabBar.collectibles')).toBeTruthy()
    expect(queryByText('assets.tabBar.dappPositions')).toBeFalsy()

    expect(getAllByTestId('TokenBalanceItem')).toHaveLength(2)
    expect(queryAllByTestId('PositionItem')).toHaveLength(0)
  })

  it('renders collectibles on selecting the collectibles tab', () => {
    const store = createMockStore(storeWithNfts)

    const { getAllByTestId, queryAllByTestId, getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={AssetsScreen} />
      </Provider>
    )

    expect(getAllByTestId('TokenBalanceItem')).toHaveLength(2)
    expect(queryAllByTestId('PositionItem')).toHaveLength(0)
    expect(queryAllByTestId('NftItem')).toHaveLength(0)

    fireEvent.press(getByText('assets.tabBar.collectibles'))

    expect(queryAllByTestId('TokenBalanceItem')).toHaveLength(0)
    expect(queryAllByTestId('PositionItem')).toHaveLength(0)
    expect(queryAllByTestId('NftItem')).toHaveLength(2)
  })

  it('renders collectibles error', () => {
    const store = createMockStore({
      nfts: {
        nftsLoading: false,
        nfts: [],
        nftsError: 'Error fetching nfts',
      },
    })

    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={AssetsScreen} />
      </Provider>
    )

    fireEvent.press(getByText('assets.tabBar.collectibles'))
    expect(getByTestId('Assets/NftsLoadError')).toBeTruthy()
  })

  it('renders no collectables text', () => {
    const store = createMockStore({
      nfts: {
        nftsLoading: false,
        nfts: [],
        nftsError: null,
      },
    })

    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={AssetsScreen} />
      </Provider>
    )

    fireEvent.press(getByText('assets.tabBar.collectibles'))
    expect(getByText('nftGallery.noNfts')).toBeTruthy()
  })

  it('renders dapp positions on selecting the tab', () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
    const store = createMockStore(storeWithPositions)

    const { getAllByTestId, queryAllByTestId, getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={AssetsScreen} />
      </Provider>
    )

    expect(getAllByTestId('TokenBalanceItem')).toHaveLength(2)
    expect(queryAllByTestId('PositionItem')).toHaveLength(0)

    fireEvent.press(getByText('assets.tabBar.dappPositions'))

    expect(getAllByTestId('PositionItem')).toHaveLength(3)
    expect(queryAllByTestId('TokenBalanceItem')).toHaveLength(0)

    fireEvent.press(getByText('assets.tabBar.tokens'))

    expect(getAllByTestId('TokenBalanceItem')).toHaveLength(2)
    expect(queryAllByTestId('PositionItem')).toHaveLength(0)
  })

  it('clicking a token navigates to the token details screen and fires analytics event', () => {
    jest.mocked(getFeatureGate).mockReturnValue(false)
    const store = createMockStore(storeWithPositions)

    const { getAllByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={AssetsScreen} />
      </Provider>
    )

    expect(getAllByTestId('TokenBalanceItem')).toHaveLength(2)

    fireEvent.press(getAllByTestId('TokenBalanceItem')[0])
    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(Screens.TokenDetails, { tokenId: mockCusdTokenId })
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
  })

  it('hides claim rewards if feature gate is false', () => {
    jest
      .mocked(getFeatureGate)
      .mockImplementation((gate) => gate === StatsigFeatureGates.SHOW_POSITIONS)
    const store = createMockStore(storeWithPositionsAndClaimableRewards)

    const { queryByText } = render(
      <Provider store={store}>
        <MockedNavigator component={AssetsScreen} />
      </Provider>
    )

    expect(queryByText('assets.claimRewards')).toBeFalsy()
  })

  it('hides claim rewards if feature gate is true and positions do not include claimable rewards', () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
    const store = createMockStore(storeWithPositions)

    const { queryByText } = render(
      <Provider store={store}>
        <MockedNavigator component={AssetsScreen} />
      </Provider>
    )

    expect(queryByText('assets.claimRewards')).toBeFalsy()
  })

  it('shows claim rewards if feature gate is true and positions include claimable rewards', () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
    const store = createMockStore(storeWithPositionsAndClaimableRewards)

    const { getByText, queryByText } = render(
      <Provider store={store}>
        <MockedNavigator component={AssetsScreen} />
      </Provider>
    )

    expect(getByText('assets.claimRewards')).toBeTruthy()
    fireEvent.press(getByText('assets.tabBar.dappPositions'))
    expect(getByText('assets.claimRewards')).toBeTruthy()
    fireEvent.press(getByText('assets.tabBar.collectibles'))
    expect(queryByText('assets.claimRewards')).toBeFalsy()
    fireEvent.press(getByText('assets.tabBar.tokens'))
    expect(getByText('assets.claimRewards')).toBeTruthy()
  })

  it('clicking claim rewards navigates to rewards screen', () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
    const store = createMockStore(storeWithPositionsAndClaimableRewards)

    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={AssetsScreen} />
      </Provider>
    )

    fireEvent.press(getByText('assets.claimRewards'))
    expect(navigate).toHaveBeenCalledWith(Screens.DappShortcutsRewards)
  })
})

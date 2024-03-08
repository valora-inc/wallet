import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { fetchNfts } from 'src/nfts/slice'
import { getFeatureGate } from 'src/statsig'
import AssetList from 'src/tokens/AssetList'
import { AssetTabType } from 'src/tokens/types'
import { NetworkId } from 'src/transactions/types'
import { createMockStore } from 'test/utils'
import {
  mockEthTokenId,
  mockNftAllFields,
  mockNftMinimumFields,
  mockNftNullMetadata,
  mockPoofTokenId,
  mockPositions,
  mockTokenBalances,
} from 'test/values'

jest.mock('src/statsig', () => {
  return {
    getFeatureGate: jest.fn(),
    getDynamicConfigParams: jest.fn(() => ({
      showBalances: ['celo-alfajores', 'ethereum-sepolia'],
    })),
  }
})

const storeWithAssets = {
  tokens: {
    tokenBalances: {
      ...mockTokenBalances,
      [mockEthTokenId]: {
        tokenId: mockEthTokenId,
        balance: '0',
        priceUsd: '5',
        networkId: NetworkId['ethereum-sepolia'],
        showZeroBalance: true,
        isNative: true,
        symbol: 'ETH',
      },
      ['token1']: {
        tokenId: 'token1',
        networkId: NetworkId['celo-alfajores'],
        balance: '10',
        symbol: 'TK1',
      },
      ['token2']: {
        tokenId: 'token2',
        networkId: NetworkId['celo-alfajores'],
        balance: '0',
        symbol: 'TK2',
      },
      ['token3']: {
        tokenId: 'token3',
        networkId: NetworkId['ethereum-sepolia'],
        balance: '20',
        symbol: 'TK3',
      },
    },
  },
  positions: {
    positions: mockPositions,
  },
  nfts: {
    nfts: [
      { ...mockNftAllFields, networkId: NetworkId['celo-alfajores'] },
      { ...mockNftMinimumFields, networkId: NetworkId['ethereum-sepolia'] },
      { ...mockNftNullMetadata, networkId: NetworkId['celo-alfajores'] },
    ],
    nftsLoading: false,
    nftsError: null,
  },
}

describe('AssetList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(getFeatureGate).mockReturnValue(true)
  })

  it('renders tokens in the expected order', () => {
    const store = createMockStore(storeWithAssets)

    const { getAllByTestId, queryAllByTestId } = render(
      <Provider store={store}>
        <AssetList activeTab={AssetTabType.Tokens} listHeaderHeight={0} handleScroll={jest.fn()} />
      </Provider>
    )

    expect(getAllByTestId('TokenBalanceItem')).toHaveLength(6)
    expect(queryAllByTestId('PositionItem')).toHaveLength(0)
    expect(queryAllByTestId('NftItem')).toHaveLength(0)
    ;['POOF', 'TK3', 'TK1', 'CELO', 'ETH', 'cUSD'].map((symbol, index) => {
      expect(getAllByTestId('TokenBalanceItem')[index]).toHaveTextContent(symbol)
    })
  })

  it('renders collectibles', () => {
    const store = createMockStore(storeWithAssets)

    const { queryAllByTestId } = render(
      <Provider store={store}>
        <AssetList
          activeTab={AssetTabType.Collectibles}
          listHeaderHeight={0}
          handleScroll={jest.fn()}
        />
      </Provider>
    )

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

    const { getByTestId } = render(
      <Provider store={store}>
        <AssetList
          activeTab={AssetTabType.Collectibles}
          listHeaderHeight={0}
          handleScroll={jest.fn()}
        />
      </Provider>
    )

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
        <AssetList
          activeTab={AssetTabType.Collectibles}
          listHeaderHeight={0}
          handleScroll={jest.fn()}
        />
      </Provider>
    )

    expect(getByText('nftGallery.noNfts')).toBeTruthy()
  })

  it('renders dapp positions', () => {
    const store = createMockStore(storeWithAssets)

    const { getAllByTestId, queryAllByTestId } = render(
      <Provider store={store}>
        <AssetList
          activeTab={AssetTabType.Positions}
          listHeaderHeight={0}
          handleScroll={jest.fn()}
        />
      </Provider>
    )

    expect(getAllByTestId('PositionItem')).toHaveLength(3)
    expect(queryAllByTestId('TokenBalanceItem')).toHaveLength(0)
    expect(queryAllByTestId('NftItem')).toHaveLength(0)
  })

  it('clicking a token navigates to the token details screen and fires analytics event', () => {
    const store = createMockStore(storeWithAssets)

    const { getAllByTestId } = render(
      <Provider store={store}>
        <AssetList activeTab={AssetTabType.Tokens} listHeaderHeight={0} handleScroll={jest.fn()} />
      </Provider>
    )

    expect(getAllByTestId('TokenBalanceItem')).toHaveLength(6)

    fireEvent.press(getAllByTestId('TokenBalanceItem')[0])
    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(Screens.TokenDetails, { tokenId: mockPoofTokenId })
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
  })

  it('clicking an NFT navigates to the nfts info screen', async () => {
    const store = createMockStore(storeWithAssets)

    const { getAllByTestId } = render(
      <Provider store={store}>
        <AssetList
          activeTab={AssetTabType.Collectibles}
          listHeaderHeight={0}
          handleScroll={jest.fn()}
        />
      </Provider>
    )

    expect(getAllByTestId('NftItem')).toHaveLength(2)

    fireEvent.press(getAllByTestId('NftGallery/NftImage')[0])
    fireEvent.press(getAllByTestId('NftGallery/NftImage')[1])
    expect(navigate).toHaveBeenCalledTimes(2)
    expect(navigate).toHaveBeenCalledWith(Screens.NftsInfoCarousel, {
      nfts: [{ ...mockNftAllFields, networkId: NetworkId['celo-alfajores'] }],
      networkId: NetworkId['celo-alfajores'],
    })
    expect(navigate).toHaveBeenCalledWith(Screens.NftsInfoCarousel, {
      nfts: [{ ...mockNftMinimumFields, networkId: NetworkId['ethereum-sepolia'] }],
      networkId: NetworkId['ethereum-sepolia'],
    })
  })

  it('dispatches action to fetch nfts on load', () => {
    const store = createMockStore(storeWithAssets)

    render(
      <Provider store={store}>
        <AssetList activeTab={AssetTabType.Tokens} listHeaderHeight={0} handleScroll={jest.fn()} />
      </Provider>
    )
    expect(store.getActions()).toEqual([fetchNfts()])
  })
})

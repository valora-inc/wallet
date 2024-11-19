import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { DappExplorerEvents } from 'src/analytics/Events'
import { dappSelected, fetchDappsList } from 'src/dapps/slice'
import { DappCategory, DappSection } from 'src/dapps/types'
import TabDiscover from 'src/dappsExplorer/TabDiscover'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { NetworkId } from 'src/transactions/types'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import {
  mockAaveArbUsdcAddress,
  mockAaveArbUsdcTokenId,
  mockDappListWithCategoryNames,
  mockEarnPositions,
} from 'test/values'

jest.mock('src/analytics/AppAnalytics')
jest.mock('src/statsig', () => ({
  getExperimentParams: jest.fn(() => ({
    dappsFilterEnabled: true,
    dappsSearchEnabled: true,
  })),
  getFeatureGate: jest.fn(),
}))

const dappsList = [
  ...mockDappListWithCategoryNames,
  {
    name: 'Dapp 4',
    id: 'dapp4',
    categories: ['1'],
    categoryNames: ['Swap'],
    description: 'Some dapp thing',
    iconUrl: 'https://raw.githubusercontent.com/app-list/main/assets/dapp4.png',
    dappUrl: 'https://app.dapp4.org/',
  },
  {
    name: 'Dapp 5',
    id: 'dapp5',
    categories: ['1'],
    categoryNames: ['Swap'],
    description: 'Some dapp thing',
    iconUrl: 'https://raw.githubusercontent.com/app-list/main/assets/dapp5.png',
    dappUrl: 'https://app.dapp5.org/',
  },
  {
    name: 'Dapp 6',
    id: 'dapp6',
    categories: ['1'],
    categoryNames: ['Swap'],
    description: 'Some dapp thing',
    iconUrl: 'https://raw.githubusercontent.com/app-list/main/assets/dapp6.png',
    dappUrl: 'https://app.dapp6.org/',
  },
]

const dappsCategories: DappCategory[] = [
  {
    id: '1',
    name: 'Swap',
    backgroundColor: '#DEF8EA',
    fontColor: '#1AB775',
  },
  {
    id: '2',
    name: 'Lend, Borrow & Earn',
    backgroundColor: '#DEF8F7',
    fontColor: '#07A0AE',
  },
]

const mostPopularDappIds = ['dapp1', 'dapp2', 'dapp3', 'dapp4', 'dapp5']

const defaultExpectedDappOpenProps = {
  categories: ['1'],
  dappId: 'dapp1',
  dappName: 'Dapp 1',
  position: 1,
  section: 'favorites dapp screen',
  fromScreen: 'TabDiscover',
}

const defaultStore = createMockStore({
  dapps: { dappListApiUrl: 'http://url.com', dappsList, dappsCategories },
})

describe('TabDiscover', () => {
  beforeEach(() => {
    defaultStore.clearActions()
    jest.clearAllMocks()
    jest.mocked(getFeatureGate).mockReturnValue(false)
  })

  it('renders correctly when there are no favorite dapps', () => {
    const store = createMockStore({
      dapps: {
        dappListApiUrl: 'http://url.com',
        dappsList,
        dappsCategories,
        mostPopularDappIds,
        favoriteDappIds: [],
      },
    })
    const { queryByTestId, getByTestId, getAllByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={TabDiscover} />
      </Provider>
    )

    expect(getByTestId('DiscoverDappsCard')).toBeTruthy()

    const mostPopularSectionResults = getAllByTestId(
      'DiscoverDappsCard/MostPopularSection/DappCard'
    )

    expect(mostPopularSectionResults.length).toBe(5)
    expect(mostPopularSectionResults[0]).toHaveTextContent(dappsList[0].name)
    expect(mostPopularSectionResults[0]).toHaveTextContent(dappsList[0].description)

    expect(mostPopularSectionResults[1]).toHaveTextContent(dappsList[1].name)
    expect(mostPopularSectionResults[1]).toHaveTextContent(dappsList[1].description)

    expect(mostPopularSectionResults[2]).toHaveTextContent(dappsList[2].name)
    expect(mostPopularSectionResults[2]).toHaveTextContent(dappsList[2].description)

    expect(mostPopularSectionResults[3]).toHaveTextContent(dappsList[3].name)
    expect(mostPopularSectionResults[3]).toHaveTextContent(dappsList[3].description)

    expect(mostPopularSectionResults[4]).toHaveTextContent(dappsList[4].name)
    expect(mostPopularSectionResults[4]).toHaveTextContent(dappsList[4].description)

    expect(queryByTestId('DiscoverDappsCard/FavoritesSection/Title')).toBeFalsy()
  })

  it('renders correctly when there are <=2 favorite dapps', () => {
    const store = createMockStore({
      dapps: {
        dappListApiUrl: 'http://url.com',
        dappsList,
        dappsCategories,
        mostPopularDappIds,
        favoriteDappIds: ['dapp1', 'dapp3'],
      },
    })
    const { getByTestId, getAllByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={TabDiscover} />
      </Provider>
    )

    expect(getByTestId('DiscoverDappsCard')).toBeTruthy()

    const mostPopularSectionResults = getAllByTestId(
      'DiscoverDappsCard/MostPopularSection/DappCard'
    )

    expect(mostPopularSectionResults.length).toBe(3)
    expect(mostPopularSectionResults[0]).toHaveTextContent(dappsList[1].name)
    expect(mostPopularSectionResults[0]).toHaveTextContent(dappsList[1].description)

    expect(mostPopularSectionResults[1]).toHaveTextContent(dappsList[3].name)
    expect(mostPopularSectionResults[1]).toHaveTextContent(dappsList[3].description)

    expect(mostPopularSectionResults[2]).toHaveTextContent(dappsList[4].name)
    expect(mostPopularSectionResults[2]).toHaveTextContent(dappsList[4].description)

    const favoritesSectionResults = getAllByTestId('DiscoverDappsCard/FavoritesSection/DappCard')

    expect(favoritesSectionResults.length).toBe(2)
    expect(favoritesSectionResults[0]).toHaveTextContent(dappsList[0].name)
    expect(favoritesSectionResults[0]).toHaveTextContent(dappsList[0].description)

    expect(favoritesSectionResults[1]).toHaveTextContent(dappsList[2].name)
    expect(favoritesSectionResults[1]).toHaveTextContent(dappsList[2].description)
  })

  it('renders correctly when there are >2 favorite dapps', () => {
    const store = createMockStore({
      dapps: {
        dappListApiUrl: 'http://url.com',
        dappsList,
        dappsCategories,
        mostPopularDappIds,
        favoriteDappIds: ['dapp1', 'dapp3', 'dapp4'],
      },
    })
    const { queryByTestId, getByTestId, getAllByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={TabDiscover} />
      </Provider>
    )

    expect(getByTestId('DiscoverDappsCard')).toBeTruthy()

    expect(queryByTestId('DiscoverDappsCard/MostPopularSection/Title')).toBeFalsy()

    const favoritesSectionResults = getAllByTestId('DiscoverDappsCard/FavoritesSection/DappCard')

    expect(favoritesSectionResults.length).toBe(3)
    expect(favoritesSectionResults[0]).toHaveTextContent(dappsList[0].name)
    expect(favoritesSectionResults[0]).toHaveTextContent(dappsList[0].description)

    expect(favoritesSectionResults[1]).toHaveTextContent(dappsList[2].name)
    expect(favoritesSectionResults[1]).toHaveTextContent(dappsList[2].description)

    expect(favoritesSectionResults[2]).toHaveTextContent(dappsList[3].name)
    expect(favoritesSectionResults[2]).toHaveTextContent(dappsList[3].description)
  })

  it('renders correctly when there are >5 favorite dapps', () => {
    const store = createMockStore({
      dapps: {
        dappListApiUrl: 'http://url.com',
        dappsList,
        dappsCategories,
        mostPopularDappIds,
        favoriteDappIds: ['dapp1', 'dapp2', 'dapp3', 'dapp4', 'dapp5', 'dapp6'],
      },
    })
    const { queryByTestId, getByTestId, getAllByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={TabDiscover} />
      </Provider>
    )

    expect(getByTestId('DiscoverDappsCard')).toBeTruthy()

    expect(queryByTestId('DiscoverDappsCard/MostPopularSection/Title')).toBeFalsy()

    const favoritesSectionResults = getAllByTestId('DiscoverDappsCard/FavoritesSection/DappCard')

    expect(favoritesSectionResults.length).toBe(5)
    expect(favoritesSectionResults[0]).toHaveTextContent(dappsList[0].name)
    expect(favoritesSectionResults[0]).toHaveTextContent(dappsList[0].description)

    expect(favoritesSectionResults[1]).toHaveTextContent(dappsList[1].name)
    expect(favoritesSectionResults[1]).toHaveTextContent(dappsList[1].description)

    expect(favoritesSectionResults[2]).toHaveTextContent(dappsList[2].name)
    expect(favoritesSectionResults[2]).toHaveTextContent(dappsList[2].description)

    expect(favoritesSectionResults[3]).toHaveTextContent(dappsList[3].name)
    expect(favoritesSectionResults[3]).toHaveTextContent(dappsList[3].description)

    expect(favoritesSectionResults[4]).toHaveTextContent(dappsList[4].name)
    expect(favoritesSectionResults[4]).toHaveTextContent(dappsList[4].description)
  })

  it('fires event on favorite dapp press', () => {
    const store = createMockStore({
      dapps: {
        dappListApiUrl: 'http://url.com',
        dappsList,
        dappsCategories,
        mostPopularDappIds,
        favoriteDappIds: ['dapp1', 'dapp3'],
      },
    })
    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={TabDiscover} />
      </Provider>
    )

    fireEvent.press(getByText('Dapp 1'))

    expect(store.getActions()).toEqual(
      expect.arrayContaining([
        fetchDappsList(),
        dappSelected({ dapp: { ...dappsList[0], openedFrom: DappSection.FavoritesDappScreen } }),
      ])
    )
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      DappExplorerEvents.dapp_open,
      defaultExpectedDappOpenProps
    )
  })

  it('fires event on popular dapp press', () => {
    const store = createMockStore({
      dapps: {
        dappListApiUrl: 'http://url.com',
        dappsList,
        dappsCategories,
        mostPopularDappIds,
        favoriteDappIds: ['dapp1', 'dapp3'],
      },
    })
    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={TabDiscover} />
      </Provider>
    )

    fireEvent.press(getByText('Dapp 2'))

    expect(store.getActions()).toEqual(
      expect.arrayContaining([
        fetchDappsList(),
        dappSelected({ dapp: { ...dappsList[1], openedFrom: DappSection.MostPopular } }),
      ])
    )
    expect(AppAnalytics.track).toHaveBeenCalledWith(DappExplorerEvents.dapp_open, {
      ...defaultExpectedDappOpenProps,
      categories: ['2'],
      dappId: 'dapp2',
      dappName: 'Dapp 2',
      section: 'mostPopular',
    })
  })

  it('navigates to dapp screen on button press and fires event', () => {
    const store = createMockStore({
      dapps: {
        dappListApiUrl: 'http://url.com',
        dappsList,
        dappsCategories,
        mostPopularDappIds,
        favoriteDappIds: ['dapp1', 'dapp3'],
      },
    })
    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={TabDiscover} />
      </Provider>
    )

    fireEvent.press(getByText('dappsScreen.exploreAll'))

    expect(AppAnalytics.track).toHaveBeenCalledWith(DappExplorerEvents.dapp_explore_all)
    expect(navigate).toHaveBeenCalledWith(Screens.DappsScreen)
  })

  describe('earn', () => {
    it('does not display earn cta or active pool if feature gate is false', () => {
      const { queryByTestId } = render(
        <Provider store={defaultStore}>
          <MockedNavigator component={TabDiscover} />
        </Provider>
      )

      expect(queryByTestId('EarnCta')).toBeFalsy()
      expect(queryByTestId('EarnActivePool')).toBeFalsy()
    })

    it('displays EarnEntrypoint', () => {
      jest
        .mocked(getFeatureGate)
        .mockImplementation(
          (featureGateName) => featureGateName === StatsigFeatureGates.SHOW_POSITIONS
        )
      const store = createMockStore({
        dapps: { dappListApiUrl: 'http://url.com', dappsList, dappsCategories },
        tokens: {
          tokenBalances: {
            [mockAaveArbUsdcTokenId]: {
              networkId: NetworkId['arbitrum-sepolia'],
              address: mockAaveArbUsdcAddress,
              tokenId: mockAaveArbUsdcTokenId,
              symbol: 'aArbSepUSDC',
              priceUsd: '1',
              balance: '10',
              priceFetchedAt: Date.now(),
            },
          },
        },
        positions: {
          positions: [{ ...mockEarnPositions[0], balance: '10' }],
          earnPositionIds: ['arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216'],
        },
      })

      const { getByTestId } = render(
        <Provider store={store}>
          <MockedNavigator component={TabDiscover} />
        </Provider>
      )

      expect(getByTestId('EarnEntrypoint')).toBeTruthy()
    })
  })
})

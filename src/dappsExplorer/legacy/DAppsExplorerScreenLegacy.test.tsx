import { fireEvent, render, within } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { dappSelected, favoriteDapp, fetchDappsList, unfavoriteDapp } from 'src/dapps/slice'
import { DappCategory, DappSection, DappV1 } from 'src/dapps/types'
import DAppsExplorerScreenLegacy from 'src/dappsExplorer/legacy/DAppsExplorerScreenLegacy'
import { createMockStore } from 'test/utils'

jest.mock('src/analytics/ValoraAnalytics')

const dappsList: DappV1[] = [
  {
    name: 'Dapp 1',
    id: 'dapp1',
    categoryId: '1',
    description: 'Swap tokens!',
    iconUrl: 'https://raw.githubusercontent.com/valora-inc/app-list/main/assets/dapp1.png',
    dappUrl: 'https://app.dapp1.org/',
    isFeatured: false,
  },
  {
    name: 'Dapp 2',
    id: 'dapp2',
    categoryId: '2',
    description: 'Lend and borrow tokens!',
    iconUrl: 'https://raw.githubusercontent.com/valora-inc/app-list/main/assets/dapp2.png',
    dappUrl: 'celo://wallet/dapp2Screen',
    isFeatured: false,
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

const defaultStore = createMockStore({
  dapps: { dappListApiUrl: 'http://url.com', dappsList, dappsCategories },
})

describe(DAppsExplorerScreenLegacy, () => {
  beforeEach(() => {
    defaultStore.clearActions()
    jest.clearAllMocks()
  })

  it('renders correctly when no featured dapp is available', () => {
    const { getByTestId, queryByTestId } = render(
      <Provider store={defaultStore}>
        <DAppsExplorerScreenLegacy />
      </Provider>
    )

    expect(defaultStore.getActions()).toEqual([fetchDappsList()])
    expect(getByTestId('Dapp/dapp1')).toBeTruthy()
    expect(getByTestId('Dapp/dapp2')).toBeTruthy()
    expect(queryByTestId('FeaturedDapp')).toBeFalsy()

    fireEvent.press(getByTestId('Dapp/dapp1'))
    fireEvent.press(getByTestId('ConfirmDappButton'))

    expect(defaultStore.getActions()).toEqual([
      fetchDappsList(),
      dappSelected({ dapp: { ...dappsList[0], openedFrom: DappSection.All } }),
    ])
  })

  it("renders correctly when there's a featured dapp available", () => {
    const featuredDapp: DappV1 = {
      name: 'SushiSwap',
      id: '3',
      categoryId: 'sushi',
      description: 'Swap some tokens!',
      iconUrl: 'https://raw.githubusercontent.com/valora-inc/app-list/main/assets/sushiswap.png',
      dappUrl: 'https://app.sushi.com/',
      isFeatured: true,
    }
    const store = createMockStore({
      dapps: {
        dappListApiUrl: 'http://url.com',
        dappsList: [...dappsList, featuredDapp],
        dappsCategories,
      },
    })
    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <DAppsExplorerScreenLegacy />
      </Provider>
    )

    expect(store.getActions()).toEqual([fetchDappsList()])
    expect(getByTestId('Dapp/dapp1')).toBeTruthy()
    expect(getByTestId('Dapp/dapp2')).toBeTruthy()
    expect(queryByTestId('FeaturedDapp')).toBeTruthy()

    fireEvent.press(getByTestId('FeaturedDapp'))
    fireEvent.press(getByTestId('ConfirmDappButton'))

    expect(store.getActions()).toEqual([
      fetchDappsList(),
      dappSelected({ dapp: { ...featuredDapp, openedFrom: DappSection.Featured } }),
    ])
  })

  it('opens the screen directly when using a deeplink', () => {
    const { getByTestId, queryByTestId } = render(
      <Provider store={defaultStore}>
        <DAppsExplorerScreenLegacy />
      </Provider>
    )

    expect(defaultStore.getActions()).toEqual([fetchDappsList()])
    expect(getByTestId('Dapp/dapp1')).toBeTruthy()
    expect(getByTestId('Dapp/dapp2')).toBeTruthy()
    expect(queryByTestId('FeaturedDapp')).toBeFalsy()

    fireEvent.press(getByTestId('Dapp/dapp2'))

    expect(defaultStore.getActions()).toEqual([
      fetchDappsList(),
      dappSelected({ dapp: { ...dappsList[1], openedFrom: DappSection.All } }),
    ])
  })

  it('displays the dapps disclaimer bottom sheet when selecting a dapp', () => {
    const { getByTestId, getByText } = render(
      <Provider store={defaultStore}>
        <DAppsExplorerScreenLegacy />
      </Provider>
    )

    fireEvent.press(getByTestId('Dapp/dapp1'))

    expect(getByText(`dappsScreenBottomSheet.title, {"dappName":"Dapp 1"}`)).toBeTruthy()
    expect(defaultStore.getActions()).toEqual([
      fetchDappsList(),
      // no dapp selected action here, so the dapp is not launched
    ])

    fireEvent.press(getByText(`dappsScreenBottomSheet.button, {"dappName":"Dapp 1"}`))
    expect(defaultStore.getActions()).toEqual([
      fetchDappsList(),
      dappSelected({ dapp: { ...dappsList[0], openedFrom: DappSection.All } }), // now the dapp is launched
    ])
  })

  it('displays the dapps disclaimer and opens dapps directly', () => {
    const store = createMockStore({
      dapps: {
        dappListApiUrl: 'http://url.com',
        dappsList,
        dappsCategories,
        dappsMinimalDisclaimerEnabled: true,
      },
    })
    const { getByTestId, getByText, queryByText } = render(
      <Provider store={store}>
        <DAppsExplorerScreenLegacy />
      </Provider>
    )

    expect(getByText('dappsDisclaimerAllDapps')).toBeTruthy()

    fireEvent.press(getByTestId('Dapp/dapp1'))

    expect(queryByText(`dappsScreenBottomSheet.title, {"dappName":"Dapp 1"}`)).toBeFalsy()
    expect(store.getActions()).toEqual([
      fetchDappsList(),
      dappSelected({ dapp: { ...dappsList[0], openedFrom: DappSection.All } }),
    ])
  })

  describe('favorite dapps', () => {
    it('renders correctly when there are no favourited dapps', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          favoriteDappIds: [],
          dappFavoritesEnabled: true,
        },
      })
      const { getByText } = render(
        <Provider store={store}>
          <DAppsExplorerScreenLegacy />
        </Provider>
      )

      expect(getByText('dappsScreen.noFavorites.title')).toBeTruthy()
      expect(getByText('dappsScreen.noFavorites.description')).toBeTruthy()
    })

    it('renders correctly when there are favourited dapps', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          favoriteDappIds: ['dapp2'],
          dappFavoritesEnabled: true,
        },
      })
      const { getByTestId, queryByText } = render(
        <Provider store={store}>
          <DAppsExplorerScreenLegacy />
        </Provider>
      )

      const favoritesSection = getByTestId('DAppsExplorerScreenLegacy/FavoriteDappsSection')
      expect(within(favoritesSection).queryByText(dappsList[0].name)).toBeFalsy()
      expect(within(favoritesSection).getByText(dappsList[1].name)).toBeTruthy()
      expect(within(favoritesSection).getByText(dappsList[1].description)).toBeTruthy()
      expect(queryByText('dappsScreen.favoritedDappToast.message')).toBeFalsy()
    })

    it('triggers the events when favoriting', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          dappFavoritesEnabled: true,
          favoriteDappIds: [],
        },
      })
      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <DAppsExplorerScreenLegacy />
        </Provider>
      )

      // don't include events dispatched on screen load
      jest.clearAllMocks()

      const allDappsSection = getByTestId('DAppsExplorerScreenLegacy/DappsList')
      fireEvent.press(within(allDappsSection).getByTestId('Dapp/Favorite/dapp2'))

      // favorited dapp confirmation toast
      expect(getByText('dappsScreen.favoritedDappToast.message')).toBeTruthy()
      expect(getByText('dappsScreen.favoritedDappToast.labelCTA')).toBeTruthy()

      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith('dapp_favorite', {
        categoryId: '2',
        dappId: 'dapp2',
        dappName: 'Dapp 2',
      })
      expect(store.getActions()).toEqual([fetchDappsList(), favoriteDapp({ dappId: 'dapp2' })])
    })

    it('triggers the events when unfavoriting', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          dappFavoritesEnabled: true,
          favoriteDappIds: ['dapp2'],
        },
      })
      const { getByTestId, getAllByTestId, queryByText } = render(
        <Provider store={store}>
          <DAppsExplorerScreenLegacy />
        </Provider>
      )

      // don't include events dispatched on screen load
      jest.clearAllMocks()

      const selectedDappCards = getAllByTestId('Dapp/dapp2')
      // should only appear once, in the favorites section
      expect(selectedDappCards).toHaveLength(1)

      const favoritesSection = getByTestId('DAppsExplorerScreenLegacy/FavoriteDappsSection')
      fireEvent.press(within(favoritesSection).getByTestId('Dapp/Favorite/dapp2'))

      expect(queryByText('dappsScreen.favoritedDappToast.message')).toBeFalsy()

      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith('dapp_unfavorite', {
        categoryId: '2',
        dappId: 'dapp2',
        dappName: 'Dapp 2',
      })
      expect(store.getActions()).toEqual([fetchDappsList(), unfavoriteDapp({ dappId: 'dapp2' })])
    })
  })
})

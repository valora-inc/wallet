import { fireEvent, render, within } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { dappSelected, fetchDappsList } from 'src/dapps/slice'
import { Dapp, DappCategory, DappSection } from 'src/dapps/types'
import DAppsExplorerScreen from 'src/dappsExplorer/DAppsExplorerScreen'
import { createMockStore } from 'test/utils'

jest.mock('src/analytics/ValoraAnalytics')

const dappsList: Dapp[] = [
  {
    name: 'Ubeswap',
    id: 'ubeswap',
    categoryId: '1',
    description: 'Swap tokens!',
    iconUrl: 'https://raw.githubusercontent.com/valora-inc/app-list/main/assets/ubeswap.png',
    dappUrl: 'https://app.ubeswap.org/',
    isFeatured: false,
  },
  {
    name: 'Moola',
    id: 'moola',
    categoryId: '2',
    description: 'Lend and borrow tokens!',
    iconUrl: 'https://raw.githubusercontent.com/valora-inc/app-list/main/assets/moola.png',
    dappUrl: 'celo://wallet/moolaScreen',
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

describe(DAppsExplorerScreen, () => {
  beforeEach(() => {
    defaultStore.clearActions()
    jest.clearAllMocks()
  })

  it('renders correctly when no featured dapp is available', () => {
    const { getByTestId, queryByTestId } = render(
      <Provider store={defaultStore}>
        <DAppsExplorerScreen />
      </Provider>
    )

    expect(defaultStore.getActions()).toEqual([fetchDappsList()])
    expect(getByTestId('Dapp/ubeswap')).toBeTruthy()
    expect(getByTestId('Dapp/moola')).toBeTruthy()
    expect(queryByTestId('FeaturedDapp')).toBeFalsy()

    fireEvent.press(getByTestId('Dapp/ubeswap'))
    fireEvent.press(getByTestId('ConfirmDappButton'))

    expect(defaultStore.getActions()).toEqual([
      fetchDappsList(),
      dappSelected({ dapp: { ...dappsList[0], openedFrom: DappSection.All } }),
    ])
  })

  it("renders correctly when there's a featured dapp available", () => {
    const featuredDapp: Dapp = {
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
        <DAppsExplorerScreen />
      </Provider>
    )

    expect(store.getActions()).toEqual([fetchDappsList()])
    expect(getByTestId('Dapp/ubeswap')).toBeTruthy()
    expect(getByTestId('Dapp/moola')).toBeTruthy()
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
        <DAppsExplorerScreen />
      </Provider>
    )

    expect(defaultStore.getActions()).toEqual([fetchDappsList()])
    expect(getByTestId('Dapp/ubeswap')).toBeTruthy()
    expect(getByTestId('Dapp/moola')).toBeTruthy()
    expect(queryByTestId('FeaturedDapp')).toBeFalsy()

    fireEvent.press(getByTestId('Dapp/moola'))

    expect(defaultStore.getActions()).toEqual([
      fetchDappsList(),
      dappSelected({ dapp: { ...dappsList[1], openedFrom: DappSection.All } }),
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
          <DAppsExplorerScreen />
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
          favoriteDappIds: ['moola'],
          dappFavoritesEnabled: true,
        },
      })
      const { getByTestId } = render(
        <Provider store={store}>
          <DAppsExplorerScreen />
        </Provider>
      )

      const favoritesSection = getByTestId('DAppExplorerScreen/FavoriteDappsSection')
      expect(within(favoritesSection).queryByText(dappsList[0].name)).toBeFalsy()
      expect(within(favoritesSection).getByText(dappsList[1].name)).toBeTruthy()
      expect(within(favoritesSection).getByText(dappsList[1].description)).toBeTruthy()
    })

    it('triggers the correct tracking when favoriting and unfavoriting', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          dappFavoritesEnabled: true,
        },
      })
      const { getByTestId } = render(
        <Provider store={store}>
          <DAppsExplorerScreen />
        </Provider>
      )

      // don't include events dispatched on screen load
      jest.clearAllMocks()

      fireEvent.press(getByTestId('Dapp/Favorite/moola'))
      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith('dapp_favorite', {
        categoryId: '2',
        dappId: 'moola',
        dappName: 'Moola',
      })

      fireEvent.press(getByTestId('Dapp/Favorite/moola'))
      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(2)
      expect(ValoraAnalytics.track).toHaveBeenNthCalledWith(2, 'dapp_unfavorite', {
        categoryId: '2',
        dappId: 'moola',
        dappName: 'Moola',
      })
    })
  })
})

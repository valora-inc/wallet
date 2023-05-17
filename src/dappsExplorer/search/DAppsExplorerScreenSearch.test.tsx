import { fireEvent, render, within } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { DappExplorerEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { dappSelected, favoriteDapp, fetchDappsList, unfavoriteDapp } from 'src/dapps/slice'
import { DappCategory, DappSection } from 'src/dapps/types'
import DAppsExplorerScreenSearch from 'src/dappsExplorer/search/DAppsExplorerScreenSearch'
import { createMockStore } from 'test/utils'
import { mockDappListWithCategoryNames } from 'test/values'

jest.mock('src/analytics/ValoraAnalytics')
jest.mock('src/statsig', () => ({
  getExperimentParams: () => ({
    dappsFilterEnabled: false,
    dappsSearchEnabled: true,
  }),
}))

const dappsList = mockDappListWithCategoryNames

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

// For advancing timers with debounce
// Can be removed with jest >= 27
jest.useFakeTimers('modern')

describe(DAppsExplorerScreenSearch, () => {
  beforeEach(() => {
    // Run all timers to ensure debounced calls don't affect next tests
    jest.runAllTimers()
    defaultStore.clearActions()
    jest.clearAllMocks()
  })

  it('renders correctly and fires the correct actions on press dapp', () => {
    const { getByText, queryByText } = render(
      <Provider store={defaultStore}>
        <DAppsExplorerScreenSearch />
      </Provider>
    )

    expect(defaultStore.getActions()).toEqual([fetchDappsList()])
    expect(queryByText('featuredDapp')).toBeFalsy()
    expect(getByText('Dapp 1')).toBeTruthy()
    expect(getByText('Dapp 2')).toBeTruthy()

    fireEvent.press(getByText('Dapp 1'))
    fireEvent.press(getByText(`dappsScreenBottomSheet.button, {"dappName":"Dapp 1"}`))

    expect(defaultStore.getActions()).toEqual([
      fetchDappsList(),
      dappSelected({ dapp: { ...dappsList[0], openedFrom: DappSection.All } }),
    ])
  })

  it('renders correctly and fires the correct actions on press deep linked dapp', () => {
    const { getByText, queryByText } = render(
      <Provider store={defaultStore}>
        <DAppsExplorerScreenSearch />
      </Provider>
    )

    expect(defaultStore.getActions()).toEqual([fetchDappsList()])
    expect(getByText('Dapp 1')).toBeTruthy()
    expect(getByText('Dapp 2')).toBeTruthy()
    expect(queryByText('featuredDapp')).toBeFalsy()

    fireEvent.press(getByText('Dapp 2'))

    expect(defaultStore.getActions()).toEqual([
      fetchDappsList(),
      dappSelected({ dapp: { ...dappsList[1], openedFrom: DappSection.All } }),
    ])
  })

  it('displays the dapps disclaimer bottom sheet when selecting a dapp', () => {
    const { getByText } = render(
      <Provider store={defaultStore}>
        <DAppsExplorerScreenSearch />
      </Provider>
    )

    fireEvent.press(getByText('Dapp 1'))

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
    const { getByText, queryByText } = render(
      <Provider store={store}>
        <DAppsExplorerScreenSearch />
      </Provider>
    )

    expect(getByText('dappsDisclaimerAllDapps')).toBeTruthy()

    fireEvent.press(getByText('Dapp 1'))

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
          <DAppsExplorerScreenSearch />
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
          <DAppsExplorerScreenSearch />
        </Provider>
      )

      const favoritesSection = getByTestId('DAppsExplorerScreenSearch/FavoriteDappsSection')
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
          favoriteDappIds: ['dapp1'],
        },
      })
      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <DAppsExplorerScreenSearch />
        </Provider>
      )

      // don't include events dispatched on screen load
      jest.clearAllMocks()

      const allDappsSection = getByTestId('DAppsExplorerScreenSearch/DappsList')
      fireEvent.press(within(allDappsSection).getByTestId('Dapp/Favorite/dapp2'))

      // favorited dapp confirmation toast
      expect(getByText('dappsScreen.favoritedDappToast.message')).toBeTruthy()
      expect(getByText('dappsScreen.favoritedDappToast.labelCTA')).toBeTruthy()

      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith('dapp_favorite', {
        categories: ['2'],
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
          <DAppsExplorerScreenSearch />
        </Provider>
      )

      // don't include events dispatched on screen load
      jest.clearAllMocks()

      const selectedDappCards = getAllByTestId('Dapp/dapp2')
      // should only appear once, in the favorites section
      expect(selectedDappCards).toHaveLength(1)

      const favoritesSection = getByTestId('DAppsExplorerScreenSearch/FavoriteDappsSection')
      fireEvent.press(within(favoritesSection).getByTestId('Dapp/Favorite/dapp2'))

      expect(queryByText('dappsScreen.favoritedDappToast.message')).toBeFalsy()

      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith('dapp_unfavorite', {
        categories: ['2'],
        dappId: 'dapp2',
        dappName: 'Dapp 2',
      })
      expect(store.getActions()).toEqual([fetchDappsList(), unfavoriteDapp({ dappId: 'dapp2' })])
    })
  })

  describe('searching dapps', () => {
    beforeAll(() => {
      jest.useFakeTimers('modern')
    })

    it('renders correctly when there are no search results', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          dappFavoritesEnabled: true,
          favoriteDappIds: [],
        },
      })

      const { getByTestId, queryByTestId } = render(
        <Provider store={store}>
          <DAppsExplorerScreenSearch />
        </Provider>
      )

      fireEvent.changeText(getByTestId('SearchInput'), 'iDoNotExist')

      // Should display just the no results within the favorites section
      expect(getByTestId('FavoriteDappsSection/NoResults')).toBeTruthy()
      expect(queryByTestId('FavoriteAndAllSectionHeader')).toBeTruthy()
      expect(queryByTestId('DAppsExplorerScreenSearch/NoResults')).toBeNull()
      expect(queryByTestId('AllSectionHeader')).toBeNull()
    })

    it('renders correctly when there are search results in both sections', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          dappFavoritesEnabled: true,
          favoriteDappIds: ['dapp2'],
        },
      })

      const { getByTestId, queryByTestId } = render(
        <Provider store={store}>
          <DAppsExplorerScreenSearch />
        </Provider>
      )

      fireEvent.changeText(getByTestId('SearchInput'), 'dapp')

      // Should display the correct sections
      const favoritesSection = getByTestId('DAppsExplorerScreenSearch/FavoriteDappsSection')
      const allDappsSection = getByTestId('DAppsExplorerScreenSearch/DappsList')

      // Names display correctly in the favorites section
      expect(within(favoritesSection).queryByText(dappsList[0].name)).toBeFalsy()
      expect(within(favoritesSection).getByText(dappsList[1].name)).toBeTruthy()

      // Names display correctly in the all dapps section
      expect(within(allDappsSection).getByText(dappsList[0].name)).toBeTruthy()

      // No results sections should not be displayed
      expect(queryByTestId('FavoriteDappsSection/NoResults')).toBeNull()
      expect(queryByTestId('DAppsExplorerScreenSearch/NoResults')).toBeNull()
    })

    it('clearing search input should show all dapps', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          dappFavoritesEnabled: true,
          favoriteDappIds: ['dapp2'],
        },
      })

      const { getByTestId } = render(
        <Provider store={store}>
          <DAppsExplorerScreenSearch />
        </Provider>
      )

      // Type in search that should have no results
      fireEvent.press(getByTestId('SearchInput'))
      fireEvent.changeText(getByTestId('SearchInput'), 'iDoNotExist')

      // Clear search field - onPress is tested in src/components/CircleButton.test.tsx
      fireEvent.changeText(getByTestId('SearchInput'), '')

      // Dapps displayed in the correct sections
      const favoritesSection = getByTestId('DAppsExplorerScreenSearch/FavoriteDappsSection')
      const allDappsSection = getByTestId('DAppsExplorerScreenSearch/DappsList')

      // Names display correctly in the favorites section
      expect(within(favoritesSection).queryByText(dappsList[0].name)).toBeFalsy()
      expect(within(favoritesSection).getByText(dappsList[1].name)).toBeTruthy()

      // Names display correctly in the all dapps section
      expect(within(allDappsSection).getByText(dappsList[0].name)).toBeTruthy()
    })

    it('triggers events when searching', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          dappFavoritesEnabled: true,
          favoriteDappIds: [],
        },
      })

      const { getByTestId } = render(
        <Provider store={store}>
          <DAppsExplorerScreenSearch />
        </Provider>
      )

      // don't include events dispatched on screen load
      jest.clearAllMocks()

      fireEvent.changeText(getByTestId('SearchInput'), 'swap')
      jest.advanceTimersByTime(1500)

      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(DappExplorerEvents.dapp_search, {
        searchTerm: 'swap',
      })
    })
  })
})

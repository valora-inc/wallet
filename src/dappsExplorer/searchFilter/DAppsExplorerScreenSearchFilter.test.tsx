import { fireEvent, render, within } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { DappExplorerEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { dappSelected, favoriteDapp, fetchDappsList, unfavoriteDapp } from 'src/dapps/slice'
import { DappCategory, DappSection } from 'src/dapps/types'
import DAppsExplorerScreenSearchFilter from 'src/dappsExplorer/searchFilter/DAppsExplorerScreenSearchFilter'
import { createMockStore } from 'test/utils'
import { mockDappListWithCategoryNames } from 'test/values'

jest.mock('src/analytics/ValoraAnalytics')

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

describe(DAppsExplorerScreenSearchFilter, () => {
  beforeEach(() => {
    defaultStore.clearActions()
    jest.clearAllMocks()
  })

  it('renders correctly and fires the correct actions on press dapp', () => {
    const { getByText, queryByText } = render(
      <Provider store={defaultStore}>
        <DAppsExplorerScreenSearchFilter />
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
        <DAppsExplorerScreenSearchFilter />
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
        <DAppsExplorerScreenSearchFilter />
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
        <DAppsExplorerScreenSearchFilter />
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
          dappsFilterEnabled: true,
        },
      })
      const { getByText } = render(
        <Provider store={store}>
          <DAppsExplorerScreenSearchFilter />
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
          dappsSearchEnabled: true,
        },
      })
      const { getByTestId, queryByText } = render(
        <Provider store={store}>
          <DAppsExplorerScreenSearchFilter />
        </Provider>
      )

      const favoritesSection = getByTestId('DAppsExplorerScreenSearchFilter/FavoriteDappsSection')
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
          dappsSearchEnabled: true,
          favoriteDappIds: ['dapp1'],
        },
      })
      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <DAppsExplorerScreenSearchFilter />
        </Provider>
      )

      // don't include events dispatched on screen load
      jest.clearAllMocks()

      const allDappsSection = getByTestId('DAppsExplorerScreenSearchFilter/DappsList')
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
          dappsSearchEnabled: true,
          favoriteDappIds: ['dapp2'],
        },
      })
      const { getByTestId, getAllByTestId, queryByText } = render(
        <Provider store={store}>
          <DAppsExplorerScreenSearchFilter />
        </Provider>
      )

      // don't include events dispatched on screen load
      jest.clearAllMocks()

      const selectedDappCards = getAllByTestId('Dapp/dapp2')
      // should only appear once, in the favorites section
      expect(selectedDappCards).toHaveLength(1)

      const favoritesSection = getByTestId('DAppsExplorerScreenSearchFilter/FavoriteDappsSection')
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
    it('renders correctly when there are no search results', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          dappFavoritesEnabled: true,
          dappsSearchEnabled: true,
          favoriteDappIds: [],
        },
      })

      const { getByTestId, queryByTestId } = render(
        <Provider store={store}>
          <DAppsExplorerScreenSearchFilter />
        </Provider>
      )

      fireEvent.changeText(getByTestId('SearchInput'), 'iDoNotExist')

      // Should display just the no results within the favorites section
      expect(getByTestId('FavoriteDappsSection/NoResults')).toBeTruthy()
      expect(queryByTestId('DAppsExplorerScreenSearchFilter/NoResults')).toBeNull()
    })

    it('renders correctly when there are search results in both sections', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          dappFavoritesEnabled: true,
          dappsSearchEnabled: true,
          favoriteDappIds: ['dapp2'],
        },
      })

      const { getByTestId, queryByTestId } = render(
        <Provider store={store}>
          <DAppsExplorerScreenSearchFilter />
        </Provider>
      )

      fireEvent.changeText(getByTestId('SearchInput'), 'dapp')

      // Should display the correct sections
      const favoritesSection = getByTestId('DAppsExplorerScreenSearchFilter/FavoriteDappsSection')
      const allDappsSection = getByTestId('DAppsExplorerScreenSearchFilter/DappsList')

      // Names display correctly in the favorites section
      expect(within(favoritesSection).queryByText(dappsList[0].name)).toBeFalsy()
      expect(within(favoritesSection).getByText(dappsList[1].name)).toBeTruthy()

      // Names display correctly in the all dapps section
      expect(within(allDappsSection).getByText(dappsList[0].name)).toBeTruthy()

      // No results sections should not be displayed
      expect(queryByTestId('FavoriteDappsSection/NoResults')).toBeNull()
      expect(queryByTestId('DAppsExplorerScreenSearchFilter/NoResults')).toBeNull()
    })

    it('clearing search input should show all dapps', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          dappFavoritesEnabled: true,
          dappsSearchEnabled: true,
          favoriteDappIds: ['dapp2'],
        },
      })

      const { getByTestId } = render(
        <Provider store={store}>
          <DAppsExplorerScreenSearchFilter />
        </Provider>
      )

      // Type in search that should have no results
      fireEvent.press(getByTestId('SearchInput'))
      fireEvent.changeText(getByTestId('SearchInput'), 'iDoNotExist')

      // Clear search field - onPress is tested in src/components/CircleButton.test.tsx
      fireEvent.changeText(getByTestId('SearchInput'), '')

      // Dapps displayed in the correct sections
      const favoritesSection = getByTestId('DAppsExplorerScreenSearchFilter/FavoriteDappsSection')
      const allDappsSection = getByTestId('DAppsExplorerScreenSearchFilter/DappsList')

      // Names display correctly in the favorites section
      expect(within(favoritesSection).queryByText(dappsList[0].name)).toBeFalsy()
      expect(within(favoritesSection).getByText(dappsList[1].name)).toBeTruthy()

      // Names display correctly in the all dapps section
      expect(within(allDappsSection).getByText(dappsList[0].name)).toBeTruthy()
    })
  })

  describe('filter dapps', () => {
    it('renders correctly when there are no filters applied', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          dappFavoritesEnabled: true,
          dappsFilterEnabled: true,
          favoriteDappIds: ['dapp1'],
        },
      })
      const { getByTestId, getByText, queryByText } = render(
        <Provider store={store}>
          <DAppsExplorerScreenSearchFilter />
        </Provider>
      )

      // All Filter Chips is not displayed
      expect(queryByText('dappsScreen.allDapps')).toBeFalsy()
      // Category Filter Chips displayed
      expect(getByText(dappsCategories[0].name)).toBeTruthy()
      expect(getByText(dappsCategories[1].name)).toBeTruthy()

      // Displays favorited dapp in Favorites section
      const favoritesSection = getByTestId('DAppsExplorerScreenSearchFilter/FavoriteDappsSection')
      expect(within(favoritesSection).getByText(dappsList[0].name)).toBeTruthy()
      expect(within(favoritesSection).getByText(dappsList[0].description)).toBeTruthy()
      expect(within(favoritesSection).queryByText(dappsList[1].name)).toBeFalsy()
      expect(within(favoritesSection).queryByText(dappsList[1].description)).toBeFalsy()

      // Displays other dapps in All section
      const allDappsSection = getByTestId('DAppsExplorerScreenSearchFilter/DappsList')
      expect(within(allDappsSection).getByText(dappsList[1].name)).toBeTruthy()
      expect(within(allDappsSection).getByText(dappsList[1].description)).toBeTruthy()
    })

    it('renders correctly when there are filters applied', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          dappFavoritesEnabled: true,
          dappsFilterEnabled: true,
          favoriteDappIds: ['dapp1'],
        },
      })
      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <DAppsExplorerScreenSearchFilter />
        </Provider>
      )

      // Tap on category 2 filter
      fireEvent.press(getByText(dappsCategories[1].name))

      // Favorite Section should show no results
      expect(getByTestId('FavoriteDappsSection/NoResults')).toBeTruthy()

      // All Section should show only 'dapp 2'
      const allDappsSection = getByTestId('DAppsExplorerScreenSearchFilter/DappsList')
      // queryByText returns null if not found
      expect(within(allDappsSection).queryByText(dappsList[0].name)).toBeFalsy()
      expect(within(allDappsSection).queryByText(dappsList[0].description)).toBeFalsy()
      expect(within(allDappsSection).getByText(dappsList[1].name)).toBeTruthy()
      expect(within(allDappsSection).getByText(dappsList[1].description)).toBeTruthy()
    })

    it('triggers event when filtering', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          dappFavoritesEnabled: true,
          dappsFilterEnabled: true,
          favoriteDappIds: ['dapp1'],
        },
      })
      const { getByText } = render(
        <Provider store={store}>
          <DAppsExplorerScreenSearchFilter />
        </Provider>
      )

      // don't include events dispatched on screen load
      jest.clearAllMocks()

      // Tap on category 2 filter
      fireEvent.press(getByText(dappsCategories[1].name))

      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(DappExplorerEvents.dapp_filter, {
        id: '2',
        remove: false,
      })
    })

    it('triggers events when toggling a category filter', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          dappFavoritesEnabled: true,
          dappsFilterEnabled: true,
          favoriteDappIds: ['dapp1'],
        },
      })
      const { getByText } = render(
        <Provider store={store}>
          <DAppsExplorerScreenSearchFilter />
        </Provider>
      )

      // don't include events dispatched on screen load
      jest.clearAllMocks()

      // Tap on category 2 filter
      fireEvent.press(getByText(dappsCategories[1].name))

      // Tap on category 2 filter again to remove it
      fireEvent.press(getByText(dappsCategories[1].name))

      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(2)
      expect(ValoraAnalytics.track).toHaveBeenNthCalledWith(1, DappExplorerEvents.dapp_filter, {
        id: '2',
        remove: false,
      })
      expect(ValoraAnalytics.track).toHaveBeenNthCalledWith(2, DappExplorerEvents.dapp_filter, {
        id: '2',
        remove: true,
      })
    })

    it('triggers event when clearing filters from category section', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          dappFavoritesEnabled: true,
          dappsFilterEnabled: true,
          favoriteDappIds: ['dapp2'],
        },
      })
      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <DAppsExplorerScreenSearchFilter />
        </Provider>
      )

      // don't include events dispatched on screen load
      jest.clearAllMocks()

      // Tap on category 2 filter
      fireEvent.press(getByText(dappsCategories[1].name))

      // Tap on remove filters from all section
      fireEvent.press(getByTestId('DAppsExplorerScreenSearchFilter/NoResults/RemoveFilter'))

      // Assert correct analytics are fired
      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(2)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(DappExplorerEvents.dapp_filter, {
        id: '2',
        remove: false,
      })
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(DappExplorerEvents.dapp_filter, {
        id: '2',
        remove: true,
      })
    })

    it('triggers event when clearing filters from favorite section', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          dappFavoritesEnabled: true,
          dappsFilterEnabled: true,
          favoriteDappIds: ['dapp1'],
        },
      })
      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <DAppsExplorerScreenSearchFilter />
        </Provider>
      )

      // don't include events dispatched on screen load
      jest.clearAllMocks()

      // Tap on category 2 filter
      fireEvent.press(getByText(dappsCategories[1].name))

      // Tap on remove filters from Favorite section
      fireEvent.press(getByTestId('FavoriteDappsSection/NoResults/RemoveFilter'))

      // Assert correct analytics are fired
      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(2)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(DappExplorerEvents.dapp_filter, {
        id: '2',
        remove: false,
      })
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(DappExplorerEvents.dapp_filter, {
        id: '2',
        remove: true,
      })
    })
  })

  describe('searching and filtering', () => {
    it('renders correctly when there are results in all and favorites sections', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          favoriteDappIds: ['dapp1'],
          dappFavoritesEnabled: true,
          dappsFilterEnabled: true,
          dappsSearchEnabled: true,
        },
      })
      const { getByTestId } = render(
        <Provider store={store}>
          <DAppsExplorerScreenSearchFilter />
        </Provider>
      )
      // Search for 'tokens'
      fireEvent.changeText(getByTestId('SearchInput'), 'tokens')

      // Favorites section displays correctly
      const favoriteDappsSection = getByTestId(
        'DAppsExplorerScreenSearchFilter/FavoriteDappsSection'
      )
      expect(within(favoriteDappsSection).getByText(dappsList[0].name)).toBeTruthy()
      expect(within(favoriteDappsSection).getByText(dappsList[0].description)).toBeTruthy()
      expect(within(favoriteDappsSection).queryByText(dappsList[1].name)).toBeFalsy()
      expect(within(favoriteDappsSection).queryByText(dappsList[1].description)).toBeFalsy()

      // All section displays correctly
      const allDappsSection = getByTestId('DAppsExplorerScreenSearchFilter/DappsList')
      expect(within(allDappsSection).getByText(dappsList[1].name)).toBeTruthy()
      expect(within(allDappsSection).getByText(dappsList[1].description)).toBeTruthy()
    })

    it('renders correctly when there are results in favorites and no results in all', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          favoriteDappIds: ['dapp1'],
          dappFavoritesEnabled: true,
          dappsFilterEnabled: true,
          dappsSearchEnabled: true,
        },
      })
      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <DAppsExplorerScreenSearchFilter />
        </Provider>
      )

      // Searching for tokens should return both dapps
      fireEvent.changeText(getByTestId('SearchInput'), 'tokens')

      // Filtering by category 1 should return only dapp 1
      fireEvent.press(getByText(dappsCategories[0].name))

      // Favorite Section should show only 'dapp 1'
      const favoriteDappsSection = getByTestId(
        'DAppsExplorerScreenSearchFilter/FavoriteDappsSection'
      )
      expect(within(favoriteDappsSection).getByText(dappsList[0].name)).toBeTruthy()
      expect(within(favoriteDappsSection).getByText(dappsList[0].description)).toBeTruthy()
      expect(within(favoriteDappsSection).queryByText(dappsList[1].name)).toBeFalsy()
      expect(within(favoriteDappsSection).queryByText(dappsList[1].description)).toBeFalsy()

      // All Section should show no results
      const allDappsSection = getByTestId('DAppsExplorerScreenSearchFilter/DappsList')
      expect(
        within(allDappsSection).getByTestId('DAppsExplorerScreenSearchFilter/NoResults')
      ).toBeTruthy()
    })

    it('renders correctly when there are no results in favorites and results in all', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          favoriteDappIds: ['dapp2'],
          dappFavoritesEnabled: true,
          dappsFilterEnabled: true,
          dappsSearchEnabled: true,
        },
      })
      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <DAppsExplorerScreenSearchFilter />
        </Provider>
      )

      // Searching for tokens should return both dapps
      fireEvent.changeText(getByTestId('SearchInput'), 'tokens')

      // Filtering by category 1 should return only dapp 1
      fireEvent.press(getByText(dappsCategories[0].name))

      // Favorite Section should show no results
      expect(getByTestId('FavoriteDappsSection/NoResults')).toBeTruthy()

      // All Section should show only 'dapp 1'
      const allDappsSection = getByTestId('DAppsExplorerScreenSearchFilter/DappsList')
      expect(within(allDappsSection).getByText(dappsList[0].name)).toBeTruthy()
      expect(within(allDappsSection).getByText(dappsList[0].description)).toBeTruthy()
      expect(within(allDappsSection).queryByText(dappsList[1].name)).toBeFalsy()
      expect(within(allDappsSection).queryByText(dappsList[1].description)).toBeFalsy()
    })
  })
})

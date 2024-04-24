import { fireEvent, render, within } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { DappExplorerEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { dappSelected, favoriteDapp, fetchDappsList, unfavoriteDapp } from 'src/dapps/slice'
import { DappCategory, DappSection } from 'src/dapps/types'
import DAppsExplorerScreenSearchFilter from 'src/dappsExplorer/DAppsExplorerScreenSearchFilter'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import { mockDappListWithCategoryNames } from 'test/values'

jest.mock('src/analytics/ValoraAnalytics')
jest.mock('src/statsig', () => ({
  getExperimentParams: jest.fn(() => ({
    dappsFilterEnabled: true,
    dappsSearchEnabled: true,
  })),
  getFeatureGate: jest.fn(() => true),
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

describe('DAppsExplorerScreenSearchFilter', () => {
  beforeEach(() => {
    defaultStore.clearActions()
    jest.clearAllMocks()
  })

  it('renders correctly and fires the correct actions on press dapp', () => {
    const { getByText, queryByText } = render(
      <Provider store={defaultStore}>
        <MockedNavigator component={DAppsExplorerScreenSearchFilter} />
      </Provider>
    )

    expect(defaultStore.getActions()).toEqual([fetchDappsList()])
    expect(queryByText('featuredDapp')).toBeFalsy()
    expect(getByText('Dapp 1')).toBeTruthy()
    expect(getByText('Dapp 2')).toBeTruthy()

    fireEvent.press(getByText('Dapp 1'))

    expect(defaultStore.getActions()).toEqual([
      fetchDappsList(),
      dappSelected({ dapp: { ...dappsList[0], openedFrom: DappSection.All } }),
    ])
  })

  it('renders correctly and fires the correct actions on press deep linked dapp', () => {
    const { getByText, queryByText } = render(
      <Provider store={defaultStore}>
        <MockedNavigator component={DAppsExplorerScreenSearchFilter} />
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

  it('pens dapps directly', () => {
    const store = createMockStore({
      dapps: {
        dappListApiUrl: 'http://url.com',
        dappsList,
        dappsCategories,
      },
    })
    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={DAppsExplorerScreenSearchFilter} />
      </Provider>
    )

    expect(getByText('dappsDisclaimerAllDapps')).toBeTruthy()

    fireEvent.press(getByText('Dapp 1'))

    expect(store.getActions()).toEqual([
      fetchDappsList(),
      dappSelected({ dapp: { ...dappsList[0], openedFrom: DappSection.All } }),
    ])
  })

  describe('favorite dapps', () => {
    it('renders correctly when there are no favorite dapps', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          favoriteDappIds: [],
        },
      })
      const { getByText, queryByText } = render(
        <Provider store={store}>
          <MockedNavigator component={DAppsExplorerScreenSearchFilter} />
        </Provider>
      )

      expect(queryByText('dappsScreen.noFavorites.title')).toBeNull()
      expect(queryByText('dappsScreen.noFavorites.description')).toBeNull()
      expect(getByText('Dapp 1')).toBeTruthy()
      expect(getByText('Dapp 2')).toBeTruthy()
    })

    it('renders correctly when there are favourited dapps', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          favoriteDappIds: ['dapp2'],
        },
      })
      const { queryByText, getAllByTestId } = render(
        <Provider store={store}>
          <MockedNavigator component={DAppsExplorerScreenSearchFilter} />
        </Provider>
      )

      const favoritesSectionResults = getAllByTestId(
        'DAppsExplorerScreen/FavoritesSection/DappCard'
      )
      expect(favoritesSectionResults.length).toBe(1)
      expect(favoritesSectionResults[0]).toHaveTextContent(dappsList[1].name)
      expect(favoritesSectionResults[0]).toHaveTextContent(dappsList[1].description)
      expect(queryByText('dappsScreen.favoritedDappToast.message')).toBeFalsy()
    })

    it('triggers the events when favoriting', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          favoriteDappIds: ['dapp1'],
        },
      })
      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <MockedNavigator component={DAppsExplorerScreenSearchFilter} />
        </Provider>
      )

      // don't include events dispatched on screen load
      jest.clearAllMocks()

      const allDappsSection = getByTestId('DAppsExplorerScreen/DappsList')
      fireEvent.press(within(allDappsSection).getByTestId('Dapp/Favorite/dapp2'))

      // favorited dapp confirmation toast
      expect(getByText('dappsScreen.favoritedDappToast.message')).toBeTruthy()
      expect(getByText('dappsScreen.favoritedDappToast.labelCTA')).toBeTruthy()

      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith('dapp_favorite', {
        categories: ['2'],
        dappId: 'dapp2',
        dappName: 'Dapp 2',
        section: 'all',
      })
      expect(store.getActions()).toEqual([fetchDappsList(), favoriteDapp({ dappId: 'dapp2' })])
    })

    it('triggers the events when unfavoriting', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          favoriteDappIds: ['dapp2'],
        },
      })
      const { getByTestId, getAllByTestId, queryByText } = render(
        <Provider store={store}>
          <MockedNavigator component={DAppsExplorerScreenSearchFilter} />
        </Provider>
      )

      // don't include events dispatched on screen load
      jest.clearAllMocks()

      const selectedDappCards = getAllByTestId('Dapp/dapp2')
      // should only appear once, in the favorites section
      expect(selectedDappCards).toHaveLength(1)

      fireEvent.press(getByTestId('Dapp/Favorite/dapp2'))

      expect(queryByText('dappsScreen.favoritedDappToast.message')).toBeFalsy()

      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith('dapp_unfavorite', {
        categories: ['2'],
        dappId: 'dapp2',
        dappName: 'Dapp 2',
        section: 'all',
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
          favoriteDappIds: [],
        },
      })

      const { getByTestId, queryByTestId } = render(
        <Provider store={store}>
          <MockedNavigator component={DAppsExplorerScreenSearchFilter} />
        </Provider>
      )

      fireEvent.changeText(getByTestId('SearchInput'), 'iDoNotExist')

      // Should the no results within the all section
      expect(queryByTestId('DAppsExplorerScreen/FavoritesSection/NoResults')).toBeNull()
      expect(getByTestId('DAppsExplorerScreen/AllSection/NoResults')).toBeTruthy()
    })

    it('renders correctly when there are search results in both sections', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          favoriteDappIds: ['dapp2'],
        },
      })

      const { getByTestId, queryByTestId, getAllByTestId } = render(
        <Provider store={store}>
          <MockedNavigator component={DAppsExplorerScreenSearchFilter} />
        </Provider>
      )

      fireEvent.changeText(getByTestId('SearchInput'), 'dapp')

      // Should display the correct sections
      const favoritesSectionResults = getAllByTestId(
        'DAppsExplorerScreen/FavoritesSection/DappCard'
      )
      expect(favoritesSectionResults.length).toBe(1)
      expect(favoritesSectionResults[0]).toHaveTextContent(dappsList[1].name)

      const allSectionResults = getAllByTestId('DAppsExplorerScreen/AllSection/DappCard')
      expect(allSectionResults.length).toBe(2)
      expect(allSectionResults[0]).toHaveTextContent(dappsList[0].name)
      expect(allSectionResults[1]).toHaveTextContent(dappsList[2].name)

      // No results sections should not be displayed
      expect(queryByTestId('DAppsExplorerScreen/FavoritesSection/NoResults')).toBeNull()
      expect(queryByTestId('DAppsExplorerScreen/AllSection/NoResults')).toBeNull()
    })

    it('clearing search input should show all dapps', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          favoriteDappIds: ['dapp2'],
        },
      })

      const { getByTestId, getAllByTestId } = render(
        <Provider store={store}>
          <MockedNavigator component={DAppsExplorerScreenSearchFilter} />
        </Provider>
      )

      // Type in search that should have no results
      fireEvent.press(getByTestId('SearchInput'))
      fireEvent.changeText(getByTestId('SearchInput'), 'iDoNotExist')

      // Clear search field - onPress is tested in src/components/CircleButton.test.tsx
      fireEvent.changeText(getByTestId('SearchInput'), '')

      // Dapps displayed in the correct sections
      const favoritesSectionResults = getAllByTestId(
        'DAppsExplorerScreen/FavoritesSection/DappCard'
      )
      expect(favoritesSectionResults.length).toBe(1)
      expect(favoritesSectionResults[0]).toHaveTextContent(dappsList[1].name)

      const allSectionResults = getAllByTestId('DAppsExplorerScreen/AllSection/DappCard')
      expect(allSectionResults.length).toBe(2)
      expect(allSectionResults[0]).toHaveTextContent(dappsList[0].name)
      expect(allSectionResults[1]).toHaveTextContent(dappsList[2].name)
    })
  })

  describe('filter dapps', () => {
    it('renders correctly when there are no filters applied', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          favoriteDappIds: ['dapp1'],
        },
      })
      const { getByText, queryByText, getAllByTestId } = render(
        <Provider store={store}>
          <MockedNavigator component={DAppsExplorerScreenSearchFilter} />
        </Provider>
      )

      // All Filter Chips is not displayed
      expect(queryByText('dappsScreen.allDapps')).toBeFalsy()
      // Category Filter Chips displayed
      expect(getByText(dappsCategories[0].name)).toBeTruthy()
      expect(getByText(dappsCategories[1].name)).toBeTruthy()

      const favoritesSectionResults = getAllByTestId(
        'DAppsExplorerScreen/FavoritesSection/DappCard'
      )
      expect(favoritesSectionResults.length).toBe(1)
      expect(favoritesSectionResults[0]).toHaveTextContent(dappsList[0].name)

      const allSectionResults = getAllByTestId('DAppsExplorerScreen/AllSection/DappCard')
      expect(allSectionResults.length).toBe(2)
      expect(allSectionResults[0]).toHaveTextContent(dappsList[1].name)
      expect(allSectionResults[1]).toHaveTextContent(dappsList[2].name)
    })

    it('renders correctly when there are filters applied', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          favoriteDappIds: ['dapp1'],
        },
      })
      const { getByTestId, getByText, queryByTestId, getAllByTestId } = render(
        <Provider store={store}>
          <MockedNavigator component={DAppsExplorerScreenSearchFilter} />
        </Provider>
      )

      // Tap on category 2 filter
      fireEvent.press(getByText(dappsCategories[1].name))

      // Favorite Section should not show results
      expect(queryByTestId('DAppsExplorerScreen/FavoritesSection/DappCard')).toBeNull()

      // All Section should show only 'dapp 2'
      const allDappsSection = getByTestId('DAppsExplorerScreen/DappsList')
      // queryByText returns null if not found
      expect(within(allDappsSection).queryByText(dappsList[0].name)).toBeFalsy()
      expect(within(allDappsSection).queryByText(dappsList[0].description)).toBeFalsy()
      expect(within(allDappsSection).getByText(dappsList[1].name)).toBeTruthy()
      expect(within(allDappsSection).getByText(dappsList[1].description)).toBeTruthy()

      const allSectionResults = getAllByTestId('DAppsExplorerScreen/AllSection/DappCard')
      expect(allSectionResults.length).toBe(1)
      expect(allSectionResults[0]).toHaveTextContent(dappsList[1].name)
    })

    it('triggers event when filtering', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          favoriteDappIds: ['dapp1'],
        },
      })
      const { getByText } = render(
        <Provider store={store}>
          <MockedNavigator component={DAppsExplorerScreenSearchFilter} />
        </Provider>
      )

      // don't include events dispatched on screen load
      jest.clearAllMocks()

      // Tap on category 2 filter
      fireEvent.press(getByText(dappsCategories[1].name))

      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(DappExplorerEvents.dapp_filter, {
        filterId: '2',
        remove: false,
      })
    })

    it('triggers events when toggling a category filter', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          favoriteDappIds: ['dapp1'],
        },
      })
      const { getByText } = render(
        <Provider store={store}>
          <MockedNavigator component={DAppsExplorerScreenSearchFilter} />
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
        filterId: '2',
        remove: false,
      })
      expect(ValoraAnalytics.track).toHaveBeenNthCalledWith(2, DappExplorerEvents.dapp_filter, {
        filterId: '2',
        remove: true,
      })
    })

    it('triggers event when clearing filters from category section', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          favoriteDappIds: ['dapp2'],
        },
      })
      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <MockedNavigator component={DAppsExplorerScreenSearchFilter} />
        </Provider>
      )

      // don't include events dispatched on screen load
      jest.clearAllMocks()

      // Tap on category 2 filter
      fireEvent.press(getByText(dappsCategories[1].name))

      // Tap on remove filters from all section
      fireEvent.press(getByTestId('DAppsExplorerScreen/AllSection/NoResults/RemoveFilter'))

      // Assert correct analytics are fired
      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(2)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(DappExplorerEvents.dapp_filter, {
        filterId: '2',
        remove: false,
      })
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(DappExplorerEvents.dapp_filter, {
        filterId: '2',
        remove: true,
      })
    })

    it('triggers event when clearing filters from favorite section', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          favoriteDappIds: ['dapp1'],
        },
      })
      const { getByText, queryByTestId } = render(
        <Provider store={store}>
          <MockedNavigator component={DAppsExplorerScreenSearchFilter} />
        </Provider>
      )

      // don't include events dispatched on screen load
      jest.clearAllMocks()

      // Tap on category 2 filter
      fireEvent.press(getByText(dappsCategories[1].name))

      // Should not render favorites section
      expect(queryByTestId('DAppsExplorerScreen/FavoritesSection/Title')).toBeNull()
      expect(queryByTestId('DAppsExplorerScreen/FavoritesSection/DappCard')).toBeNull()

      // Assert correct analytics are fired
      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(DappExplorerEvents.dapp_filter, {
        filterId: '2',
        remove: false,
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
        },
      })
      const { getByTestId, getAllByTestId } = render(
        <Provider store={store}>
          <MockedNavigator component={DAppsExplorerScreenSearchFilter} />
        </Provider>
      )

      // Search for 'tokens'
      fireEvent.changeText(getByTestId('SearchInput'), 'tokens')

      // Favorites section displays correctly
      const favoritesSectionResults = getAllByTestId(
        'DAppsExplorerScreen/FavoritesSection/DappCard'
      )
      expect(favoritesSectionResults.length).toBe(1)
      expect(favoritesSectionResults[0]).toHaveTextContent(dappsList[0].name)

      // All section displays correctly
      const allSectionResults = getAllByTestId('DAppsExplorerScreen/AllSection/DappCard')
      expect(allSectionResults.length).toBe(1)
      expect(allSectionResults[0]).toHaveTextContent(dappsList[1].name)
    })

    it('renders correctly when there are results in favorites and no results in all', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          favoriteDappIds: ['dapp1'],
        },
      })
      const { getByTestId, getByText, getAllByTestId, queryByTestId } = render(
        <Provider store={store}>
          <MockedNavigator component={DAppsExplorerScreenSearchFilter} />
        </Provider>
      )

      // Searching for tokens should return both dapps
      fireEvent.changeText(getByTestId('SearchInput'), 'tokens')

      // Filtering by category 1 should return only dapp 1
      fireEvent.press(getByText(dappsCategories[0].name))

      // Favorite Section should show only 'dapp 1'
      const favoritesSectionResults = getAllByTestId(
        'DAppsExplorerScreen/FavoritesSection/DappCard'
      )
      expect(favoritesSectionResults.length).toBe(1)
      expect(favoritesSectionResults[0]).toHaveTextContent(dappsList[0].name)

      // All Section should show no results
      expect(queryByTestId('DAppsExplorerScreen/AllSection/DappCard')).toBeFalsy()
      expect(getByTestId('DAppsExplorerScreen/AllSection/NoResults')).toBeTruthy()
    })

    it('renders correctly when there are no results in favorites and results in all', () => {
      const store = createMockStore({
        dapps: {
          dappListApiUrl: 'http://url.com',
          dappsList,
          dappsCategories,
          favoriteDappIds: ['dapp2'],
        },
      })
      const { getByTestId, getByText, queryByTestId } = render(
        <Provider store={store}>
          <MockedNavigator component={DAppsExplorerScreenSearchFilter} />
        </Provider>
      )

      // Searching for tokens should return both dapps
      fireEvent.changeText(getByTestId('SearchInput'), 'tokens')

      // Filtering by category 1 should return only dapp 1
      fireEvent.press(getByText(dappsCategories[0].name))

      // Favorite Section should not show
      expect(queryByTestId('FavoriteDappsSection')).toBeNull()

      // All Section should show only 'dapp 1'
      const allDappsSection = getByTestId('DAppsExplorerScreen/DappsList')
      expect(within(allDappsSection).getByText(dappsList[0].name)).toBeTruthy()
      expect(within(allDappsSection).getByText(dappsList[0].description)).toBeTruthy()
      expect(within(allDappsSection).queryByText(dappsList[1].name)).toBeFalsy()
      expect(within(allDappsSection).queryByText(dappsList[1].description)).toBeFalsy()
    })
  })

  describe('dapp open analytics event properties', () => {
    const defaultStoreProps = {
      dappListApiUrl: 'http://url.com',
      dappsList,
      dappsCategories,
      favoriteDappIds: [],
    }
    const defaultExpectedDappOpenProps = {
      activeFilter: 'all',
      activeSearchTerm: '',
      categories: ['1'],
      dappId: 'dapp3',
      dappName: 'Dapp 3',
      position: 3,
      section: 'all',
    }

    it('should dispatch with no filter or search, from the normal list with no confirmation bottom sheet', () => {
      const store = createMockStore({
        dapps: defaultStoreProps,
      })
      const { getByText } = render(
        <Provider store={store}>
          <MockedNavigator component={DAppsExplorerScreenSearchFilter} />
        </Provider>
      )

      fireEvent.press(getByText('Dapp 3'))

      expect(ValoraAnalytics.track).toHaveBeenLastCalledWith(
        DappExplorerEvents.dapp_open,
        defaultExpectedDappOpenProps
      )
    })

    it('should dispatch with no filter or search, with favourites', () => {
      const store = createMockStore({
        dapps: {
          ...defaultStoreProps,
          favoriteDappIds: ['dapp1'],
        },
      })
      const { getByText } = render(
        <Provider store={store}>
          <MockedNavigator component={DAppsExplorerScreenSearchFilter} />
        </Provider>
      )

      fireEvent.press(getByText('Dapp 3'))

      expect(ValoraAnalytics.track).toHaveBeenLastCalledWith(DappExplorerEvents.dapp_open, {
        ...defaultExpectedDappOpenProps,
        position: 2, // note the position explicitly does not take into account the number of favorites
      })
    })

    it('should dispatch with filter and search', () => {
      const store = createMockStore({
        dapps: defaultStoreProps,
      })
      const { getByText, getByTestId, getAllByTestId } = render(
        <Provider store={store}>
          <MockedNavigator component={DAppsExplorerScreenSearchFilter} />
        </Provider>
      )

      fireEvent.changeText(getByTestId('SearchInput'), 'cool')
      fireEvent.press(getByText(dappsCategories[0].name))

      expect(getAllByTestId('DAppsExplorerScreen/AllSection/DappCard')).toHaveLength(1)
      fireEvent.press(getByText('Dapp 3'))

      expect(ValoraAnalytics.track).toHaveBeenLastCalledWith(DappExplorerEvents.dapp_open, {
        ...defaultExpectedDappOpenProps,
        activeFilter: '1',
        activeSearchTerm: 'cool',
        position: 1,
      })
    })
  })
})

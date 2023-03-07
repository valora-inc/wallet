import { fireEvent, render, within } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { DappExplorerEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { dappSelected, favoriteDapp, fetchDappsList, unfavoriteDapp } from 'src/dapps/slice'
import { DappCategory, DappSection } from 'src/dapps/types'
import DAppsExplorerScreenFilter from 'src/dappsExplorer/DAppsExplorerScreenFilter'
import { createMockStore } from 'test/utils'
import { mockDappListV2 } from 'test/values'

jest.mock('src/analytics/ValoraAnalytics')

const dappsList = mockDappListV2

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

describe(DAppsExplorerScreenFilter, () => {
  beforeEach(() => {
    defaultStore.clearActions()
    jest.clearAllMocks()
  })

  it('renders correctly when no featured dapp is available', () => {
    const { getByTestId, queryByTestId } = render(
      <Provider store={defaultStore}>
        <DAppsExplorerScreenFilter />
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

  it('opens the screen directly when using a deeplink', () => {
    const { getByTestId, queryByTestId } = render(
      <Provider store={defaultStore}>
        <DAppsExplorerScreenFilter />
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
        <DAppsExplorerScreenFilter />
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
        <DAppsExplorerScreenFilter />
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
          dappsFilterEnabled: true,
        },
      })
      const { getByText } = render(
        <Provider store={store}>
          <DAppsExplorerScreenFilter />
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
          dappsFilterEnabled: true,
        },
      })
      const { getByTestId, queryByText } = render(
        <Provider store={store}>
          <DAppsExplorerScreenFilter />
        </Provider>
      )

      const favoritesSection = getByTestId('DAppsExplorerScreen/FavoriteDappsSection')
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
          dappsFilterEnabled: true,
          favoriteDappIds: ['dapp1'],
        },
      })
      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <DAppsExplorerScreenFilter />
        </Provider>
      )

      // don't include events dispatched on screen load
      jest.clearAllMocks()

      const allDappsSection = getByTestId('DAppsExplorerScreenFilter/DappsList')
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
          dappsFilterEnabled: true,
          favoriteDappIds: ['dapp2'],
        },
      })
      const { getByTestId, getAllByTestId, queryByText } = render(
        <Provider store={store}>
          <DAppsExplorerScreenFilter />
        </Provider>
      )

      // don't include events dispatched on screen load
      jest.clearAllMocks()

      const selectedDappCards = getAllByTestId('Dapp/dapp2')
      // should only appear once, in the favorites section
      expect(selectedDappCards).toHaveLength(1)

      const favoritesSection = getByTestId('DAppsExplorerScreen/FavoriteDappsSection')
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
      const { getByTestId } = render(
        <Provider store={store}>
          <DAppsExplorerScreenFilter />
        </Provider>
      )

      // Filter Chips displayed
      expect(getByTestId('DAppsExplorerScreenFilter/FilterChip/all')).toBeTruthy()
      expect(getByTestId('DAppsExplorerScreenFilter/FilterChip/1')).toBeTruthy()
      expect(getByTestId('DAppsExplorerScreenFilter/FilterChip/2')).toBeTruthy()

      // Displays favorited dapp in Favorites section
      const favoritesSection = getByTestId('DAppsExplorerScreen/FavoriteDappsSection')
      expect(within(favoritesSection).getByText(dappsList[0].name)).toBeTruthy()
      expect(within(favoritesSection).getByText(dappsList[0].description)).toBeTruthy()
      expect(within(favoritesSection).queryByText(dappsList[1].name)).toBeFalsy()
      expect(within(favoritesSection).queryByText(dappsList[1].description)).toBeFalsy()

      // Displays other dapps in All section
      const allDappsSection = getByTestId('DAppsExplorerScreenFilter/DappsList')
      expect(within(allDappsSection).getByText(dappsList[1].name)).toBeTruthy()
      expect(within(allDappsSection).getByText(dappsList[1].description)).toBeTruthy()
      // TODO: debug why we can't check that dapp 1 is not in the list
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
      const { getByTestId } = render(
        <Provider store={store}>
          <DAppsExplorerScreenFilter />
        </Provider>
      )

      // Tap on category 2 filter
      fireEvent.press(getByTestId('DAppsExplorerScreenFilter/FilterChip/2'))

      // Favorite Section should show no results
      expect(getByTestId('FavoriteDappsSection/NoResults')).toBeTruthy()

      // All Section should show only 'dapp 2'
      const allDappsSection = getByTestId('DAppsExplorerScreenFilter/DappsList')
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
      const { getByTestId } = render(
        <Provider store={store}>
          <DAppsExplorerScreenFilter />
        </Provider>
      )

      // don't include events dispatched on screen load
      jest.clearAllMocks()

      // Tap on category 2 filter
      fireEvent.press(getByTestId('DAppsExplorerScreenFilter/FilterChip/2'))

      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(DappExplorerEvents.dapp_filter, {
        id: '2',
        remove: false,
      })
    })

    it('triggers event when clearing filters from all section', () => {
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
      const { getByTestId } = render(
        <Provider store={store}>
          <DAppsExplorerScreenFilter />
        </Provider>
      )

      // don't include events dispatched on screen load
      jest.clearAllMocks()

      // Tap on category 2 filter
      fireEvent.press(getByTestId('DAppsExplorerScreenFilter/FilterChip/2'))

      // Tap on remove filters from all section
      fireEvent.press(getByTestId('DAppsExplorerScreenFilter/NoResults/RemoveFilter'))

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
      const { getByTestId } = render(
        <Provider store={store}>
          <DAppsExplorerScreenFilter />
        </Provider>
      )

      // don't include events dispatched on screen load
      jest.clearAllMocks()

      // Tap on category 2 filter
      fireEvent.press(getByTestId('DAppsExplorerScreenFilter/FilterChip/2'))

      // Tap on remove filters from all section
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
})

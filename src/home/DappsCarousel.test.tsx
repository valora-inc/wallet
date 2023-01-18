import { fireEvent, render, within } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { Dapp } from 'src/dapps/types'
import DappsCarousel from 'src/home/DappsCarousel'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore } from 'test/utils'

jest.mock('src/analytics/ValoraAnalytics')
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: jest.fn().mockReturnValue({ width: 314, height: 818, scale: 1, fontScale: 1 }),
}))
jest.mock('lodash', () => ({
  ...(jest.requireActual('lodash') as any),
  debounce: jest.fn((fn) => fn),
}))

const dappsList: Dapp[] = [
  {
    name: 'Ubeswap',
    description: 'Swap any token, enter a pool, or farm your crypto',
    dappUrl: 'https://app.ubeswap.org/',
    categoryId: 'exchanges',
    iconUrl: 'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/ubeswap.png',
    isFeatured: false,
    id: 'ubeswap',
  },
  {
    name: 'Moola',
    description: 'Lend, borrow, or add to a pool to earn rewards',
    dappUrl: 'https://app.moola.market/',
    categoryId: 'lend',
    iconUrl: 'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/moola.png',
    isFeatured: false,
    id: 'moola',
  },
  {
    name: 'Mento-Fi',
    description: 'Exchange between Celo native currencies with Mento',
    dappUrl: 'https://mento.finance/',
    categoryId: 'exchanges',
    iconUrl: 'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/mentofi.png',
    isFeatured: false,
    id: 'mentofi',
  },
  {
    name: 'Poof',
    description: 'Make your transactions untraceable',
    dappUrl: 'https://app.poof.cash/#/account/create',
    categoryId: 'social',
    iconUrl: 'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/poofcash.png',
    isFeatured: true,
    id: 'poofcash',
  },
]

const recentDappIds = [dappsList[0].id, dappsList[2].id]
const favoriteDappIds = [dappsList[1].id, dappsList[3].id]

describe('DappsCarousel', () => {
  it('renders nothing if recently used dapps and favorited dapps are not enabled', () => {
    const { toJSON } = render(
      <Provider
        store={createMockStore({
          dapps: {
            recentDappIds,
            favoriteDappIds,
            dappsList,
            maxNumRecentDapps: 0,
            dappFavoritesEnabled: false,
          },
        })}
      >
        <DappsCarousel onSelectDapp={jest.fn()} />
      </Provider>
    )

    expect(toJSON()).toBeNull()
  })

  it('renders nothing if there are no recently used or favorited dapps', () => {
    const { toJSON } = render(
      <Provider
        store={createMockStore({
          dapps: {
            recentDappIds: [],
            favoriteDappIds: [],
            dappsList,
            maxNumRecentDapps: 4,
            dappFavoritesEnabled: true,
          },
        })}
      >
        <DappsCarousel onSelectDapp={jest.fn()} />
      </Provider>
    )

    expect(toJSON()).toBeNull()
  })

  it('navigates to dapp explorer screen', () => {
    const { getByText } = render(
      <Provider
        store={createMockStore({
          dapps: {
            recentDappIds,
            maxNumRecentDapps: 4,
            dappsList,
          },
        })}
      >
        <DappsCarousel onSelectDapp={jest.fn()} />
      </Provider>
    )

    fireEvent.press(getByText('allDapps'))

    expect(navigate).toHaveBeenCalledWith(Screens.DAppsExplorerScreen)
  })

  describe('recently used dapps', () => {
    const store = createMockStore({
      dapps: {
        recentDappIds,
        maxNumRecentDapps: 4,
        dappsList,
      },
    })

    it('renders correctly with all recently used dapps', () => {
      const { getByText, getAllByTestId } = render(
        <Provider store={store}>
          <DappsCarousel onSelectDapp={jest.fn()} />
        </Provider>
      )

      const dapps = getAllByTestId('RecentlyUsedDapps/Dapp')

      expect(getByText('recentlyUsedDapps')).toBeTruthy()
      expect(getByText('allDapps')).toBeTruthy()
      expect(dapps).toHaveLength(recentDappIds.length)

      expect(within(dapps[0]).getByText(dappsList[0].name)).toBeTruthy()
      expect(within(dapps[0]).getByTestId('RecentlyUsedDapps/Icon').props.source.uri).toEqual(
        dappsList[0].iconUrl
      )
      expect(within(dapps[1]).getByText(dappsList[2].name)).toBeTruthy()
      expect(within(dapps[1]).getByTestId('RecentlyUsedDapps/Icon').props.source.uri).toEqual(
        dappsList[2].iconUrl
      )
    })

    it('fires the correct callback on press dapp', () => {
      const selectDappSpy = jest.fn()
      const { getAllByTestId } = render(
        <Provider store={store}>
          <DappsCarousel onSelectDapp={selectDappSpy} />
        </Provider>
      )

      fireEvent.press(getAllByTestId('RecentlyUsedDapps/Dapp')[1])

      expect(selectDappSpy).toHaveBeenCalledTimes(1)
      expect(selectDappSpy).toHaveBeenCalledWith({ ...dappsList[2], openedFrom: 'recently used' })
    })

    it('only renders the maximum allowed number of dapps', () => {
      const { getAllByTestId } = render(
        <Provider
          store={createMockStore({
            dapps: {
              recentDappIds, // this has length 2
              maxNumRecentDapps: 1,
              dappsList,
            },
          })}
        >
          <DappsCarousel onSelectDapp={jest.fn()} />
        </Provider>
      )

      const dapps = getAllByTestId('RecentlyUsedDapps/Dapp')

      expect(dapps).toHaveLength(1)
      expect(within(dapps[0]).getByText(dappsList[0].name)).toBeTruthy()
    })
  })

  describe('favorite dapps', () => {
    const store = createMockStore({
      dapps: {
        recentDappIds,
        dappsList,
        maxNumRecentDapps: 4,
        dappFavoritesEnabled: true,
        favoriteDappIds,
      },
    })

    it('renders correctly with favorited dapps', () => {
      const { getByText, getAllByTestId } = render(
        <Provider store={store}>
          <DappsCarousel onSelectDapp={jest.fn()} />
        </Provider>
      )

      const dapps = getAllByTestId('FavoritedDapps/Dapp')

      expect(getByText('favoritedDapps')).toBeTruthy()
      expect(getByText('allDapps')).toBeTruthy()
      expect(dapps).toHaveLength(recentDappIds.length)

      expect(within(dapps[0]).getByText(dappsList[1].name)).toBeTruthy()
      expect(within(dapps[0]).getByTestId('FavoritedDapps/Icon').props.source.uri).toEqual(
        dappsList[1].iconUrl
      )
      expect(within(dapps[1]).getByText(dappsList[3].name)).toBeTruthy()
      expect(within(dapps[1]).getByTestId('FavoritedDapps/Icon').props.source.uri).toEqual(
        dappsList[3].iconUrl
      )
    })

    it('fires the correct callback on press dapp', () => {
      const selectDappSpy = jest.fn()
      const { getAllByTestId } = render(
        <Provider store={store}>
          <DappsCarousel onSelectDapp={selectDappSpy} />
        </Provider>
      )

      fireEvent.press(getAllByTestId('FavoritedDapps/Dapp')[1])

      expect(selectDappSpy).toHaveBeenCalledTimes(1)
      expect(selectDappSpy).toHaveBeenCalledWith({
        ...dappsList[3],
        openedFrom: 'favorites home screen',
      })
    })

    it('only renders the maximum allowed number of dapps', () => {
      const { getAllByTestId } = render(
        <Provider
          store={createMockStore({
            dapps: {
              recentDappIds, // this has length 2
              dappsList,
              maxNumRecentDapps: 1,
              dappFavoritesEnabled: true,
              favoriteDappIds, // this has length 2
            },
          })}
        >
          <DappsCarousel onSelectDapp={jest.fn()} />
        </Provider>
      )

      const dapps = getAllByTestId('FavoritedDapps/Dapp')

      expect(dapps).toHaveLength(1)
      expect(within(dapps[0]).getByText(dappsList[1].name)).toBeTruthy()
    })
  })

  describe('impression analytics', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    const store = createMockStore({
      dapps: {
        recentDappIds: dappsList.map((dapp) => dapp.id),
        maxNumRecentDapps: 4,
        dappsList,
      },
    })

    it('should track impressions for dapps visible', () => {
      // as the DAPP_WIDTH is 100, only 3 dapps should be displayed for the above
      // mocked screen width
      render(
        <Provider store={store}>
          <DappsCarousel onSelectDapp={jest.fn()} />
        </Provider>
      )

      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(3)
      expect(ValoraAnalytics.track).toHaveBeenNthCalledWith(1, 'dapp_impression', {
        categoryId: 'exchanges',
        dappId: 'ubeswap',
        dappName: 'Ubeswap',
        section: 'recently used',
        horizontalPosition: 0,
      })
      expect(ValoraAnalytics.track).toHaveBeenNthCalledWith(2, 'dapp_impression', {
        categoryId: 'lend',
        dappId: 'moola',
        dappName: 'Moola',
        section: 'recently used',
        horizontalPosition: 1,
      })
      expect(ValoraAnalytics.track).toHaveBeenNthCalledWith(3, 'dapp_impression', {
        categoryId: 'exchanges',
        dappId: 'mentofi',
        dappName: 'Mento-Fi',
        section: 'recently used',
        horizontalPosition: 2,
      })
    })

    it('should only track impressions once on scrolling back and forth', () => {
      const { getByTestId } = render(
        <Provider store={store}>
          <DappsCarousel onSelectDapp={jest.fn()} />
        </Provider>
      )

      const scrollview = getByTestId('RecentlyUsedDapps/ScrollContainer')
      fireEvent.scroll(scrollview, { nativeEvent: { contentOffset: { x: 400 } } })
      fireEvent.scroll(scrollview, { nativeEvent: { contentOffset: { x: 0 } } })
      fireEvent.scroll(scrollview, { nativeEvent: { contentOffset: { x: 400 } } })

      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(4)
      expect(ValoraAnalytics.track).toHaveBeenNthCalledWith(4, 'dapp_impression', {
        categoryId: 'social',
        dappId: 'poofcash',
        dappName: 'Poof',
        section: 'recently used',
        horizontalPosition: 3,
      })
    })

    it('should not render content or track impressions if maxNumRecentDapps is 0', () => {
      const { toJSON } = render(
        <Provider
          store={createMockStore({
            dapps: {
              recentDappIds: dappsList.map((dapp) => dapp.id),
              maxNumRecentDapps: 0,
              dappsList,
            },
          })}
        >
          <DappsCarousel onSelectDapp={jest.fn()} />
        </Provider>
      )

      expect(toJSON()).toBeNull()
      expect(ValoraAnalytics.track).not.toHaveBeenCalled()
    })
  })
})

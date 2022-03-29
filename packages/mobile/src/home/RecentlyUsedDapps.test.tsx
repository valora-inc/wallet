import { fireEvent, render, within } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import RecentlyUsedDapps from 'src/home/RecentlyUsedDapps'
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

const recentDapps = [
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

describe('RecentlyUsedDapps', () => {
  it('renders nothing if there are no recently used dapps', () => {
    const { queryByTestId } = render(
      <Provider
        store={createMockStore({
          app: {
            recentDapps: [],
          },
        })}
      >
        <RecentlyUsedDapps onSelectDapp={jest.fn()} />
      </Provider>
    )

    expect(queryByTestId('RecentlyUsedDappsContainer')).toBeFalsy()
  })

  it('renders correctly with all recently used dapps', () => {
    const store = createMockStore({
      app: {
        recentDapps,
      },
    })
    const { getByText, getAllByTestId } = render(
      <Provider store={store}>
        <RecentlyUsedDapps onSelectDapp={jest.fn()} />
      </Provider>
    )

    const dapps = getAllByTestId('RecentDapp')

    expect(getByText('recentlyUsedDapps')).toBeTruthy()
    expect(getByText('allDapps')).toBeTruthy()
    expect(dapps).toHaveLength(recentDapps.length)

    dapps.forEach((dapp, index) => {
      expect(within(dapp).getByText(recentDapps[index].name)).toBeTruthy()
      expect(within(dapp).getByTestId('RecentDapp-icon').props.source.uri).toEqual(
        recentDapps[index].iconUrl
      )
    })
  })

  it('fires the correct callback on press dapp', () => {
    const selectDappSpy = jest.fn()
    const { getAllByTestId } = render(
      <Provider
        store={createMockStore({
          app: {
            recentDapps,
          },
        })}
      >
        <RecentlyUsedDapps onSelectDapp={selectDappSpy} />
      </Provider>
    )

    fireEvent.press(getAllByTestId('RecentDapp')[1])

    expect(selectDappSpy).toHaveBeenCalledTimes(1)
    expect(selectDappSpy).toHaveBeenCalledWith({ ...recentDapps[1], openedFrom: 'recently used' })
  })

  it('navigates to dapp explorer screen', () => {
    const { getByText } = render(
      <Provider
        store={createMockStore({
          app: {
            recentDapps,
          },
        })}
      >
        <RecentlyUsedDapps onSelectDapp={jest.fn()} />
      </Provider>
    )

    fireEvent.press(getByText('allDapps'))

    expect(navigate).toHaveBeenCalledWith(Screens.DAppsExplorerScreen)
  })

  describe('impression analytics', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should track impressions for dapps visible', () => {
      // as the DAPP_WIDTH is 100, only 3 dapps should be displayed for the above
      // mocked screen width
      render(
        <Provider
          store={createMockStore({
            app: {
              recentDapps,
            },
          })}
        >
          <RecentlyUsedDapps onSelectDapp={jest.fn()} />
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
        <Provider
          store={createMockStore({
            app: {
              recentDapps,
            },
          })}
        >
          <RecentlyUsedDapps onSelectDapp={jest.fn()} />
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
  })
})

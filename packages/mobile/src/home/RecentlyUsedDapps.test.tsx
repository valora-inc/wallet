import { fireEvent, render, within } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import RecentlyUsedDapps from 'src/home/RecentlyUsedDapps'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore } from 'test/utils'

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
    expect(dapps).toHaveLength(2)

    expect(within(dapps[0]).getByText(recentDapps[0].name)).toBeTruthy()
    expect(within(dapps[0]).getByTestId('RecentDapp-icon').props.source).toEqual({
      uri: recentDapps[0].iconUrl,
    })

    expect(within(dapps[1]).getByText(recentDapps[1].name)).toBeTruthy()
    expect(within(dapps[1]).getByTestId('RecentDapp-icon').props.source).toEqual({
      uri: recentDapps[1].iconUrl,
    })
  })

  it('fires the correct actions on press dapp', () => {
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
    expect(selectDappSpy).toHaveBeenCalledWith(recentDapps[1])
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
})

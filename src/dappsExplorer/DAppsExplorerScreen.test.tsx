import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { dappSelected, fetchDappsList } from 'src/dapps/slice'
import { Dapp, DappCategory, DappSection } from 'src/dapps/types'
import DAppsExplorerScreen from 'src/dappsExplorer/DAppsExplorerScreen'
import { createMockStore } from 'test/utils'

const dappsList: Dapp[] = [
  {
    name: 'Ubeswap',
    id: '1',
    categoryId: '1',
    description: 'Swap tokens!',
    iconUrl: 'https://raw.githubusercontent.com/valora-inc/app-list/main/assets/ubeswap.png',
    dappUrl: 'https://app.ubeswap.org/',
    isFeatured: false,
  },
  {
    name: 'Moola',
    id: '2',
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

const store = createMockStore({
  dapps: { dappListApiUrl: 'http://url.com', dappsList, dappsCategories },
})

describe(DAppsExplorerScreen, () => {
  beforeEach(() => {
    store.clearActions()
  })

  it('renders correctly when no featured dapp is available', async () => {
    const store = createMockStore({
      dapps: { dappListApiUrl: 'http://url.com', dappsList, dappsCategories },
    })
    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <DAppsExplorerScreen />
      </Provider>
    )

    expect(store.getActions()).toEqual([fetchDappsList()])
    expect(getByTestId('Dapp/1')).toBeTruthy()
    expect(getByTestId('Dapp/2')).toBeTruthy()
    expect(queryByTestId('FeaturedDapp')).toBeFalsy()

    fireEvent.press(getByTestId('Dapp/1'))
    fireEvent.press(getByTestId('ConfirmDappButton'))

    expect(store.getActions()).toEqual([
      fetchDappsList(),
      dappSelected({ dapp: { ...dappsList[0], openedFrom: DappSection.All } }),
    ])
  })

  it("renders correctly when there's a featured dapp available", async () => {
    const featuredDapp: Dapp = {
      name: 'SushiSwap',
      id: '3',
      categoryId: '1',
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
    expect(getByTestId('Dapp/1')).toBeTruthy()
    expect(getByTestId('Dapp/2')).toBeTruthy()
    expect(queryByTestId('FeaturedDapp')).toBeTruthy()

    fireEvent.press(getByTestId('FeaturedDapp'))
    fireEvent.press(getByTestId('ConfirmDappButton'))

    expect(store.getActions()).toEqual([
      fetchDappsList(),
      dappSelected({ dapp: { ...featuredDapp, openedFrom: DappSection.Featured } }),
    ])
  })

  it('opens the screen directly when using a deeplink', async () => {
    const store = createMockStore({
      dapps: { dappListApiUrl: 'http://url.com', dappsList, dappsCategories },
    })
    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <DAppsExplorerScreen />
      </Provider>
    )

    expect(store.getActions()).toEqual([fetchDappsList()])
    expect(getByTestId('Dapp/1')).toBeTruthy()
    expect(getByTestId('Dapp/2')).toBeTruthy()
    expect(queryByTestId('FeaturedDapp')).toBeFalsy()

    fireEvent.press(getByTestId('Dapp/2'))

    expect(store.getActions()).toEqual([
      fetchDappsList(),
      dappSelected({ dapp: { ...dappsList[1], openedFrom: DappSection.All } }),
    ])
  })
})

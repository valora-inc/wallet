import { fireEvent, render } from '@testing-library/react-native'
import { FetchMock } from 'jest-fetch-mock/types'
import * as React from 'react'
import { Provider } from 'react-redux'
import DAppsExplorerScreen from 'src/dappsExplorer/DAppsExplorerScreen'
import { createMockStore, flushMicrotasksQueue } from 'test/utils'

const mockResponseWithoutFeaturedDapp = {
  categories: [
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
  ],
  applications: [
    {
      name: 'Ubeswap',
      id: '1',
      categoryId: '1',
      description: 'Swap tokens!',
      logoUrl: 'https://raw.githubusercontent.com/valora-inc/app-list/main/assets/ubeswap.png',
      url: 'https://app.ubeswap.org/',
    },
    {
      name: 'Moola',
      id: '2',
      categoryId: '2',
      description: 'Lend and borrow tokens!',
      logoUrl: 'https://raw.githubusercontent.com/valora-inc/app-list/main/assets/moola.png',
      url: 'kolektivo://wallet/moolaScreen',
    },
  ],
}

const mockResponseWithFeaturedDapp = {
  ...mockResponseWithoutFeaturedDapp,
  featured: {
    name: 'SushiSwap',
    id: '3',
    categoryId: '1',
    description: 'Swap some tokens!',
    logoUrl: 'https://raw.githubusercontent.com/valora-inc/app-list/main/assets/sushiswap.png',
    url: 'https://app.sushi.com/',
  },
}

const store = createMockStore({
  app: { dappListApiUrl: 'http://url.com' },
})

describe(DAppsExplorerScreen, () => {
  const mockFetch = fetch as FetchMock
  beforeEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
    mockFetch.resetMocks()
    store.clearActions()
  })

  it('renders correctly when no featured dapp is available', async () => {
    mockFetch.mockResponse(JSON.stringify(mockResponseWithoutFeaturedDapp))
    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <DAppsExplorerScreen />
      </Provider>
    )

    jest.runAllTimers()
    await flushMicrotasksQueue()

    expect(getByTestId('Dapp/1')).toBeTruthy()
    expect(getByTestId('Dapp/2')).toBeTruthy()
    expect(queryByTestId('FeaturedDapp')).toBeFalsy()

    fireEvent.press(getByTestId('Dapp/1'))
    expect(store.getActions().length).toEqual(0)
    fireEvent.press(getByTestId('ConfirmDappButton'))

    expect(store.getActions()).toMatchInlineSnapshot(`
      Array [
        Object {
          "dapp": Object {
            "categoryId": "1",
            "dappUrl": "https://app.ubeswap.org/",
            "description": "Swap tokens!",
            "iconUrl": "https://raw.githubusercontent.com/valora-inc/app-list/main/assets/ubeswap.png",
            "id": "1",
            "isFeatured": false,
            "name": "Ubeswap",
            "openedFrom": "all",
          },
          "type": "APP/DAPP_SELECTED",
        },
      ]
    `)
  })

  it("renders correctly when there's a featured dapp available", async () => {
    mockFetch.mockResponse(JSON.stringify(mockResponseWithFeaturedDapp))

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <DAppsExplorerScreen />
      </Provider>
    )

    jest.runAllTimers()
    await flushMicrotasksQueue()

    expect(getByTestId('Dapp/1')).toBeTruthy()
    expect(getByTestId('Dapp/2')).toBeTruthy()
    expect(queryByTestId('FeaturedDapp')).toBeTruthy()

    fireEvent.press(getByTestId('FeaturedDapp'))
    expect(store.getActions().length).toEqual(0)
    fireEvent.press(getByTestId('ConfirmDappButton'))

    expect(store.getActions()).toMatchInlineSnapshot(`
      Array [
        Object {
          "dapp": Object {
            "categoryId": "1",
            "dappUrl": "https://app.sushi.com/",
            "description": "Swap some tokens!",
            "iconUrl": "https://raw.githubusercontent.com/valora-inc/app-list/main/assets/sushiswap.png",
            "id": "3",
            "isFeatured": true,
            "name": "SushiSwap",
            "openedFrom": "featured",
          },
          "type": "APP/DAPP_SELECTED",
        },
      ]
    `)
  })

  it('opens the screen directly when using a deeplink', async () => {
    mockFetch.mockResponse(JSON.stringify(mockResponseWithoutFeaturedDapp))
    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <DAppsExplorerScreen />
      </Provider>
    )

    jest.runAllTimers()
    await flushMicrotasksQueue()

    expect(getByTestId('Dapp/1')).toBeTruthy()
    expect(getByTestId('Dapp/2')).toBeTruthy()
    expect(queryByTestId('FeaturedDapp')).toBeFalsy()

    fireEvent.press(getByTestId('Dapp/2'))

    expect(store.getActions()).toMatchInlineSnapshot(`
      Array [
        Object {
          "dapp": Object {
            "categoryId": "2",
            "dappUrl": "kolektivo://wallet/moolaScreen",
            "description": "Lend and borrow tokens!",
            "iconUrl": "https://raw.githubusercontent.com/valora-inc/app-list/main/assets/moola.png",
            "id": "2",
            "isFeatured": false,
            "name": "Moola",
            "openedFrom": "all",
          },
          "type": "APP/DAPP_SELECTED",
        },
      ]
    `)
  })
})

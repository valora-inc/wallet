import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import {
  AssetsTokenBalance,
  FiatExchangeTokenBalance,
  HomeTokenBalance,
} from 'src/components/TokenBalance'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getFeatureGate } from 'src/statsig'
import { Currency } from 'src/utils/currencies'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'
import { createMockStore, getElementText } from 'test/utils'
import { mockPositions, mockTokenBalances } from 'test/values'

jest.mock('src/statsig')

const defaultStore = {
  tokens: {
    tokenBalances: mockTokenBalances,
  },
  positions: {
    positions: mockPositions, // Total value of positions is ~$7.91
  },
  localCurrency: {
    preferredCurrencyCode: LocalCurrencyCode.USD,
    fetchedCurrencyCode: LocalCurrencyCode.USD,
    exchangeRates: {
      [Currency.Dollar]: '1',
      [Currency.Euro]: null,
      [Currency.Celo]: null,
    },
  },
}

jest.mocked(getFeatureGate).mockReturnValue(true)

describe('FiatExchangeTokenBalance and HomeTokenBalance', () => {
  it.each([HomeTokenBalance, FiatExchangeTokenBalance])(
    'renders correctly with multiple token balances and positions',
    async (TokenBalanceComponent) => {
      const store = createMockStore({
        ...defaultStore,
        tokens: {
          tokenBalances: {
            '0x00400FcbF0816bebB94654259de7273f4A05c762': {
              usdPrice: '0.1',
              address: '0x00400FcbF0816bebB94654259de7273f4A05c762',
              symbol: 'POOF',
              balance: '5',
              priceFetchedAt: Date.now(),
            },
            '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F': {
              usdPrice: '1.16',
              address: '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
              symbol: 'cEUR',
              balance: '7',
              priceFetchedAt: Date.now(),
            },
            '0x048F47d358EC521a6cf384461d674750a3cB58C8': {
              address: '0x048F47d358EC521a6cf384461d674750a3cB58C8',
              symbol: 'TT',
              balance: '10',
              priceFetchedAt: Date.now(),
            },
          },
        },
      })

      const tree = render(
        <Provider store={store}>
          <TokenBalanceComponent />
        </Provider>
      )

      expect(tree.queryByTestId('ViewBalances')).toBeTruthy()
      expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual('$16.53')
    }
  )

  it.each([HomeTokenBalance, FiatExchangeTokenBalance])(
    'navigates to TokenBalances screen on View Balances tap',
    async (TokenBalanceComponent) => {
      const store = createMockStore({
        ...defaultStore,
        tokens: {
          // FiatExchangeTokenBalance requires 2 balances to display the View Balances button
          tokenBalances: {
            '0x00400FcbF0816bebB94654259de7273f4A05c762': {
              usdPrice: '0.1',
              address: '0x00400FcbF0816bebB94654259de7273f4A05c762',
              symbol: 'POOF',
              balance: '5',
              priceFetchedAt: Date.now(),
            },
            '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F': {
              usdPrice: '1.16',
              address: '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
              symbol: 'cEUR',
              balance: '7',
              priceFetchedAt: Date.now(),
            },
          },
        },
      })

      const { getByTestId } = render(
        <Provider store={store}>
          <TokenBalanceComponent />
        </Provider>
      )

      fireEvent.press(getByTestId('ViewBalances'))
      expect(navigate).toHaveBeenCalledWith(Screens.TokenBalances)
    }
  )

  it.each([HomeTokenBalance, FiatExchangeTokenBalance])(
    'renders correctly with zero token balance and zero positions',
    async (TokenBalanceComponent) => {
      const store = createMockStore({
        ...defaultStore,
        tokens: {
          tokenBalances: {},
        },
        positions: {
          positions: [],
        },
      })

      const tree = render(
        <Provider store={store}>
          <TokenBalanceComponent />
        </Provider>
      )

      expect(tree.queryByTestId('ViewBalances')).toBeFalsy()
      expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual('$0.00')
    }
  )

  it.each([HomeTokenBalance, FiatExchangeTokenBalance])(
    'renders correctly with zero balance and some positions',
    async (TokenBalanceComponent) => {
      const store = createMockStore({
        ...defaultStore,
        tokens: {
          tokenBalances: {},
        },
      })

      const tree = render(
        <Provider store={store}>
          <TokenBalanceComponent />
        </Provider>
      )

      expect(tree.queryByTestId('ViewBalances')).toBeFalsy()
      expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual('$7.91')
    }
  )

  it.each([HomeTokenBalance, FiatExchangeTokenBalance])(
    'renders correctly with one token balance and zero positions',
    async (TokenBalanceComponent) => {
      const store = createMockStore({
        ...defaultStore,
        positions: {
          positions: [],
        },
      })

      const tree = render(
        <Provider store={store}>
          <TokenBalanceComponent />
        </Provider>
      )

      expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual('$0.50')
    }
  )

  it.each([HomeTokenBalance, FiatExchangeTokenBalance])(
    'renders correctly with one token balance and some positions',
    async (TokenBalanceComponent) => {
      const store = createMockStore(defaultStore)

      const tree = render(
        <Provider store={store}>
          <TokenBalanceComponent />
        </Provider>
      )

      expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual('$8.41')
    }
  )

  it.each([HomeTokenBalance, FiatExchangeTokenBalance])(
    'renders correctly with one token balance and another token without usdPrice with balance and zero positions',
    async (TokenBalanceComponent) => {
      const store = createMockStore({
        ...defaultStore,
        tokens: {
          tokenBalances: {
            '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F': {
              usdPrice: '1.16',
              address: '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
              symbol: 'cEUR',
              balance: '7',
              priceFetchedAt: Date.now(),
            },
            '0x048F47d358EC521a6cf384461d674750a3cB58C8': {
              address: '0x048F47d358EC521a6cf384461d674750a3cB58C8',
              symbol: 'TT',
              balance: '10',
            },
          },
        },
        positions: {
          positions: [],
        },
      })

      const tree = render(
        <Provider store={store}>
          <TokenBalanceComponent />
        </Provider>
      )

      expect(tree.queryByTestId('ViewBalances')).toBeTruthy()
      expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual('$8.12')
    }
  )

  it.each([HomeTokenBalance, FiatExchangeTokenBalance])(
    'renders correctly with one token balance and another token without usdPrice with balance and some positions',
    async (TokenBalanceComponent) => {
      const store = createMockStore({
        ...defaultStore,
        tokens: {
          tokenBalances: {
            '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F': {
              usdPrice: '1.16',
              address: '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
              symbol: 'cEUR',
              balance: '7',
              priceFetchedAt: Date.now(),
            },
            '0x048F47d358EC521a6cf384461d674750a3cB58C8': {
              address: '0x048F47d358EC521a6cf384461d674750a3cB58C8',
              symbol: 'TT',
              balance: '10',
            },
          },
        },
      })

      const tree = render(
        <Provider store={store}>
          <TokenBalanceComponent />
        </Provider>
      )

      expect(tree.queryByTestId('ViewBalances')).toBeTruthy()
      expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual('$16.03')
    }
  )

  it.each([HomeTokenBalance, FiatExchangeTokenBalance])(
    'renders correctly with no token balance and no positions',
    async (TokenBalanceComponent) => {
      const store = createMockStore({
        tokens: {
          tokenBalances: {},
        },
        positions: {
          positions: [],
        },
      })

      const tree = render(
        <Provider store={store}>
          <TokenBalanceComponent />
        </Provider>
      )

      expect(tree.queryByTestId('ViewBalances')).toBeFalsy()
      expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual('₱0.00')
    }
  )

  it.each([HomeTokenBalance, FiatExchangeTokenBalance])(
    'renders correctly with no token balance and some positions',
    async (TokenBalanceComponent) => {
      const store = createMockStore({
        tokens: {
          tokenBalances: {},
        },
      })

      const tree = render(
        <Provider store={store}>
          <TokenBalanceComponent />
        </Provider>
      )

      expect(tree.queryByTestId('ViewBalances')).toBeFalsy()
      expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual('₱10.52')
    }
  )

  it.each([HomeTokenBalance, FiatExchangeTokenBalance])(
    'renders correctly with stale token balance and no positions',
    async (TokenBalanceComponent) => {
      const store = createMockStore({
        tokens: {
          tokenBalances: {
            '0xcelo': {
              name: 'Celo',
              address: '0xcelo',
              symbol: 'CELO',
              balance: '1',
              usdPrice: '0.90',
              priceFetchedAt: Date.now() - ONE_DAY_IN_MILLIS,
              isCoreToken: true,
            },
            '0x048F47d358EC521a6cf384461d674750a3cB58C8': {
              address: '0x048F47d358EC521a6cf384461d674750a3cB58C8',
              symbol: 'TT',
              balance: '10',
            },
          },
        },
        positions: {
          positions: [],
        },
      })

      const tree = render(
        <Provider store={store}>
          <TokenBalanceComponent />
        </Provider>
      )

      expect(tree.queryByTestId('ViewBalances')).toBeTruthy()
      expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual('₱-')
    }
  )

  it.each([HomeTokenBalance, FiatExchangeTokenBalance])(
    'renders correctly with stale token balance and some positions',
    async (TokenBalanceComponent) => {
      const store = createMockStore({
        tokens: {
          tokenBalances: {
            '0xcelo': {
              name: 'Celo',
              address: '0xcelo',
              symbol: 'CELO',
              balance: '1',
              usdPrice: '0.90',
              priceFetchedAt: Date.now() - ONE_DAY_IN_MILLIS,
              isCoreToken: true,
            },
            '0x048F47d358EC521a6cf384461d674750a3cB58C8': {
              address: '0x048F47d358EC521a6cf384461d674750a3cB58C8',
              symbol: 'TT',
              balance: '10',
            },
          },
        },
      })

      const tree = render(
        <Provider store={store}>
          <TokenBalanceComponent />
        </Provider>
      )

      expect(tree.queryByTestId('ViewBalances')).toBeTruthy()
      // Even we have positions, the balance is stale so we show '-'
      expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual('₱-')
    }
  )

  it('renders correctly when fetching the token balances failed and no positions', async () => {
    const store = createMockStore({
      tokens: {
        tokenBalances: {},
        error: true,
      },
      positions: {
        positions: [],
      },
    })

    const tree = render(
      <Provider store={store}>
        <HomeTokenBalance />
      </Provider>
    )

    expect(tree.queryByTestId('ViewBalances')).toBeFalsy()
    expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual('₱-')

    expect(store.getActions()).toMatchInlineSnapshot(`
      [
        {
          "action": {
            "type": "HOME/REFRESH_BALANCES",
          },
          "alertType": "toast",
          "buttonMessage": "outOfSyncBanner.button",
          "dismissAfter": null,
          "displayMethod": 0,
          "message": "outOfSyncBanner.message",
          "title": "outOfSyncBanner.title",
          "type": "ALERT/SHOW",
          "underlyingError": undefined,
        },
      ]
    `)
  })

  it('renders correctly when fetching the token balances failed and some positions', async () => {
    const store = createMockStore({
      tokens: {
        tokenBalances: {},
        error: true,
      },
    })

    const tree = render(
      <Provider store={store}>
        <HomeTokenBalance />
      </Provider>
    )

    expect(tree.queryByTestId('ViewBalances')).toBeFalsy()
    expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual('₱-')

    expect(store.getActions()).toMatchInlineSnapshot(`
      [
        {
          "action": {
            "type": "HOME/REFRESH_BALANCES",
          },
          "alertType": "toast",
          "buttonMessage": "outOfSyncBanner.button",
          "dismissAfter": null,
          "displayMethod": 0,
          "message": "outOfSyncBanner.message",
          "title": "outOfSyncBanner.title",
          "type": "ALERT/SHOW",
          "underlyingError": undefined,
        },
      ]
    `)
  })

  it('renders correctly when fetching the local currency failed and no positions', async () => {
    const store = createMockStore({
      ...defaultStore,
      localCurrency: {
        error: true,
        exchangeRates: {
          [Currency.Dollar]: null,
        },
      },
      positions: {
        positions: [],
      },
    })

    const tree = render(
      <Provider store={store}>
        <HomeTokenBalance />
      </Provider>
    )

    expect(tree.queryByTestId('ViewBalances')).toBeTruthy()
    expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual('₱-')

    expect(store.getActions()).toMatchInlineSnapshot(`
      [
        {
          "action": {
            "type": "HOME/REFRESH_BALANCES",
          },
          "alertType": "toast",
          "buttonMessage": "outOfSyncBanner.button",
          "dismissAfter": null,
          "displayMethod": 0,
          "message": "outOfSyncBanner.message",
          "title": "outOfSyncBanner.title",
          "type": "ALERT/SHOW",
          "underlyingError": undefined,
        },
      ]
    `)
  })

  it('renders correctly when fetching the local currency failed and some positions', async () => {
    const store = createMockStore({
      ...defaultStore,
      localCurrency: {
        error: true,
        exchangeRates: {
          [Currency.Dollar]: null,
        },
      },
    })

    const tree = render(
      <Provider store={store}>
        <HomeTokenBalance />
      </Provider>
    )

    expect(tree.queryByTestId('ViewBalances')).toBeTruthy()
    expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual('₱-')

    expect(store.getActions()).toMatchInlineSnapshot(`
      [
        {
          "action": {
            "type": "HOME/REFRESH_BALANCES",
          },
          "alertType": "toast",
          "buttonMessage": "outOfSyncBanner.button",
          "dismissAfter": null,
          "displayMethod": 0,
          "message": "outOfSyncBanner.message",
          "title": "outOfSyncBanner.title",
          "type": "ALERT/SHOW",
          "underlyingError": undefined,
        },
      ]
    `)
  })
})

describe('AssetsTokenBalance', () => {
  it('should show info on tap', () => {
    const { getByText, getByTestId, queryByText } = render(
      <Provider store={createMockStore()}>
        <AssetsTokenBalance showInfo />
      </Provider>
    )

    expect(getByText('totalAssets')).toBeTruthy()
    expect(getByTestId('TotalTokenBalance')).toHaveTextContent('₱55.74')
    expect(queryByText('totalAssetsInfo')).toBeFalsy()

    fireEvent.press(getByTestId('AssetsTokenBalance/Info'))
    expect(getByText('totalAssetsInfo')).toBeTruthy()
  })
})

import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import {
  AssetsTokenBalance,
  FiatExchangeTokenBalance,
  HomeTokenBalance,
} from 'src/components/TokenBalance'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { navigate, navigateClearingStack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getDynamicConfigParams, getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { NetworkId } from 'src/transactions/types'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'
import { createMockStore, getElementText } from 'test/utils'
import { mockPositions, mockTokenBalances } from 'test/values'

jest.mock('src/statsig')

jest.mock('src/web3/networkConfig', () => {
  const originalModule = jest.requireActual('src/web3/networkConfig')
  return {
    __esModule: true,
    ...originalModule,
    default: {
      ...originalModule.default,
      networkToNetworkId: {
        celo: 'celo-alfajores',
        ethereum: 'ethereuim-sepolia',
      },
      defaultNetworkId: 'celo-alfajores',
    },
  }
})

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
    usdToLocalRate: '1',
  },
}

jest.mocked(getDynamicConfigParams).mockReturnValue({
  showBalances: [NetworkId['celo-alfajores']],
})

// Behavior specific to AssetsTokenBalance
describe('AssetsTokenBalance', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(getFeatureGate).mockReturnValue(true)
  })

  it('should show info on tap', () => {
    const { getByText, getByTestId, queryByText, queryByTestId } = render(
      <Provider store={createMockStore()}>
        <AssetsTokenBalance showInfo isWalletTab={false} />
      </Provider>
    )

    expect(getByText('totalAssets')).toBeTruthy()
    expect(getByTestId('TotalTokenBalance')).toHaveTextContent('₱55.74')
    expect(queryByText('totalAssetsInfo')).toBeFalsy()
    expect(queryByTestId('EyeIcon')).toBeFalsy()

    fireEvent.press(getByTestId('AssetsTokenBalance/Info'))
    expect(getByText('totalAssetsInfo')).toBeTruthy()
  })

  it('should show appropriate title on wallet tab', () => {
    const { getByText, getByTestId, queryByText } = render(
      <Provider store={createMockStore()}>
        <AssetsTokenBalance showInfo={false} isWalletTab={true} />
      </Provider>
    )

    expect(getByTestId('EyeIcon')).toBeTruthy()
    expect(getByText('bottomTabsNavigator.wallet.title')).toBeTruthy()
    expect(getByTestId('TotalTokenBalance')).toHaveTextContent('₱55.74')
    expect(queryByText('AssetsTokenBalance/Info')).toBeFalsy()
  })
})

// Behavior specific to FiatExchangeTokenBalance
describe('FiatExchangeTokenBalance', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(getFeatureGate).mockReturnValue(true)
  })

  it('renders correctly with zero token balance and zero positions', () => {
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
        <FiatExchangeTokenBalance />
      </Provider>
    )

    expect(tree.queryByTestId('ViewBalances')).toBeFalsy()
    expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual('$0.00')
  })

  it('renders correctly with zero balance and some positions', () => {
    const store = createMockStore({
      ...defaultStore,
      tokens: {
        tokenBalances: {},
      },
    })

    const tree = render(
      <Provider store={store}>
        <FiatExchangeTokenBalance />
      </Provider>
    )

    expect(tree.queryByTestId('ViewBalances')).toBeFalsy()
    expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual('$7.91')
  })

  it('renders correctly with one token balance and some positions', () => {
    const store = createMockStore(defaultStore)

    const tree = render(
      <Provider store={store}>
        <FiatExchangeTokenBalance />
      </Provider>
    )

    expect(tree.queryByTestId('ViewBalances')).toBeFalsy()
    expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual('$8.41')
  })

  it('navigates to wallet tab if tab navigator gate is true', () => {
    const store = createMockStore({
      ...defaultStore,
      tokens: {
        // FiatExchangeTokenBalance requires 2 balances to display the View Balances button
        tokenBalances: {
          'celo-alfajores:0x00400FcbF0816bebB94654259de7273f4A05c762': {
            priceUsd: '0.1',
            tokenId: 'celo-alfajores:0x00400FcbF0816bebB94654259de7273f4A05c762',
            address: '0x00400FcbF0816bebB94654259de7273f4A05c762',
            networkId: NetworkId['celo-alfajores'],
            symbol: 'POOF',
            balance: '5',
            priceFetchedAt: Date.now(),
          },
          'celo-alfajores:0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F': {
            priceUsd: '1.16',
            address: '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
            tokenId: 'celo-alfajores:0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
            networkId: NetworkId['celo-alfajores'],
            symbol: 'cEUR',
            balance: '7',
            priceFetchedAt: Date.now(),
          },
        },
      },
    })

    const tree = render(
      <Provider store={store}>
        <FiatExchangeTokenBalance />
      </Provider>
    )

    fireEvent.press(tree.getByTestId('ViewBalances'))
    expect(navigateClearingStack).toHaveBeenCalledWith(Screens.TabNavigator, {
      initialScreen: Screens.TabWallet,
    })
  })
})

// Behavior specific to HomeTokenBalance
describe('HomeTokenBalance', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(getFeatureGate).mockReturnValue(true)
  })

  it('renders correctly with zero token balance and zero positions', () => {
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
        <HomeTokenBalance />
      </Provider>
    )

    expect(tree.queryByTestId('ViewBalances')).toBeTruthy()
    expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual('$0.00')
  })

  it('renders correctly with zero balance and some positions', () => {
    const store = createMockStore({
      ...defaultStore,
      tokens: {
        tokenBalances: {},
      },
    })

    const tree = render(
      <Provider store={store}>
        <HomeTokenBalance />
      </Provider>
    )

    expect(tree.queryByTestId('ViewBalances')).toBeTruthy()
    expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual('$7.91')
  })

  it('renders correctly with one token balance and some positions', () => {
    const store = createMockStore(defaultStore)

    const tree = render(
      <Provider store={store}>
        <HomeTokenBalance />
      </Provider>
    )

    expect(tree.queryByTestId('ViewBalances')).toBeTruthy()
    expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual('$8.41')
  })

  it('renders correctly with one token balance and zero positions', () => {
    const store = createMockStore({
      ...defaultStore,
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
    expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual('$0.50')
  })

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

  it('renders correctly when fetching the local currency failed and no positions', async () => {
    const store = createMockStore({
      ...defaultStore,
      localCurrency: {
        error: true,
        usdToLocalRate: null,
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
        usdToLocalRate: null,
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

  it('renders correctly when hideBalance is true', async () => {
    const store = createMockStore({ ...defaultStore, app: { hideBalances: true } })

    const tree = render(
      <Provider store={store}>
        <HomeTokenBalance />
      </Provider>
    )

    expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual('XX.XX')
    expect(tree.getByTestId('HiddenEyeIcon')).toBeTruthy()
  })

  it('renders correctly when hideBalance is false', async () => {
    const store = createMockStore(defaultStore)

    const tree = render(
      <Provider store={store}>
        <HomeTokenBalance />
      </Provider>
    )

    expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual('$8.41')
    expect(tree.getByTestId('EyeIcon')).toBeTruthy()
  })

  it('tracks analytics event when eye icon is pressed', async () => {
    const store = createMockStore(defaultStore)

    const tree = render(
      <Provider store={store}>
        <HomeTokenBalance />
      </Provider>
    )
    fireEvent.press(tree.getByTestId('EyeIcon'))
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(HomeEvents.hide_balances)
  })
})

// Behavior that is common to both HomeTokenBalance and FiatExchangeTokenBalance
describe.each([
  { name: 'HomeTokenBalance', component: HomeTokenBalance },
  { name: 'FiatExchangeTokenBalance', component: FiatExchangeTokenBalance },
])('$name', ({ component: TokenBalanceComponent }) => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest
      .mocked(getFeatureGate)
      .mockImplementation((gate) => gate === StatsigFeatureGates.SHOW_POSITIONS)
  })

  it('renders correctly with multiple token balances and positions', async () => {
    const store = createMockStore({
      ...defaultStore,
      tokens: {
        tokenBalances: {
          'celo-alfajores:0x00400FcbF0816bebB94654259de7273f4A05c762': {
            priceUsd: '0.1',
            tokenId: 'celo-alfajores:0x00400FcbF0816bebB94654259de7273f4A05c762',
            address: '0x00400FcbF0816bebB94654259de7273f4A05c762',
            networkId: NetworkId['celo-alfajores'],
            symbol: 'POOF',
            balance: '5',
            priceFetchedAt: Date.now(),
          },
          'celo-alfajores:0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F': {
            priceUsd: '1.16',
            tokenId: 'celo-alfajores:0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
            address: '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
            networkId: NetworkId['celo-alfajores'],
            symbol: 'cEUR',
            balance: '7',
            priceFetchedAt: Date.now(),
          },
          'celo-alfajores:0x048F47d358EC521a6cf384461d674750a3cB58C8': {
            address: '0x048F47d358EC521a6cf384461d674750a3cB58C8',
            tokenId: 'celo-alfajores:0x048F47d358EC521a6cf384461d674750a3cB58C8',
            networkId: NetworkId['celo-alfajores'],
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
  })

  it('navigates to Assets screen on View Balances tap', async () => {
    // Tests use_tab_navigator=false case for FiatExchangeTokenBalance, true
    // case is specific to FiatExchangeTokenBalance since HomeTokenBalance is
    // never used in the tab navigator
    const store = createMockStore({
      ...defaultStore,
      tokens: {
        // FiatExchangeTokenBalance requires 2 balances to display the View Balances button
        tokenBalances: {
          'celo-alfajores:0x00400FcbF0816bebB94654259de7273f4A05c762': {
            priceUsd: '0.1',
            tokenId: 'celo-alfajores:0x00400FcbF0816bebB94654259de7273f4A05c762',
            address: '0x00400FcbF0816bebB94654259de7273f4A05c762',
            networkId: NetworkId['celo-alfajores'],
            symbol: 'POOF',
            balance: '5',
            priceFetchedAt: Date.now(),
          },
          'celo-alfajores:0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F': {
            priceUsd: '1.16',
            address: '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
            tokenId: 'celo-alfajores:0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
            networkId: NetworkId['celo-alfajores'],
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
    expect(navigate).toHaveBeenCalledWith(Screens.Assets)
  })

  it('renders correctly with one token balance and another token without priceUsd with balance and zero positions', async () => {
    const store = createMockStore({
      ...defaultStore,
      tokens: {
        tokenBalances: {
          'celo-alfajores:0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F': {
            priceUsd: '1.16',
            address: '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
            tokenId: 'celo-alfajores:0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
            networkId: NetworkId['celo-alfajores'],
            symbol: 'cEUR',
            balance: '7',
            priceFetchedAt: Date.now(),
          },
          'celo-alfajores:0x048F47d358EC521a6cf384461d674750a3cB58C8': {
            address: '0x048F47d358EC521a6cf384461d674750a3cB58C8',
            tokenId: 'celo-alfajores:0x048F47d358EC521a6cf384461d674750a3cB58C8',
            networkId: NetworkId['celo-alfajores'],
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
  })

  it('renders correctly with one token balance and another token without priceUsd with balance and some positions', async () => {
    const store = createMockStore({
      ...defaultStore,
      tokens: {
        tokenBalances: {
          'celo-alfajores:0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F': {
            priceUsd: '1.16',
            address: '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
            tokenId: 'celo-alfajores:0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
            networkId: NetworkId['celo-alfajores'],
            symbol: 'cEUR',
            balance: '7',
            priceFetchedAt: Date.now(),
          },
          'celo-alfajores:0x048F47d358EC521a6cf384461d674750a3cB58C8': {
            address: '0x048F47d358EC521a6cf384461d674750a3cB58C8',
            tokenId: 'celo-alfajores:0x048F47d358EC521a6cf384461d674750a3cB58C8',
            networkId: NetworkId['celo-alfajores'],
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
  })

  it('renders correctly with stale token balance and no positions', async () => {
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          'celo-alfajores:native': {
            tokenId: 'celo-alfajores:native',
            name: 'Celo',
            address: '0xcelo',
            networkId: NetworkId['celo-alfajores'],
            symbol: 'CELO',
            balance: '1',
            priceUsd: '0.90',
            priceFetchedAt: Date.now() - ONE_DAY_IN_MILLIS,
            isFeeCurrency: true,
          },
          'celo-alfajores:0x048F47d358EC521a6cf384461d674750a3cB58C8': {
            address: '0x048F47d358EC521a6cf384461d674750a3cB58C8',
            tokenId: 'celo-alfajores:0x048F47d358EC521a6cf384461d674750a3cB58C8',
            networkId: NetworkId['celo-alfajores'],
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
  })

  it('renders correctly with stale token balance and some positions', async () => {
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          'celo-alfajores:native': {
            tokenId: 'celo-alfajores:native',
            name: 'Celo',
            address: '0xcelo',
            networkId: NetworkId['celo-alfajores'],
            symbol: 'CELO',
            balance: '1',
            priceUsd: '0.90',
            priceFetchedAt: Date.now() - ONE_DAY_IN_MILLIS,
            isFeeCurrency: true,
          },
          'celo-alfajores:0x048F47d358EC521a6cf384461d674750a3cB58C8': {
            address: '0x048F47d358EC521a6cf384461d674750a3cB58C8',
            tokenId: 'celo-alfajores:0x048F47d358EC521a6cf384461d674750a3cB58C8',
            networkId: NetworkId['celo-alfajores'],
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
  })
})

import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { hideAlert } from 'src/alert/actions'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { toggleHideBalances } from 'src/app/actions'
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
import {
  mockCeurTokenId,
  mockEthTokenId,
  mockPoofTokenId,
  mockPositions,
  mockTokenBalances,
} from 'test/values'

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
    tokenBalances: mockTokenBalances, // only one token has non-zero balance, total value is $0.50
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
const noPositions = {
  positions: {
    positions: [],
  },
}
const noTokens = {
  tokens: {
    tokenBalances: {},
  },
}
const multipleTokens = {
  tokens: {
    tokenBalances: {
      [mockCeurTokenId]: {
        ...mockTokenBalances[mockCeurTokenId],
        balance: '7',
      },
      [mockEthTokenId]: {
        ...mockTokenBalances[mockEthTokenId],
        balance: '1.1',
      },
      [mockPoofTokenId]: {
        ...mockTokenBalances[mockPoofTokenId],
        balance: '5',
        priceUsd: undefined,
      },
    },
  },
}
const staleTokens = {
  tokens: {
    tokenBalances: {
      [mockCeurTokenId]: {
        ...mockTokenBalances[mockCeurTokenId],
        priceFetchedAt: Date.now() - ONE_DAY_IN_MILLIS,
        balance: '5',
      },
      [mockEthTokenId]: {
        ...mockTokenBalances[mockEthTokenId],
        priceFetchedAt: Date.now() - ONE_DAY_IN_MILLIS,
        balance: '5',
      },
    },
  },
}

jest.mocked(getDynamicConfigParams).mockReturnValue({
  showBalances: [
    NetworkId['ethereum-sepolia'],
    NetworkId['celo-alfajores'],
    NetworkId['arbitrum-sepolia'],
    NetworkId['op-sepolia'],
  ],
})

// Behavior specific to AssetsTokenBalance
describe('AssetsTokenBalance', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(getFeatureGate).mockReturnValue(true)
  })

  it.each([
    {
      testName: 'zero token balance and zero positions',
      storeOverrides: {
        ...noTokens,
        ...noPositions,
      },
      expectedTotal: '$0.00',
    },
    {
      testName: 'zero token balance and some positions',
      storeOverrides: {
        ...noTokens,
      },
      expectedTotal: '$7.91',
    },
    {
      testName: 'one token balance and some positions',
      storeOverrides: {},
      expectedTotal: '$8.41',
    },
    {
      testName: 'one token balance and zero positions',
      storeOverrides: {
        ...noPositions,
      },
      expectedTotal: '$0.50',
    },
    {
      testName: 'multiple token balances (some with no price) and positions',
      storeOverrides: {
        ...multipleTokens,
      },
      expectedTotal: '$1,666.03',
    },
    {
      testName: 'stale token balance and positions',
      storeOverrides: {
        ...staleTokens,
      },
      expectedTotal: '$-',
    },
  ])('renders correctly with $testName', ({ storeOverrides, expectedTotal }) => {
    const store = createMockStore({
      ...defaultStore,
      ...storeOverrides,
    })

    const tree = render(
      <Provider store={store}>
        <AssetsTokenBalance showInfo={false} isWalletTab />
      </Provider>
    )

    expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual(expectedTotal)
  })

  it.each([
    {
      testName: 'fetching the token balances failed and no positions',
      storeOverrides: {
        tokens: {
          tokenBalances: {},
          error: true,
        },
        ...noPositions,
      },
    },
    {
      testName: 'fetching the token balances failed and some positions',
      storeOverrides: {
        tokens: {
          tokenBalances: {},
          error: true,
        },
      },
    },
    {
      testName: 'fetching the local currency failed and no positions',
      storeOverrides: {
        ...defaultStore,
        localCurrency: {
          error: true,
          usdToLocalRate: null,
        },
        ...noPositions,
      },
    },
    {
      testName: 'fetching the local currency failed and some positions',
      storeOverrides: {
        ...defaultStore,
        localCurrency: {
          error: true,
          usdToLocalRate: null,
        },
      },
    },
  ])('renders error banner when $testName', ({ storeOverrides }) => {
    const store = createMockStore(storeOverrides)

    render(
      <Provider store={store}>
        <AssetsTokenBalance isWalletTab showInfo={false} />
      </Provider>
    )

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

  it('renders correctly when hideBalance is true and dispatches action on icon press', async () => {
    const store = createMockStore({ ...defaultStore, app: { hideBalances: true } })

    const tree = render(
      <Provider store={store}>
        <AssetsTokenBalance showInfo={false} isWalletTab={true} />
      </Provider>
    )

    expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual('XX.XX')
    expect(tree.getByTestId('HiddenEyeIcon')).toBeTruthy()
    fireEvent.press(tree.getByTestId('HiddenEyeIcon'))
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(HomeEvents.show_balances)
    expect(store.getActions()).toEqual([hideAlert(), toggleHideBalances()])
  })

  it('renders correctly when hideBalance is false and dispatches action on icon press', async () => {
    const store = createMockStore(defaultStore)

    const tree = render(
      <Provider store={store}>
        <AssetsTokenBalance showInfo={false} isWalletTab={true} />
      </Provider>
    )

    expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual('$8.41')
    expect(tree.getByTestId('EyeIcon')).toBeTruthy()
    fireEvent.press(tree.getByTestId('EyeIcon'))
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(HomeEvents.hide_balances)
    expect(store.getActions()).toEqual([hideAlert(), toggleHideBalances()])
  })
})

// Behavior specific to FiatExchangeTokenBalance
describe('FiatExchangeTokenBalance', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(getFeatureGate).mockReturnValue(true)
  })

  it.each([
    {
      testName: 'zero token balance and zero positions',
      storeOverrides: {
        ...noTokens,
        ...noPositions,
      },
      expectedTotal: '$0.00',
    },
    {
      testName: 'zero token balance and some positions',
      storeOverrides: {
        ...noTokens,
      },
      expectedTotal: '$7.91',
    },
    {
      testName: 'one token balance and some positions',
      storeOverrides: {},
      expectedTotal: '$8.41',
    },
  ])('renders correctly with $testName', ({ storeOverrides, expectedTotal }) => {
    const store = createMockStore({
      ...defaultStore,
      ...storeOverrides,
    })

    const tree = render(
      <Provider store={store}>
        <FiatExchangeTokenBalance />
      </Provider>
    )

    expect(tree.queryByTestId('ViewBalances')).toBeFalsy()
    expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual(expectedTotal)
  })

  it('includes token icon with one token balance and zero positions', () => {
    const store = createMockStore({
      ...defaultStore,
      ...noPositions,
    })

    const tree = render(
      <Provider store={store}>
        <FiatExchangeTokenBalance />
      </Provider>
    )

    expect(tree.queryByTestId('ViewBalances')).toBeFalsy()
    expect(tree.getByTestId('TokenIcon')).toBeTruthy()
    expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual('$0.50')
  })

  it('renders correctly with multiple token balances and positions and navigates to wallet tab if tab navigator gate is true', () => {
    const store = createMockStore({
      ...defaultStore,
      ...multipleTokens,
    })

    const tree = render(
      <Provider store={store}>
        <FiatExchangeTokenBalance />
      </Provider>
    )

    expect(tree.getByTestId('ViewBalances')).toBeTruthy()
    expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual('$1,666.03')
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
      ...multipleTokens,
    })

    const tree = render(
      <Provider store={store}>
        <TokenBalanceComponent />
      </Provider>
    )

    expect(tree.queryByTestId('ViewBalances')).toBeTruthy()
    expect(getElementText(tree.getByTestId('TotalTokenBalance'))).toEqual('$1,666.03')
  })

  it('navigates to Assets screen on View Balances tap', async () => {
    // Tests use_tab_navigator=false case for FiatExchangeTokenBalance, true
    // case is specific to FiatExchangeTokenBalance since HomeTokenBalance is
    // never used in the tab navigator
    const store = createMockStore({
      ...defaultStore,
      ...multipleTokens,
    })

    const { getByTestId } = render(
      <Provider store={store}>
        <TokenBalanceComponent />
      </Provider>
    )

    fireEvent.press(getByTestId('ViewBalances'))
    expect(navigate).toHaveBeenCalledWith(Screens.Assets)
  })

  it('renders correctly with stale token balance and some positions', async () => {
    const store = createMockStore(staleTokens)

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

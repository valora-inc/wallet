import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import { FetchMock } from 'jest-fetch-mock/types'
import * as React from 'react'
import { Provider } from 'react-redux'
import { notificationSpotlightSeen } from 'src/app/actions'
import { dappSelected } from 'src/dapps/slice'
import { Dapp, DappSection } from 'src/dapps/types'
import { fetchProviders } from 'src/fiatExchanges/utils'
import WalletHome from 'src/home/WalletHome'
import { Actions as IdentityActions } from 'src/identity/actions'
import { RootState } from 'src/redux/reducers'
import { getExperimentParams, getFeatureGate } from 'src/statsig'
import { NetworkId } from 'src/transactions/types'
import { RecursivePartial, createMockStore } from 'test/utils'
import {
  mockCeloAddress,
  mockCeloTokenId,
  mockCeurAddress,
  mockCeurTokenId,
  mockCusdAddress,
  mockCusdTokenId,
  mockProviders,
} from 'test/values'

jest.mock('src/web3/networkConfig', () => {
  const originalModule = jest.requireActual('src/web3/networkConfig')
  return {
    ...originalModule,
    __esModule: true,
    default: {
      ...originalModule.default,
      defaultNetworkId: 'celo-alfajores',
    },
  }
})

const mockBalances = {
  tokens: {
    tokenBalances: {
      [mockCusdTokenId]: {
        address: mockCusdAddress,
        tokenId: mockCusdTokenId,
        networkId: NetworkId['celo-alfajores'],
        symbol: 'cUSD',
        decimals: 18,
        balance: '1',
        isFeeCurrency: true,
        priceUsd: '1',
        priceFetchedAt: Date.now(),
      },
      [mockCeurTokenId]: {
        address: mockCeurAddress,
        tokenId: mockCeurTokenId,
        networkId: NetworkId['celo-alfajores'],
        symbol: 'cEUR',
        decimals: 18,
        balance: '0',
        priceUsd: '1',
        isFeeCurrency: true,
        priceFetchedAt: Date.now(),
      },
    },
  },
}

const zeroBalances = {
  tokens: {
    tokenBalances: {
      [mockCusdTokenId]: {
        address: mockCusdAddress,
        tokenId: mockCusdTokenId,
        networkId: NetworkId['celo-alfajores'],
        symbol: 'cUSD',
        decimals: 18,
        balance: '0',
        isFeeCurrency: true,
      },
      [mockCeurTokenId]: {
        address: mockCeurAddress,
        tokenId: mockCeurTokenId,
        networkId: NetworkId['celo-alfajores'],
        symbol: 'cEUR',
        decimals: 18,
        balance: '0',
        isFeeCurrency: true,
      },
      [mockCeloTokenId]: {
        address: mockCeloAddress,
        tokenId: mockCeloTokenId,
        networkId: NetworkId['celo-alfajores'],
        symbol: 'CELO',
        decimals: 18,
        balance: '0',
        isFeeCurrency: true,
      },
    },
  },
}

// When fetch balance api fails #1527
const emptyBalances = {
  tokens: {
    tokenBalances: {},
  },
}

const dapp: Dapp = {
  name: 'Ubeswap',
  description: 'Swap any token, enter a pool, or farm your crypto',
  dappUrl: 'https://app.ubeswap.org/',
  categories: ['exchanges'],
  iconUrl: 'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/ubeswap.png',
  id: 'ubeswap',
}

const deepLinkedDapp: Dapp = {
  name: 'Moola',
  description: 'Lend, borrow, or add to a pool to earn rewards',
  dappUrl: 'celo://wallet/moolaScreen',
  categories: ['lend'],
  iconUrl: 'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/moola.png',
  id: 'moola',
}

const recentDappIds = [dapp.id, deepLinkedDapp.id]

jest.mock('src/statsig', () => ({
  getExperimentParams: jest.fn(() => ({
    cashInBottomSheetEnabled: true,
  })),
  getFeatureGate: jest.fn().mockReturnValue(false),
  getDynamicConfigParams: jest.fn(() => ({
    showBalances: ['celo-alfajores'],
    showTransfers: ['celo-alfajores'],
  })),
}))

jest.mock('src/fiatExchanges/utils', () => ({
  ...(jest.requireActual('src/fiatExchanges/utils') as any),
  fetchProviders: jest.fn(),
}))

describe('WalletHome', () => {
  const mockFetch = fetch as FetchMock

  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(getFeatureGate).mockReturnValue(false)
    mockFetch.mockResponse(
      JSON.stringify({
        data: {
          tokenTransactionsV2: {
            transactions: [],
          },
        },
      })
    )
  })

  function renderScreen(storeOverrides: RecursivePartial<RootState> = {}) {
    const store = createMockStore({
      ...mockBalances,
      ...storeOverrides,
    })

    const tree = render(
      <Provider store={store}>
        <WalletHome />
      </Provider>
    )

    return {
      store,
      tree,
      ...tree,
    }
  }

  it('Renders correctly and fires initial actions', async () => {
    const { store, tree } = renderScreen({
      app: {
        phoneNumberVerified: true,
      },
      recipients: {
        phoneRecipientCache: {},
      },
    })

    await act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(tree.getByTestId('start_supercharging')).toBeTruthy()
    expect(tree.getByTestId('HomeTokenBalance')).toBeTruthy()
    expect(tree.queryByTestId('cashInBtn')).toBeFalsy()
    expect(tree.queryByTestId('HomeActionsCarousel')).toBeTruthy()
    expect(tree.queryByTestId('WalletHome/QRScanButton')).toBeTruthy()
    expect(tree.queryByTestId('WalletHome/Logo')).toBeFalsy()
    expect(store.getActions()).toMatchInlineSnapshot(`
      [
        {
          "type": "ALERT/HIDE",
        },
        {
          "payload": undefined,
          "type": "supercharge/fetchAvailableRewards",
        },
        {
          "type": "HOME/VISIT_HOME",
        },
        {
          "type": "SENTRY/INITIALIZE_SENTRY_USER_CONTEXT",
        },
        {
          "action": null,
          "alertType": "message",
          "buttonMessage": null,
          "dismissAfter": 5000,
          "displayMethod": 0,
          "message": "testnetAlert.1, {"testnet":"Alfajores"}",
          "title": "testnetAlert.0, {"testnet":"Alfajores"}",
          "type": "ALERT/SHOW",
          "underlyingError": undefined,
        },
        {
          "type": "HOME/REFRESH_BALANCES",
        },
        {
          "type": "IDENTITY/IMPORT_CONTACTS",
        },
      ]
    `)
  })

  it('hides sections', async () => {
    jest.mocked(getExperimentParams).mockReturnValueOnce({
      cashInBottomSheetEnabled: false,
    })

    const { queryByTestId } = renderScreen({ ...zeroBalances })
    expect(queryByTestId('SendOrRequestBar')).toBeFalsy()
    expect(queryByTestId('cashInBtn')).toBeFalsy()
  })

  it("doesn't import contacts if number isn't verified", async () => {
    const { store } = renderScreen({
      app: {
        phoneNumberVerified: false,
      },
      recipients: {
        phoneRecipientCache: {},
      },
    })

    await act(() => {
      jest.runOnlyPendingTimers()
    })

    const importContactsAction = store
      .getActions()
      .find((action) => action.type === IdentityActions.IMPORT_CONTACTS)
    expect(importContactsAction).toBeFalsy()
  })

  it('Renders balances in home if feature flag is enabled', async () => {
    const { getByTestId } = renderScreen()

    expect(getByTestId('HomeTokenBalance')).toBeTruthy()
  })

  it('Renders cash in bottom sheet when experiment flag is turned on and balances are zero', async () => {
    jest.mocked(fetchProviders).mockResolvedValueOnce(mockProviders)
    const { getByTestId } = renderScreen({
      ...zeroBalances,
    })

    await act(() => {
      jest.runOnlyPendingTimers()
    })
    await waitFor(() => expect(getByTestId('cashInBtn')).toBeTruthy())
  })

  it('Does not render cash in bottom sheet when experiment flag is turned on but balances are not zero', async () => {
    const { queryByTestId } = renderScreen()

    expect(queryByTestId('cashInBtn')).toBeFalsy()
  })

  it('Does not render cash in bottom sheet when experiment flag is turned on but balances are empty', async () => {
    const { queryByTestId } = renderScreen({
      ...emptyBalances,
    })

    expect(queryByTestId('cashInBtn')).toBeFalsy()
  })

  it('shows beta tag when feature gate set to true', async () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
    const { getByTestId } = renderScreen()
    expect(getByTestId('BetaTag')).toBeTruthy()
  })

  it('does not show beta tag when feature gate set to false', async () => {
    const { queryByTestId } = renderScreen()
    expect(queryByTestId('BetaTag')).toBeFalsy()
  })

  describe('recently used dapps', () => {
    const store = createMockStore({
      dapps: {
        dappsList: [dapp, deepLinkedDapp],
        recentDappIds,
        maxNumRecentDapps: 4,
      },
    })
    const scrollEvent = {
      nativeEvent: {
        contentOffset: { y: 500 },
        // Dimensions of the scrollable content
        contentSize: { height: 500, width: 100 },
        // Dimensions of the device
        layoutMeasurement: { height: 100, width: 100 },
      },
    }

    beforeEach(() => {
      store.clearActions()
    })

    it('should open the recently used dapp', async () => {
      const { getAllByTestId, getByTestId } = render(
        <Provider store={store}>
          <WalletHome />
        </Provider>
      )

      const scrollView = getByTestId('WalletHome/SectionList')
      // Scroll needed to make sure the recently used dapps are rendered
      fireEvent.scroll(scrollView, scrollEvent)

      const dapps = await waitFor(() => getAllByTestId('RecentlyUsedDapps/Dapp'))
      expect(dapps).toHaveLength(2)

      fireEvent.press(dapps[0])

      expect(store.getActions()).toEqual(
        expect.arrayContaining([
          dappSelected({ dapp: { ...dapp, openedFrom: DappSection.RecentlyUsed } }),
        ])
      )
    })

    it('should open the dapp directly if it is deep linked', async () => {
      const { getAllByTestId, getByTestId } = render(
        <Provider store={store}>
          <WalletHome />
        </Provider>
      )

      const scrollView = getByTestId('WalletHome/SectionList')
      // Scroll needed to make sure the recently used dapps are rendered
      fireEvent.scroll(scrollView, scrollEvent)

      const dapps = await waitFor(() => getAllByTestId('RecentlyUsedDapps/Dapp'))
      fireEvent.press(dapps[1])

      expect(store.getActions()).toEqual(
        expect.arrayContaining([
          dappSelected({ dapp: { ...deepLinkedDapp, openedFrom: DappSection.RecentlyUsed } }),
        ])
      )
    })
  })

  describe('notification center spotlight', () => {
    beforeEach(() => {
      jest.mocked(getFeatureGate).mockReturnValue(true)
    })

    it('does not display the spotlight if the feature is disabled', () => {
      jest.mocked(getFeatureGate).mockReturnValue(false)
      const { queryByTestId } = renderScreen({
        app: {
          showNotificationSpotlight: true,
        },
      })

      expect(queryByTestId('notificationCenterSpotlight.message')).toBeFalsy()
      expect(queryByTestId('notificationCenterSpotlight.cta')).toBeFalsy()
    })

    it('shows the spotlight if the feature is enabled for an upgrading user', () => {
      const { getByText } = renderScreen({
        app: {
          showNotificationSpotlight: true,
        },
      })

      expect(getByText('notificationCenterSpotlight.message')).toBeTruthy()
      expect(getByText('notificationCenterSpotlight.cta')).toBeTruthy()
    })

    it('can be dismissed correctly', () => {
      const { store, getByText } = renderScreen({
        app: {
          showNotificationSpotlight: true,
        },
      })

      store.clearActions()
      fireEvent.press(getByText('notificationCenterSpotlight.cta'))

      expect(store.getActions()).toEqual([notificationSpotlightSeen()])
    })
  })
  describe('cash in bottom sheet', () => {
    beforeEach(() => {
      jest.mocked(getFeatureGate).mockReturnValue(true)
    })

    it('shows the cash in bottom sheet after the spotlight for an eligible user', async () => {
      jest.mocked(fetchProviders).mockResolvedValueOnce(mockProviders)

      const { getByText, queryByTestId, rerender, getByTestId } = renderScreen({
        ...zeroBalances,
        app: {
          showNotificationSpotlight: true,
        },
      })

      expect(getByText('notificationCenterSpotlight.message')).toBeTruthy()
      expect(queryByTestId('cashInBtn')).toBeFalsy()

      rerender(
        <Provider
          store={createMockStore({
            ...zeroBalances,
            app: {
              showNotificationSpotlight: false,
            },
          })}
        >
          <WalletHome />
        </Provider>
      )

      await act(() => {
        jest.runOnlyPendingTimers()
      })
      await waitFor(() => expect(getByTestId('cashInBtn')).toBeTruthy())
    })

    it('shows the cash in bottom sheet after the nft celebration for an eligible user', async () => {
      jest.mocked(fetchProviders).mockResolvedValueOnce(mockProviders)

      const { queryByTestId, rerender, getByTestId } = renderScreen({
        ...zeroBalances,
        app: {
          showNotificationSpotlight: false,
        },
        home: {
          nftCelebration: {
            displayed: false,
          },
        },
      })

      expect(queryByTestId('cashInBtn')).toBeFalsy()

      rerender(
        <Provider
          store={createMockStore({
            ...zeroBalances,
            app: {
              showNotificationSpotlight: false,
            },
            home: {
              nftCelebration: {
                displayed: true,
              },
            },
          })}
        >
          <WalletHome />
        </Provider>
      )

      await act(() => {
        jest.runOnlyPendingTimers()
      })
      await waitFor(() => expect(getByTestId('cashInBtn')).toBeTruthy())
    })
  })
})

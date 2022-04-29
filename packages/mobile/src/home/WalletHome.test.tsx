import { fireEvent, render } from '@testing-library/react-native'
import { FetchMock } from 'jest-fetch-mock/types'
import * as React from 'react'
import { Provider } from 'react-redux'
import { dappSelected } from 'src/app/actions'
import { DappSection } from 'src/app/reducers'
import WalletHome from 'src/home/WalletHome'
import { Actions as IdentityActions } from 'src/identity/actions'
import { RootState } from 'src/redux/reducers'
import { createMockStore, flushMicrotasksQueue, RecursivePartial } from 'test/utils'
import { mockCeurAddress, mockCusdAddress } from 'test/values'

const mockBalances = {
  tokens: {
    tokenBalances: {
      [mockCusdAddress]: {
        address: mockCusdAddress,
        symbol: 'cUSD',
        decimals: 18,
        balance: '1',
        isCoreToken: true,
      },
      [mockCeurAddress]: {
        address: mockCeurAddress,
        symbol: 'cEUR',
        decimals: 18,
        balance: '0',
        isCoreToken: true,
      },
    },
  },
}

const zeroBalances = {
  tokens: {
    tokenBalances: {
      [mockCusdAddress]: {
        address: mockCusdAddress,
        symbol: 'cUSD',
        decimals: 18,
        balance: '0',
        isCoreToken: true,
      },
      [mockCeurAddress]: {
        address: mockCeurAddress,
        symbol: 'cEUR',
        decimals: 18,
        balance: '0',
        isCoreToken: true,
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

const dapp = {
  name: 'Ubeswap',
  description: 'Swap any token, enter a pool, or farm your crypto',
  dappUrl: 'https://app.ubeswap.org/',
  categoryId: 'exchanges',
  iconUrl: 'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/ubeswap.png',
  isFeatured: false,
  id: 'ubeswap',
}

const deepLinkedDapp = {
  name: 'Moola',
  description: 'Lend, borrow, or add to a pool to earn rewards',
  dappUrl: 'celo://wallet/moolaScreen',
  categoryId: 'lend',
  iconUrl: 'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/moola.png',
  isFeatured: false,
  id: 'moola',
}

const recentDapps = [dapp, deepLinkedDapp]

jest.mock('src/exchange/CeloGoldOverview', () => 'CeloGoldOverview')
jest.mock('src/transactions/TransactionsList', () => 'TransactionsList')

describe('WalletHome', () => {
  const mockFetch = fetch as FetchMock

  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
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
        numberVerified: true,
      },
      recipients: {
        phoneRecipientCache: {},
      },
    })

    jest.runOnlyPendingTimers()
    await flushMicrotasksQueue()

    expect(tree.queryByTestId('startSupercharging')).toBeTruthy()
    expect(tree.queryByTestId('HomeTokenBalance')).toBeTruthy()
    expect(tree.queryByTestId('cashInBtn')).toBeFalsy()
    expect(store.getActions()).toMatchInlineSnapshot(`
      Array [
        Object {
          "payload": undefined,
          "type": "supercharge/fetchAvailableRewards",
        },
        Object {
          "type": "ALERT/HIDE",
        },
        Object {
          "type": "SENTRY/INITIALIZE_SENTRY_USER_CONTEXT",
        },
        Object {
          "action": null,
          "alertType": "message",
          "buttonMessage": null,
          "dismissAfter": 5000,
          "displayMethod": 0,
          "message": "testnetAlert.1, {\\"testnet\\":\\"Alfajores\\"}",
          "title": "testnetAlert.0, {\\"testnet\\":\\"Alfajores\\"}",
          "type": "ALERT/SHOW",
          "underlyingError": undefined,
        },
        Object {
          "type": "HOME/REFRESH_BALANCES",
        },
        Object {
          "doMatchmaking": false,
          "type": "IDENTITY/IMPORT_CONTACTS",
        },
      ]
    `)
  })

  it("doesn't import contacts if number isn't verified", async () => {
    const { store } = renderScreen({
      app: {
        numberVerified: false,
      },
      recipients: {
        phoneRecipientCache: {},
      },
    })

    jest.runOnlyPendingTimers()
    await flushMicrotasksQueue()

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
    const { getByTestId } = renderScreen({
      ...zeroBalances,
      app: {
        cashInButtonExpEnabled: true,
      },
    })

    expect(getByTestId('cashInBtn')).toBeTruthy()
  })

  it('Does not render cash in bottom sheet when experiment flag is turned on but balances are not zero', async () => {
    const { queryByTestId } = renderScreen({
      app: {
        cashInButtonExpEnabled: true,
      },
    })

    expect(queryByTestId('cashInBtn')).toBeFalsy()
  })

  it('Does not render cash in bottom sheet when experiment flag is turned on but balances are empty', async () => {
    const { queryByTestId } = renderScreen({
      ...emptyBalances,
      app: {
        cashInButtonExpEnabled: true,
      },
    })

    expect(queryByTestId('cashInBtn')).toBeFalsy()
  })

  describe('recently used dapps', () => {
    const store = createMockStore({
      app: {
        recentDapps,
        maxNumRecentDapps: 4,
      },
    })

    beforeEach(() => {
      store.clearActions()
    })

    it('should show the open dapp confirmation on press of external dapp', () => {
      const { getAllByTestId, getByText } = render(
        <Provider store={store}>
          <WalletHome />
        </Provider>
      )

      const dapps = getAllByTestId('RecentDapp')
      fireEvent.press(dapps[0])

      expect(dapps).toHaveLength(2)
      expect(getByText(`dappsScreenBottomSheet.title, {"dappName":"${dapp.name}"}`)).toBeTruthy()

      fireEvent.press(getByText(`dappsScreenBottomSheet.button, {"dappName":"${dapp.name}"}`))

      expect(store.getActions()).toEqual(
        expect.arrayContaining([dappSelected({ ...dapp, openedFrom: DappSection.RecentlyUsed })])
      )
    })

    it('should open the dapp directly if it is deep linked', () => {
      const { getAllByTestId, queryByText } = render(
        <Provider store={store}>
          <WalletHome />
        </Provider>
      )

      fireEvent.press(getAllByTestId('RecentDapp')[1])

      expect(
        queryByText(`dappsScreenBottomSheet.title, {"dappName":"${deepLinkedDapp.name}"}`)
      ).toBeFalsy()
      expect(store.getActions()).toEqual(
        expect.arrayContaining([
          dappSelected({ ...deepLinkedDapp, openedFrom: DappSection.RecentlyUsed }),
        ])
      )
    })
  })
})

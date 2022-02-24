import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { act } from 'react-test-renderer'
import { dappSelected } from 'src/app/actions'
import WalletHome from 'src/home/WalletHome'
import { Actions as IdentityActions } from 'src/identity/actions'
import { RootState } from 'src/redux/reducers'
import { Currency } from 'src/utils/currencies'
import { createMockStore, RecursivePartial } from 'test/utils'

const balances = {
  stableToken: {
    balances: {
      [Currency.Dollar]: '20.02',
      [Currency.Euro]: '10',
    },
  },
  goldToken: {
    balance: '20',
  },
}

const zeroBalances = {
  stableToken: {
    balances: {
      [Currency.Dollar]: '0',
      [Currency.Euro]: '0',
    },
  },
  goldToken: {
    balance: '0',
  },
}

// When fetch balance api fails #1527
const undefinedBalances = {
  stableToken: {
    balances: {
      [Currency.Dollar]: undefined,
      [Currency.Euro]: undefined,
    },
  },
  goldToken: {
    balance: undefined,
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
  beforeAll(() => {
    jest.useFakeTimers()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  function renderScreen(storeOverrides: RecursivePartial<RootState> = {}) {
    const store = createMockStore(storeOverrides)

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
      ...balances,
      app: {
        numberVerified: true,
      },
      recipients: {
        phoneRecipientCache: {},
      },
    })

    jest.runAllTimers()

    expect(tree).toMatchSnapshot()
    expect(tree.queryByTestId('HomeTokenBalance')).toBeFalsy()
    expect(tree.queryByTestId('cashInBtn')).toBeFalsy()
    expect(store.getActions()).toMatchInlineSnapshot(`
      Array [
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
      ...balances,
      app: {
        numberVerified: false,
      },
      recipients: {
        phoneRecipientCache: {},
      },
    })

    jest.runAllTimers()

    const importContactsAction = store
      .getActions()
      .find((action) => action.type === IdentityActions.IMPORT_CONTACTS)
    expect(importContactsAction).toBeFalsy()
  })

  it('Renders balances in home if feature flag is enabled', async () => {
    const { getByTestId } = renderScreen({
      ...balances,
      app: {
        multiTokenShowHomeBalances: true,
      },
    })

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
      ...balances,
      app: {
        cashInButtonExpEnabled: true,
      },
    })

    expect(queryByTestId('cashInBtn')).toBeFalsy()
  })

  it('Does not render cash in bottom sheet when experiment flag is turned on but balances are undefined', async () => {
    const { queryByTestId } = renderScreen({
      ...undefinedBalances,
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

      expect(dapps).toHaveLength(2)

      act(() => {
        fireEvent.press(dapps[0])
      })

      expect(getByText(`dappsScreenBottomSheet.title, {"dappName":"${dapp.name}"}`)).toBeTruthy()

      act(() => {
        fireEvent.press(getByText(`dappsScreenBottomSheet.button, {"dappName":"${dapp.name}"}`))
      })

      expect(store.getActions()).toEqual(expect.arrayContaining([dappSelected(dapp)]))
    })

    it('should open the dapp directly if it is deep linked', () => {
      const { getAllByTestId, queryByText } = render(
        <Provider store={store}>
          <WalletHome />
        </Provider>
      )

      act(() => {
        fireEvent.press(getAllByTestId('RecentDapp')[1])
      })

      expect(
        queryByText(`dappsScreenBottomSheet.title, {"dappName":"${deepLinkedDapp.name}"}`)
      ).toBeFalsy()
      expect(store.getActions()).toEqual(expect.arrayContaining([dappSelected(deepLinkedDapp)]))
    })
  })
})

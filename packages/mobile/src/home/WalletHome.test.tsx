import { render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import WalletHome from 'src/home/WalletHome'
import { RootState } from 'src/redux/reducers'
import { Currency } from 'src/utils/currencies'
import { createMockStore, RecursivePartial } from 'test/utils'

const TWO_DAYS_MS = 2 * 24 * 60 * 1000

const storeData = {
  goldToken: { educationCompleted: true },
  account: {
    backupCompleted: true,
    dismissedInviteFriends: true,
    accountCreationTime: new Date().getTime() - TWO_DAYS_MS,
    paymentRequests: [],
  },
}

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

jest.mock('src/exchange/CeloGoldOverview')
jest.mock('src/transactions/TransactionsList')

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

  it('doesnt render cash in bottom sheet when experiment flag is turned on but balances are not zero', async () => {
    const { queryByTestId } = renderScreen({
      ...balances,
      app: {
        cashInButtonExpEnabled: true,
      },
    })

    expect(queryByTestId('cashInBtn')).toBeFalsy()
  })
})

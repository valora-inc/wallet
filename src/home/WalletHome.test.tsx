import { fireEvent, render } from '@testing-library/react-native'
import { FetchMock } from 'jest-fetch-mock/types'
import * as React from 'react'
import { Provider } from 'react-redux'
import { dappSelected } from 'src/dapps/slice'
import { DappSection } from 'src/dapps/types'
import WalletHome from 'src/home/WalletHome'
import { Actions as IdentityActions } from 'src/identity/actions'
import { RootState } from 'src/redux/reducers'
import { getExperimentParams } from 'src/statsig'
import { createMockStore, flushMicrotasksQueue, RecursivePartial } from 'test/utils'
import { mockCeurAddress, mockCusdAddress } from 'test/values'
import { mocked } from 'ts-jest/utils'

const mockBalances = {
  tokens: {
    tokenBalances: {
      [mockCusdAddress]: {
        address: mockCusdAddress,
        symbol: 'cUSD',
        decimals: 18,
        balance: '1',
        isCoreToken: true,
        usdPrice: '1',
        priceFetchedAt: Date.now(),
      },
      [mockCeurAddress]: {
        address: mockCeurAddress,
        symbol: 'cEUR',
        decimals: 18,
        balance: '0',
        usdPrice: '1',
        isCoreToken: true,
        priceFetchedAt: Date.now(),
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

const recentDappIds = [dapp.id, deepLinkedDapp.id]

jest.mock('src/statsig', () => ({
  getExperimentParams: jest.fn(() => ({
    showHomeNavBar: true,
    showHomeActions: false,
    cashInBottomSheetEnabled: true,
  })),
}))
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
          "type": "HOME/VISIT_HOME",
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
          "type": "IDENTITY/IMPORT_CONTACTS",
        },
      ]
    `)
  })

  it('hides sections', async () => {
    mocked(getExperimentParams)
      .mockReturnValueOnce({
        showHomeNavBar: false,
        showHomeActions: false,
      })
      .mockReturnValueOnce({
        cashInBottomSheetEnabled: false,
      })

    const { queryByTestId } = renderScreen({ ...zeroBalances })
    expect(queryByTestId('SendOrRequestBar')).toBeFalsy()
    expect(queryByTestId('cashInBtn')).toBeFalsy()
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
    })

    expect(getByTestId('cashInBtn')).toBeTruthy()
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

  it('Does not render actions when experiment flag is off', () => {
    const { queryByTestId } = renderScreen()

    expect(queryByTestId('HomeActionsCarousel')).toBeFalsy()
  })

  it('Renders actions when experiment flag is on', () => {
    mocked(getExperimentParams).mockReturnValueOnce({
      showHomeNavBar: true,
      showHomeActions: true,
    })

    const { queryByTestId } = renderScreen()

    expect(queryByTestId('HomeActionsCarousel')).toBeTruthy()
  })

  describe('recently used dapps', () => {
    const store = createMockStore({
      dapps: {
        dappsList: [dapp, deepLinkedDapp],
        recentDappIds,
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

      const dapps = getAllByTestId('RecentlyUsedDapps/Dapp')
      fireEvent.press(dapps[0])

      expect(dapps).toHaveLength(2)
      expect(getByText(`dappsScreenBottomSheet.title, {"dappName":"${dapp.name}"}`)).toBeTruthy()

      fireEvent.press(getByText(`dappsScreenBottomSheet.button, {"dappName":"${dapp.name}"}`))

      expect(store.getActions()).toEqual(
        expect.arrayContaining([
          dappSelected({ dapp: { ...dapp, openedFrom: DappSection.RecentlyUsed } }),
        ])
      )
    })

    it('should open the dapp directly if it is deep linked', () => {
      const { getAllByTestId, queryByText } = render(
        <Provider store={store}>
          <WalletHome />
        </Provider>
      )

      fireEvent.press(getAllByTestId('RecentlyUsedDapps/Dapp')[1])

      expect(
        queryByText(`dappsScreenBottomSheet.title, {"dappName":"${deepLinkedDapp.name}"}`)
      ).toBeFalsy()
      expect(store.getActions()).toEqual(
        expect.arrayContaining([
          dappSelected({ dapp: { ...deepLinkedDapp, openedFrom: DappSection.RecentlyUsed } }),
        ])
      )
    })
  })
})

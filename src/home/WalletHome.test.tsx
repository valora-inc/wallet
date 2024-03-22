import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import { FetchMock } from 'jest-fetch-mock/types'
import * as React from 'react'
import { Provider } from 'react-redux'
import { notificationSpotlightSeen } from 'src/app/actions'
import { dappSelected } from 'src/dapps/slice'
import { Dapp, DappSection } from 'src/dapps/types'
import WalletHome from 'src/home/WalletHome'
import { Actions as IdentityActions } from 'src/identity/actions'
import { RootState } from 'src/redux/reducers'
import { getFeatureGate } from 'src/statsig'
import { NetworkId } from 'src/transactions/types'
import MockedNavigator from 'test/MockedNavigator'
import { RecursivePartial, createMockStore } from 'test/utils'
import {
  mockCeurAddress,
  mockCeurTokenId,
  mockCusdAddress,
  mockCusdTokenId,
  mockStoreCelebrationReady,
  mockStoreReminderDisplayed,
  mockStoreReminderReady,
  mockStoreRewardDisplayed,
  mockStoreRewardReady,
  mockStoreRewardReayWithDifferentNft,
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

  function renderScreen(storeOverrides: RecursivePartial<RootState> = {}, screenParams = {}) {
    const store = createMockStore({
      ...mockBalances,
      ...storeOverrides,
    })

    const tree = render(
      <Provider store={store}>
        <MockedNavigator component={WalletHome} params={screenParams} />
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

    expect(tree.getByText('notificationCenterSpotlight.message')).toBeTruthy()
    expect(tree.getByTestId('HomeTokenBalance')).toBeTruthy()
    expect(tree.queryByTestId('HomeActionsCarousel')).toBeTruthy()
    expect(tree.queryByTestId('WalletHome/QRScanButton')).toBeTruthy()
    expect(tree.queryByTestId('WalletHome/Logo')).toBeFalsy()
    expect(store.getActions().map((action) => action.type)).toEqual(
      expect.arrayContaining([
        'HOME/VISIT_HOME',
        'ALERT/SHOW',
        'ALERT/HIDE',
        'HOME/REFRESH_BALANCES',
        'IDENTITY/IMPORT_CONTACTS',
      ])
    )
  })

  it('renders home tab correctly and fires initial actions', async () => {
    const { store, tree } = renderScreen(
      {
        app: {
          phoneNumberVerified: true,
        },
        recipients: {
          phoneRecipientCache: {},
        },
      },
      { isTabNavigator: true }
    )

    await act(() => {
      jest.runOnlyPendingTimers()
    })

    // Multiple elements use this text with the scroll aware header
    expect(tree.queryAllByText('bottomTabsNavigator.home.title')).toBeTruthy()
    expect(tree.queryByTestId('HomeActionsCarousel')).toBeTruthy()
    expect(tree.queryByText('notificationCenterSpotlight.message')).toBeFalsy()
    expect(tree.queryByTestId('HomeTokenBalance')).toBeFalsy()
    expect(tree.queryByTestId('cashInBtn')).toBeFalsy()
    expect(store.getActions().map((action) => action.type)).toEqual(
      expect.arrayContaining([
        'HOME/VISIT_HOME',
        'HOME/REFRESH_BALANCES',
        'IDENTITY/IMPORT_CONTACTS',
      ])
    )
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
          <MockedNavigator component={WalletHome} />
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
          <MockedNavigator component={WalletHome} />
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

  describe.each([{ isTabNavigator: false }, { isTabNavigator: true }])(
    'nft reward bottom sheet (isTabNavigator: $isTabNavigator)',
    ({ isTabNavigator }) => {
      beforeEach(() => {
        jest.mocked(getFeatureGate).mockReturnValue(true)
      })

      afterEach(() => {
        jest.clearAllMocks()
        jest.useFakeTimers({ doNotFake: ['Date'] })
      })

      it('renders correctly when status is "reward ready"', () => {
        const { getByText } = renderScreen(
          {
            ...mockStoreRewardReady,
            app: {
              showNotificationSpotlight: false,
            },
          },
          { isTabNavigator }
        )

        expect(getByText('nftCelebration.rewardBottomSheet.title')).toBeTruthy()
        expect(
          getByText('nftCelebration.rewardBottomSheet.description, {"nftName":"John Doe.fizzBuzz"}')
        ).toBeTruthy()
        expect(getByText('nftCelebration.rewardBottomSheet.cta')).toBeTruthy()
      })

      it('renders correctly when status is "reminder ready"', () => {
        const { getByText } = renderScreen(
          {
            ...mockStoreReminderReady,
            app: {
              showNotificationSpotlight: false,
            },
          },
          { isTabNavigator }
        )

        expect(getByText('nftCelebration.rewardReminderBottomSheet.title')).toBeTruthy()
        expect(
          getByText(
            'nftCelebration.rewardReminderBottomSheet.description, {"nftName":"John Doe.fizzBuzz"}'
          )
        ).toBeTruthy()
        expect(getByText('nftCelebration.rewardReminderBottomSheet.cta')).toBeTruthy()
      })

      it('does not render when status is other than "reward ready" or "reminder ready"', () => {
        const { queryByText } = renderScreen(
          {
            ...mockStoreCelebrationReady,
            app: {
              showNotificationSpotlight: false,
            },
          },
          { isTabNavigator }
        )

        expect(queryByText('nftCelebration.rewardBottomSheet.title')).toBeNull()
        expect(queryByText('nftCelebration.rewardBottomSheet.description')).toBeNull()
        expect(queryByText('nftCelebration.rewardBottomSheet.cta')).toBeNull()
      })

      it('does not render when celebrated contract does not match with user nft', () => {
        const { queryByText } = renderScreen(
          {
            ...mockStoreRewardReayWithDifferentNft,
            app: {
              showNotificationSpotlight: false,
            },
          },
          { isTabNavigator }
        )

        expect(queryByText('nftCelebration.rewardBottomSheet.title')).toBeNull()
        expect(queryByText('nftCelebration.rewardBottomSheet.description')).toBeNull()
        expect(queryByText('nftCelebration.rewardBottomSheet.cta')).toBeNull()
      })

      it('does not render when feature gate is closed', () => {
        jest.mocked(getFeatureGate).mockReturnValue(false)

        const { queryByText } = renderScreen(
          {
            ...mockStoreRewardReady,
            app: {
              showNotificationSpotlight: false,
            },
          },
          { isTabNavigator }
        )

        expect(queryByText('nftCelebration.rewardBottomSheet.title')).toBeNull()
        expect(queryByText('nftCelebration.rewardBottomSheet.description')).toBeNull()
        expect(queryByText('nftCelebration.rewardBottomSheet.cta')).toBeNull()
      })

      it('does not render if reward is already displayed', () => {
        const { queryByText } = renderScreen(
          {
            ...mockStoreRewardDisplayed,
            app: {
              showNotificationSpotlight: false,
            },
          },
          { isTabNavigator }
        )

        expect(queryByText('nftCelebration.rewardBottomSheet.title')).toBeNull()
        expect(queryByText('nftCelebration.rewardBottomSheet.description')).toBeNull()
        expect(queryByText('nftCelebration.rewardBottomSheet.cta')).toBeNull()
      })

      it('does not render if reminder is already displayed', () => {
        const { queryByText } = renderScreen(
          {
            ...mockStoreReminderDisplayed,
            app: {
              showNotificationSpotlight: false,
            },
          },
          { isTabNavigator }
        )

        expect(queryByText('nftCelebration.rewardBottomSheet.title')).toBeNull()
        expect(queryByText('nftCelebration.rewardBottomSheet.description')).toBeNull()
        expect(queryByText('nftCelebration.rewardBottomSheet.cta')).toBeNull()
      })

      it('does not render if expired', () => {
        jest.useFakeTimers({ now: new Date('3001-01-01T00:00:00.000Z') })

        const { queryByText } = renderScreen(
          {
            ...mockStoreRewardReady,
            app: {
              showNotificationSpotlight: false,
            },
          },
          { isTabNavigator }
        )

        expect(queryByText('nftCelebration.rewardBottomSheet.title')).toBeNull()
        expect(queryByText('nftCelebration.rewardBottomSheet.description')).toBeNull()
        expect(queryByText('nftCelebration.rewardBottomSheet.cta')).toBeNull()
      })
    }
  )
})

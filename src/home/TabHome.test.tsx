import { act, render } from '@testing-library/react-native'
import { FetchMock } from 'jest-fetch-mock/types'
import * as React from 'react'
import { Provider } from 'react-redux'
import TabHome from 'src/home/TabHome'
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

describe('TabHome', () => {
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
        <MockedNavigator component={TabHome} params={screenParams} />
      </Provider>
    )

    return {
      store,
      tree,
      ...tree,
    }
  }

  it('renders home tab correctly and fires initial actions', async () => {
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

  describe('nft reward bottom sheet', () => {
    beforeEach(() => {
      jest.mocked(getFeatureGate).mockReturnValue(true)
    })

    afterEach(() => {
      jest.clearAllMocks()
      jest.useFakeTimers({ doNotFake: ['Date'] })
    })

    it('renders correctly when status is "reward ready"', () => {
      const { getByText } = renderScreen({
        ...mockStoreRewardReady,
        app: {
          showNotificationSpotlight: false,
        },
      })

      expect(getByText('nftCelebration.rewardBottomSheet.title')).toBeTruthy()
      expect(
        getByText('nftCelebration.rewardBottomSheet.description, {"nftName":"John Doe.fizzBuzz"}')
      ).toBeTruthy()
      expect(getByText('nftCelebration.rewardBottomSheet.cta')).toBeTruthy()
    })

    it('renders correctly when status is "reminder ready"', () => {
      const { getByText } = renderScreen({
        ...mockStoreReminderReady,
        app: {
          showNotificationSpotlight: false,
        },
      })

      expect(getByText('nftCelebration.rewardReminderBottomSheet.title')).toBeTruthy()
      expect(
        getByText(
          'nftCelebration.rewardReminderBottomSheet.description, {"nftName":"John Doe.fizzBuzz"}'
        )
      ).toBeTruthy()
      expect(getByText('nftCelebration.rewardReminderBottomSheet.cta')).toBeTruthy()
    })

    it('does not render when status is other than "reward ready" or "reminder ready"', () => {
      const { queryByText } = renderScreen({
        ...mockStoreCelebrationReady,
        app: {
          showNotificationSpotlight: false,
        },
      })

      expect(queryByText('nftCelebration.rewardBottomSheet.title')).toBeNull()
      expect(queryByText('nftCelebration.rewardBottomSheet.description')).toBeNull()
      expect(queryByText('nftCelebration.rewardBottomSheet.cta')).toBeNull()
    })

    it('does not render when celebrated contract does not match with user nft', () => {
      const { queryByText } = renderScreen({
        ...mockStoreRewardReayWithDifferentNft,
        app: {
          showNotificationSpotlight: false,
        },
      })

      expect(queryByText('nftCelebration.rewardBottomSheet.title')).toBeNull()
      expect(queryByText('nftCelebration.rewardBottomSheet.description')).toBeNull()
      expect(queryByText('nftCelebration.rewardBottomSheet.cta')).toBeNull()
    })

    it('does not render when feature gate is closed', () => {
      jest.mocked(getFeatureGate).mockReturnValue(false)

      const { queryByText } = renderScreen({
        ...mockStoreRewardReady,
        app: {
          showNotificationSpotlight: false,
        },
      })

      expect(queryByText('nftCelebration.rewardBottomSheet.title')).toBeNull()
      expect(queryByText('nftCelebration.rewardBottomSheet.description')).toBeNull()
      expect(queryByText('nftCelebration.rewardBottomSheet.cta')).toBeNull()
    })

    it('does not render if reward is already displayed', () => {
      const { queryByText } = renderScreen({
        ...mockStoreRewardDisplayed,
        app: {
          showNotificationSpotlight: false,
        },
      })

      expect(queryByText('nftCelebration.rewardBottomSheet.title')).toBeNull()
      expect(queryByText('nftCelebration.rewardBottomSheet.description')).toBeNull()
      expect(queryByText('nftCelebration.rewardBottomSheet.cta')).toBeNull()
    })

    it('does not render if reminder is already displayed', () => {
      const { queryByText } = renderScreen({
        ...mockStoreReminderDisplayed,
        app: {
          showNotificationSpotlight: false,
        },
      })

      expect(queryByText('nftCelebration.rewardBottomSheet.title')).toBeNull()
      expect(queryByText('nftCelebration.rewardBottomSheet.description')).toBeNull()
      expect(queryByText('nftCelebration.rewardBottomSheet.cta')).toBeNull()
    })

    it('does not render if expired', () => {
      jest.useFakeTimers({ now: new Date('3001-01-01T00:00:00.000Z') })

      const { queryByText } = renderScreen({
        ...mockStoreRewardReady,
        app: {
          showNotificationSpotlight: false,
        },
      })

      expect(queryByText('nftCelebration.rewardBottomSheet.title')).toBeNull()
      expect(queryByText('nftCelebration.rewardBottomSheet.description')).toBeNull()
      expect(queryByText('nftCelebration.rewardBottomSheet.cta')).toBeNull()
    })
  })
})

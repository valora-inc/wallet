import { fireEvent, render, waitFor, within } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import CleverTap from 'clevertap-react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { openUrl } from 'src/app/actions'
import { fetchAvailableRewards } from 'src/consumerIncentives/slice'
import { ONE_CUSD_REWARD_RESPONSE } from 'src/consumerIncentives/testValues'
import NotificationCenter from 'src/home/NotificationCenter'
import { NotificationBannerCTATypes, NotificationType } from 'src/home/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getFeatureGate } from 'src/statsig'
import { Spacing } from 'src/styles/styles'
import { NetworkId } from 'src/transactions/types'
import { multiplyByWei } from 'src/utils/formatting'
import { createMockStore, getElementText, getMockStackScreenProps } from 'test/utils'
import {
  mockCleverTapInboxMessage,
  mockCusdAddress,
  mockCusdTokenId,
  mockE164Number,
  mockE164NumberPepper,
  mockEscrowedPayment,
  mockExpectedCleverTapInboxMessage,
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
jest.mock('src/analytics/ValoraAnalytics')
jest.mock('src/navigator/NavigationService', () => ({
  ensurePincode: jest.fn(async () => true),
  navigate: jest.fn(),
}))
jest.mock('src/statsig')

jest.mock('clevertap-react-native', () => ({
  deleteInboxMessageForId: jest.fn(),
  markReadInboxMessageForId: jest.fn(),
  pushInboxNotificationViewedEventForId: jest.fn(),
  pushInboxNotificationClickedEventForId: jest.fn(),
}))

const DEVICE_HEIGHT = 850

const TWO_DAYS_MS = 2 * 24 * 60 * 1000
const BACKUP_TIME = new Date().getTime() - TWO_DAYS_MS

const testNotification = {
  ctaUri: 'https://celo.org',
  priority: 20,
  content: {
    en: {
      body: 'Body Text',
      cta: 'Start',
      dismiss: 'Dismiss',
    },
  },
}

const storeDataNotificationsDisabled = {
  account: {
    backupCompleted: true,
    dismissedInviteFriends: true,
    dismissedGetVerified: true,
    accountCreationTime: BACKUP_TIME,
    celoEducationCompleted: true,
    dismissedStartSupercharging: true,
  },
  escrow: {
    sentEscrowedPayments: [],
  },
  paymentRequest: {
    incomingPaymentRequests: [],
    outgoingPaymentRequests: [],
  },
  home: {
    notifications: {
      testNotification: {
        ...testNotification,
        dismissed: true,
      },
    },
  },
}

const superchargeSetUp = {
  ...storeDataNotificationsDisabled,
  web3: {
    account: 'account',
  },
  app: {
    phoneNumberVerified: true,
  },
  supercharge: {
    availableRewards: [ONE_CUSD_REWARD_RESPONSE],
  },
}

const superchargeWithoutRewardsSetUp = {
  ...superchargeSetUp,
  supercharge: {
    availableRewards: [],
  },
}

const mockcUsdBalance = {
  [mockCusdTokenId]: {
    address: mockCusdAddress,
    tokenId: mockCusdTokenId,
    networkId: NetworkId['celo-alfajores'],
    isFeeCurrency: true,
    balance: '100',
    symbol: 'cUSD',
    priceUsd: '1',
    priceFetchedAt: Date.now(),
  },
}

const mockcUsdWithoutEnoughBalance = {
  [mockCusdTokenId]: {
    address: mockCusdAddress,
    tokenId: mockCusdTokenId,
    networkId: NetworkId['celo-alfajores'],
    isFeeCurrency: true,
    balance: '5',
    symbol: 'cUSD',
    priceUsd: '1',
    priceFetchedAt: Date.now(),
  },
}

/**
 * Use this function to trigger the onViewableItemsChanged callback within a FlatList or SectionList.
 * It emulates the layout event, vital for calculating the currently viewable set of items.
 *
 * Note: In React Native's VirtualizedList, the onViewableItemsChanged callback is not fired immediately.
 * Consider waiting for it to be fired when testing.
 */
const layoutNotificationList = (screen: ReturnType<typeof render>) => {
  const ITEM_HEIGHT = 144
  const GAP_HEIGHT = Spacing.Thick24

  const notificationList = screen.getByTestId('NotificationCenter')
  const notificationItems = within(notificationList).getAllByTestId(/^NotificationView/)

  // compute each item layout
  notificationItems.forEach((notificationItem, index) => {
    const isLastItem = index + 1 === notificationItems.length

    const y = index * (ITEM_HEIGHT + GAP_HEIGHT)
    const height = isLastItem ? ITEM_HEIGHT : ITEM_HEIGHT + GAP_HEIGHT

    fireEvent(notificationItem, 'layout', {
      nativeEvent: {
        layout: { height, y },
      },
    })
  })

  // compute list layout
  fireEvent(notificationList, 'layout', {
    nativeEvent: {
      layout: { height: DEVICE_HEIGHT },
    },
  })
}

describe('NotificationCenter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
  })

  it('renders empty state when there is no notifications at all', () => {
    const store = createMockStore({ ...storeDataNotificationsDisabled })
    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
      </Provider>
    )

    expect(getByTestId('NotificationCenter/EmptyState')).toBeTruthy()
    expect(getByText('noNotificationsPlaceholder')).toBeTruthy()
  })

  it('emits correct analytics events when opened', async () => {
    const store = createMockStore()
    const screen = render(
      <Provider store={store}>
        <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
      </Provider>
    )

    layoutNotificationList(screen)

    await waitFor(() => expect(ValoraAnalytics.track).toHaveBeenCalledTimes(5))

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_center_opened, {
      notificationsCount: 4,
    })
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_impression, {
      notificationId: NotificationType.backup_prompt,
      notificationType: NotificationType.backup_prompt,
      notificationPositionInList: 0,
    })
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_impression, {
      notificationId: NotificationType.start_supercharging,
      notificationType: NotificationType.start_supercharging,
      notificationPositionInList: 1,
    })
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_impression, {
      notificationId: NotificationType.verification_prompt,
      notificationType: NotificationType.verification_prompt,
      notificationPositionInList: 2,
    })
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_impression, {
      notificationId: NotificationType.celo_asset_education,
      notificationType: NotificationType.celo_asset_education,
      notificationPositionInList: 3,
    })
  })

  describe('backup', () => {
    it('renders backup when not complete yet', () => {
      const store = createMockStore({
        ...storeDataNotificationsDisabled,
        account: {
          ...storeDataNotificationsDisabled.account,
          backupCompleted: false,
        },
      })

      const { getByText } = render(
        <Provider store={store}>
          <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
        </Provider>
      )

      expect(getByText('backupKeyNotification2')).toBeTruthy()
    })

    it('emits correct analytics event when CTA button is pressed', () => {
      const store = createMockStore({
        ...storeDataNotificationsDisabled,
        account: {
          ...storeDataNotificationsDisabled.account,
          backupCompleted: false,
        },
      })

      const { getByText } = render(
        <Provider store={store}>
          <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
        </Provider>
      )

      fireEvent.press(getByText('backupKeyCTA'))

      expect(ValoraAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_select, {
        notificationType: NotificationType.backup_prompt,
        selectedAction: NotificationBannerCTATypes.accept,
        notificationId: NotificationType.backup_prompt,
        notificationPositionInList: 0,
      })
    })
  })

  describe('reverify using CPV', () => {
    it('renders reverify notification if decentrally verified and not CPV', () => {
      const store = createMockStore({
        app: {
          numberVerified: true,
          phoneNumberVerified: false,
        },
      })
      const { getByText } = render(
        <Provider store={store}>
          <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
        </Provider>
      )

      expect(getByText('reverifyUsingCPVHomecard.description')).toBeTruthy()

      fireEvent.press(getByText('reverifyUsingCPVHomecard.buttonLabel'))
      expect(navigate).toHaveBeenCalledWith(Screens.VerificationStartScreen, {
        hideOnboardingStep: true,
      })
    })

    it('emits correct analytics event when CTA button is pressed', () => {
      const store = createMockStore({
        ...storeDataNotificationsDisabled,
        app: {
          numberVerified: true,
          phoneNumberVerified: false,
        },
      })
      const { getByText } = render(
        <Provider store={store}>
          <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
        </Provider>
      )

      fireEvent.press(getByText('reverifyUsingCPVHomecard.buttonLabel'))

      expect(ValoraAnalytics.track).toHaveBeenLastCalledWith(HomeEvents.notification_select, {
        notificationType: NotificationType.reverify_using_CPV,
        selectedAction: NotificationBannerCTATypes.accept,
        notificationId: NotificationType.reverify_using_CPV,
        notificationPositionInList: 0,
      })
    })
  })

  describe('education', () => {
    it('renders educations when not complete yet', () => {
      const store = createMockStore({
        ...storeDataNotificationsDisabled,
        account: {
          ...storeDataNotificationsDisabled.account,
          celoEducationCompleted: false,
        },
      })

      const { getByText } = render(
        <Provider store={store}>
          <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
        </Provider>
      )

      expect(getByText('whatIsGold')).toBeTruthy()
    })

    it('emits correct analytics event when CTA button is pressed', () => {
      const store = createMockStore({
        ...storeDataNotificationsDisabled,
        account: {
          ...storeDataNotificationsDisabled.account,
          celoEducationCompleted: false,
        },
      })

      const { getByText } = render(
        <Provider store={store}>
          <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
        </Provider>
      )

      fireEvent.press(getByText('learnMore'))

      expect(ValoraAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_select, {
        notificationType: NotificationType.celo_asset_education,
        selectedAction: NotificationBannerCTATypes.accept,
        notificationId: NotificationType.celo_asset_education,
        notificationPositionInList: 0,
      })
    })

    it('emits correct analytics event when notification is dismissed', () => {
      const store = createMockStore({
        ...storeDataNotificationsDisabled,
        account: {
          ...storeDataNotificationsDisabled.account,
          celoEducationCompleted: false,
        },
      })

      const { getByText } = render(
        <Provider store={store}>
          <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
        </Provider>
      )

      fireEvent.press(getByText('dismiss'))

      expect(ValoraAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_select, {
        notificationType: NotificationType.celo_asset_education,
        selectedAction: NotificationBannerCTATypes.decline,
        notificationId: NotificationType.celo_asset_education,
        notificationPositionInList: 0,
      })
    })
  })

  describe('escrowed payments', () => {
    it('renders sent escrowed payment when it exists', () => {
      const store = createMockStore({
        ...storeDataNotificationsDisabled,
        account: {
          ...storeDataNotificationsDisabled.account,
        },
        escrow: {
          sentEscrowedPayments: [
            {
              ...mockEscrowedPayment,
              amount: multiplyByWei(new BigNumber(10)).toString(),
              message: 'Welcome!',
            },
          ],
        },
      })
      const { getByTestId } = render(
        <Provider store={store}>
          <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
        </Provider>
      )

      expect(getElementText(getByTestId('EscrowedPaymentListItem/Title'))).toBe(
        'escrowPaymentNotificationTitle, {"mobile":"John Doe"}'
      )
      expect(getElementText(getByTestId('EscrowedPaymentListItem/Amount'))).toBe('₱13.30')
      expect(getElementText(getByTestId('EscrowedPaymentListItem/Details'))).toBe('Welcome!')
    })

    it('renders sent escrowed payments in reverse chronological order', () => {
      const store = createMockStore({
        ...storeDataNotificationsDisabled,
        account: {
          ...storeDataNotificationsDisabled.account,
        },
        escrow: {
          sentEscrowedPayments: [
            {
              ...mockEscrowedPayment,
              timestamp: new BigNumber(1000),
              amount: multiplyByWei(new BigNumber(10)).toString(),
              message: 'Welcome!',
            },
            {
              ...mockEscrowedPayment,
              timestamp: new BigNumber(2000),
              amount: multiplyByWei(new BigNumber(20)).toString(),
            },
            {
              ...mockEscrowedPayment,
              timestamp: new BigNumber(3000),
              amount: multiplyByWei(new BigNumber(30)).toString(),
            },
          ],
        },
      })
      const { getAllByTestId } = render(
        <Provider store={store}>
          <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
        </Provider>
      )

      const items = getAllByTestId('EscrowedPaymentListItem/Amount')
      expect(getElementText(items[0])).toBe('₱39.90')
      expect(getElementText(items[1])).toBe('₱26.60')
      expect(getElementText(items[2])).toBe('₱13.30')
    })
  })

  describe('verification reminder', () => {
    it('renders verification reminder when not verified', () => {
      const store = createMockStore({
        ...storeDataNotificationsDisabled,
        account: {
          ...storeDataNotificationsDisabled.account,
          dismissedGetVerified: false,
          e164PhoneNumber: mockE164Number,
        },
        identity: { e164NumberToSalt: { [mockE164Number]: mockE164NumberPepper } },
      })
      const { getByText } = render(
        <Provider store={store}>
          <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
        </Provider>
      )
      expect(getByText('notification.body')).toBeTruthy()
    })

    it('emits correct analytics event when CTA button is pressed', () => {
      const store = createMockStore({
        ...storeDataNotificationsDisabled,
        account: {
          ...storeDataNotificationsDisabled.account,
          dismissedGetVerified: false,
          e164PhoneNumber: mockE164Number,
        },
        identity: { e164NumberToSalt: { [mockE164Number]: mockE164NumberPepper } },
      })
      const { getByText } = render(
        <Provider store={store}>
          <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
        </Provider>
      )

      fireEvent.press(getByText('notification.cta'))

      expect(ValoraAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_select, {
        notificationType: NotificationType.verification_prompt,
        selectedAction: NotificationBannerCTATypes.accept,
        notificationId: NotificationType.verification_prompt,
        notificationPositionInList: 0,
      })
    })

    it('emits correct analytics event when notification is dismissed', () => {
      const store = createMockStore({
        ...storeDataNotificationsDisabled,
        account: {
          ...storeDataNotificationsDisabled.account,
          dismissedGetVerified: false,
          e164PhoneNumber: mockE164Number,
        },
        identity: { e164NumberToSalt: { [mockE164Number]: mockE164NumberPepper } },
      })
      const { getByText } = render(
        <Provider store={store}>
          <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
        </Provider>
      )

      fireEvent.press(getByText('dismiss'))

      expect(ValoraAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_select, {
        notificationType: NotificationType.verification_prompt,
        selectedAction: NotificationBannerCTATypes.decline,
        notificationId: NotificationType.verification_prompt,
        notificationPositionInList: 0,
      })
    })

    it('does not render verification reminder when insufficient balance', () => {
      const store = createMockStore({
        ...storeDataNotificationsDisabled,
      })
      const { queryByText } = render(
        <Provider store={store}>
          <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
        </Provider>
      )
      expect(queryByText('notification.body')).toBeFalsy()
    })
  })

  describe('remote notifications', () => {
    it('renders all remote notifications that were not dismissed and not for the home screen', () => {
      const store = createMockStore({
        ...storeDataNotificationsDisabled,
        home: {
          notifications: {
            notification1: {
              ...testNotification,
              dismissed: true,
              content: {
                en: {
                  ...testNotification.content.en,
                  body: 'Notification 1',
                },
              },
            },
            notification2: {
              ...testNotification,
              showOnHomeScreen: true,
              content: {
                en: {
                  ...testNotification.content.en,
                  body: 'Notification 2',
                },
              },
            },
            notification3: {
              ...testNotification,
              content: {
                en: {
                  ...testNotification.content.en,
                  body: 'Notification 3',
                  cta: 'Press Remote',
                },
              },
            },
          },
        },
      })
      const { queryByText, getByText } = render(
        <Provider store={store}>
          <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
        </Provider>
      )
      expect(queryByText('Notification 1')).toBeFalsy()
      expect(queryByText('Notification 2')).toBeFalsy()
      expect(queryByText('Notification 3')).toBeTruthy()

      expect(store.getActions()).toEqual([fetchAvailableRewards()])

      fireEvent.press(getByText('Press Remote'))
      expect(store.getActions()).toEqual([
        fetchAvailableRewards(),
        openUrl(testNotification.ctaUri, false, true),
      ])
    })

    it('renders notifications that open URL internally or externally', () => {
      const store = createMockStore({
        ...storeDataNotificationsDisabled,
        home: {
          notifications: {
            notification1: {
              ...testNotification,
              content: {
                en: {
                  ...testNotification.content.en,
                  body: 'Notification 1',
                  cta: 'Press Internal',
                },
              },
            },
            notification2: {
              ...testNotification,
              openExternal: true,
              content: {
                en: {
                  ...testNotification.content.en,
                  body: 'Notification 2',
                  cta: 'Press External',
                },
              },
            },
          },
        },
      })
      const { queryByText, getByText } = render(
        <Provider store={store}>
          <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
        </Provider>
      )
      expect(queryByText('Notification 1')).toBeTruthy()
      expect(queryByText('Notification 2')).toBeTruthy()

      expect(store.getActions()).toEqual([fetchAvailableRewards()])

      fireEvent.press(getByText('Press Internal'))
      expect(store.getActions()).toEqual([
        fetchAvailableRewards(),
        openUrl(testNotification.ctaUri, false, true),
      ])
      fireEvent.press(getByText('Press External'))
      expect(store.getActions()).toEqual([
        fetchAvailableRewards(),
        openUrl(testNotification.ctaUri, false, true),
        openUrl(testNotification.ctaUri, true, true),
      ])
    })
  })

  describe('claim supercharge rewards', () => {
    it('renders claim rewards notification when there are supercharge rewards', () => {
      const store = createMockStore(superchargeSetUp)
      const { queryByTestId, getByText, getByTestId } = render(
        <Provider store={store}>
          <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
        </Provider>
      )

      expect(getByTestId('NotificationView/supercharge_available')).toBeTruthy()
      expect(queryByTestId('NotificationView/supercharging')).toBeFalsy()
      expect(queryByTestId('NotificationView/start_supercharging')).toBeFalsy()

      fireEvent.press(getByText('superchargeNotificationStart'))

      expect(navigate).toHaveBeenCalledWith(Screens.ConsumerIncentivesHomeScreen)
    })

    it('emits correct analytics event when CTA button is pressed', () => {
      const store = createMockStore(superchargeSetUp)
      const { getByText } = render(
        <Provider store={store}>
          <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
        </Provider>
      )

      fireEvent.press(getByText('superchargeNotificationStart'))

      expect(ValoraAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_select, {
        notificationType: NotificationType.supercharge_available,
        selectedAction: NotificationBannerCTATypes.accept,
        notificationId: NotificationType.supercharge_available,
        notificationPositionInList: 0,
      })
    })
  })

  describe('keep supercharging', () => {
    it('renders keep supercharging notification when expected', () => {
      const store = createMockStore({
        ...superchargeWithoutRewardsSetUp,
        tokens: {
          tokenBalances: mockcUsdBalance,
        },
      })
      const { queryByTestId, getByText, getByTestId } = render(
        <Provider store={store}>
          <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
        </Provider>
      )

      expect(queryByTestId('NotificationView/supercharge_available')).toBeFalsy()
      expect(getByTestId('NotificationView/supercharging')).toBeTruthy()
      expect(queryByTestId('NotificationView/start_supercharging')).toBeFalsy()

      fireEvent.press(getByText('superchargingNotificationStart'))

      expect(navigate).toHaveBeenCalledWith(Screens.ConsumerIncentivesHomeScreen)
    })

    it('does not render keep supercharging because is dismissed', () => {
      const store = createMockStore({
        ...superchargeWithoutRewardsSetUp,
        tokens: {
          tokenBalances: mockcUsdBalance,
        },
        account: {
          dismissedKeepSupercharging: true,
        },
      })
      const { queryByTestId } = render(
        <Provider store={store}>
          <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
        </Provider>
      )

      expect(queryByTestId('NotificationView/supercharge_available')).toBeFalsy()
      expect(queryByTestId('NotificationView/supercharging')).toBeFalsy()
      expect(queryByTestId('NotificationView/start_supercharging')).toBeFalsy()
    })

    it('emits correct analytics event when CTA button is pressed', () => {
      const store = createMockStore({
        ...superchargeWithoutRewardsSetUp,
        tokens: {
          tokenBalances: mockcUsdBalance,
        },
      })
      const { getByText } = render(
        <Provider store={store}>
          <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
        </Provider>
      )

      fireEvent.press(getByText('superchargingNotificationStart'))

      expect(ValoraAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_select, {
        notificationType: NotificationType.supercharging,
        selectedAction: NotificationBannerCTATypes.accept,
        notificationId: NotificationType.supercharging,
        notificationPositionInList: 0,
      })
    })

    it('emits correct analytics event when notification is dismissed', () => {
      const store = createMockStore({
        ...superchargeWithoutRewardsSetUp,
        tokens: {
          tokenBalances: mockcUsdBalance,
        },
      })
      const { getByText } = render(
        <Provider store={store}>
          <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
        </Provider>
      )

      fireEvent.press(getByText('dismiss'))

      expect(ValoraAnalytics.track).toHaveBeenLastCalledWith(HomeEvents.notification_select, {
        notificationType: NotificationType.supercharging,
        selectedAction: NotificationBannerCTATypes.decline,
        notificationId: NotificationType.supercharging,
        notificationPositionInList: 0,
      })
    })
  })

  describe('start supercharging', () => {
    it('renders start supercharging notification if number is not verified', () => {
      const store = createMockStore({
        ...superchargeWithoutRewardsSetUp,
        account: {
          ...superchargeWithoutRewardsSetUp.account,
          dismissedStartSupercharging: false,
        },
        tokens: {
          tokenBalances: mockcUsdBalance,
        },
        app: {
          ...superchargeWithoutRewardsSetUp.app,
          phoneNumberVerified: false,
        },
      })
      const { queryByTestId, getByText, getByTestId } = render(
        <Provider store={store}>
          <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
        </Provider>
      )

      expect(queryByTestId('NotificationView/supercharge_available')).toBeFalsy()
      expect(queryByTestId('NotificationView/supercharging')).toBeFalsy()
      expect(getByTestId('NotificationView/start_supercharging')).toBeTruthy()

      fireEvent.press(getByText('startSuperchargingNotificationStart'))

      expect(navigate).toHaveBeenCalledWith(Screens.ConsumerIncentivesHomeScreen)
    })

    it('renders start supercharging notification if user does not have enough balance', () => {
      const store = createMockStore({
        ...superchargeWithoutRewardsSetUp,
        account: {
          ...superchargeWithoutRewardsSetUp.account,
          dismissedStartSupercharging: false,
        },
        tokens: {
          tokenBalances: mockcUsdWithoutEnoughBalance,
        },
      })
      const { queryByTestId, getByText, getByTestId } = render(
        <Provider store={store}>
          <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
        </Provider>
      )

      expect(queryByTestId('NotificationView/supercharge_available')).toBeFalsy()
      expect(queryByTestId('NotificationView/supercharging')).toBeFalsy()
      expect(getByTestId('NotificationView/start_supercharging')).toBeTruthy()

      fireEvent.press(getByText('startSuperchargingNotificationStart'))

      expect(navigate).toHaveBeenCalledWith(Screens.ConsumerIncentivesHomeScreen)
    })

    it('does not render start supercharging because is dismissed', () => {
      const store = createMockStore({
        ...superchargeWithoutRewardsSetUp,
        tokens: {
          tokenBalances: mockcUsdWithoutEnoughBalance,
        },
        account: {
          dismissedStartSupercharging: true,
        },
      })
      const { queryByTestId } = render(
        <Provider store={store}>
          <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
        </Provider>
      )

      expect(queryByTestId('NotificationView/supercharge_available')).toBeFalsy()
      expect(queryByTestId('NotificationView/supercharging')).toBeFalsy()
      expect(queryByTestId('NotificationView/start_supercharging')).toBeFalsy()
    })

    it('does not render start supercharging because the user is in a restricted region', () => {
      jest.mocked(getFeatureGate).mockReturnValueOnce(true)

      const store = createMockStore({
        ...superchargeWithoutRewardsSetUp,
        account: {
          ...superchargeWithoutRewardsSetUp.account,
          dismissedStartSupercharging: false,
        },
        tokens: {
          tokenBalances: mockcUsdWithoutEnoughBalance,
        },
      })
      const { queryByTestId } = render(
        <Provider store={store}>
          <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
        </Provider>
      )

      expect(queryByTestId('NotificationView/supercharge_available')).toBeFalsy()
      expect(queryByTestId('NotificationView/supercharging')).toBeFalsy()
      expect(queryByTestId('NotificationView/start_supercharging')).toBeFalsy()
    })

    it('emits correct analytics event when CTA button is pressed', () => {
      const store = createMockStore({
        ...superchargeWithoutRewardsSetUp,
        account: {
          ...superchargeWithoutRewardsSetUp.account,
          dismissedStartSupercharging: false,
        },
        tokens: {
          tokenBalances: mockcUsdBalance,
        },
        app: {
          ...superchargeWithoutRewardsSetUp.app,
          phoneNumberVerified: false,
        },
      })
      const { getByText } = render(
        <Provider store={store}>
          <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
        </Provider>
      )

      fireEvent.press(getByText('startSuperchargingNotificationStart'))

      expect(ValoraAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_select, {
        notificationType: NotificationType.start_supercharging,
        selectedAction: NotificationBannerCTATypes.accept,
        notificationId: NotificationType.start_supercharging,
        notificationPositionInList: 0,
      })
    })

    it('emits correct analytics event when notification is dismissed', () => {
      const store = createMockStore({
        ...superchargeWithoutRewardsSetUp,
        account: {
          ...superchargeWithoutRewardsSetUp.account,
          dismissedStartSupercharging: false,
        },
        tokens: {
          tokenBalances: mockcUsdBalance,
        },
        app: {
          ...superchargeWithoutRewardsSetUp.app,
          phoneNumberVerified: false,
        },
      })
      const { getByText } = render(
        <Provider store={store}>
          <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
        </Provider>
      )

      fireEvent.press(getByText('dismiss'))

      expect(ValoraAnalytics.track).toHaveBeenLastCalledWith(HomeEvents.notification_select, {
        notificationType: NotificationType.start_supercharging,
        selectedAction: NotificationBannerCTATypes.decline,
        notificationId: NotificationType.start_supercharging,
        notificationPositionInList: 0,
      })
    })
  })

  describe('clevertap notifications', () => {
    beforeAll(() => {
      jest.mocked(getFeatureGate).mockReturnValue(true)
    })

    afterAll(() => {
      jest.clearAllMocks()
    })

    it('renders clevertap notification', () => {
      const store = createMockStore({
        ...storeDataNotificationsDisabled,
        home: {
          cleverTapInboxMessages: [mockCleverTapInboxMessage],
        },
      })
      const { getByText } = render(
        <Provider store={store}>
          <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
        </Provider>
      )
      expect(getByText('CleverTap Message Header')).toBeDefined()
      expect(getByText('CleverTap Message Body Text')).toBeDefined()
    })

    it('emits correct events when CTA is pressed', () => {
      const store = createMockStore({
        ...storeDataNotificationsDisabled,
        home: {
          cleverTapInboxMessages: [mockCleverTapInboxMessage],
        },
      })
      const { getByText } = render(
        <Provider store={store}>
          <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
        </Provider>
      )

      store.clearActions()

      fireEvent.press(getByText('CleverTap Message CTA'))
      expect(store.getActions()).toEqual([openUrl('https://valoraapp.com', false, true)])

      expect(CleverTap.pushInboxNotificationClickedEventForId).toBeCalledWith(
        mockExpectedCleverTapInboxMessage.id
      )

      expect(ValoraAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_select, {
        notificationType: NotificationType.clevertap_notification,
        selectedAction: NotificationBannerCTATypes.accept,
        notificationId: `${NotificationType.clevertap_notification}/${mockExpectedCleverTapInboxMessage.id}`,
        notificationPositionInList: 0,
      })
    })

    it('emits correct events when notification is dismissed', () => {
      const store = createMockStore({
        ...storeDataNotificationsDisabled,
        home: {
          cleverTapInboxMessages: [mockCleverTapInboxMessage],
        },
      })
      const { getByText } = render(
        <Provider store={store}>
          <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
        </Provider>
      )

      fireEvent.press(getByText('dismiss'))

      expect(CleverTap.deleteInboxMessageForId).toBeCalledWith(mockExpectedCleverTapInboxMessage.id)

      expect(ValoraAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_select, {
        notificationType: NotificationType.clevertap_notification,
        selectedAction: NotificationBannerCTATypes.decline,
        notificationId: `${NotificationType.clevertap_notification}/${mockExpectedCleverTapInboxMessage.id}`,
        notificationPositionInList: 0,
      })
    })

    it('emits correct events when notification is displayed', async () => {
      const store = createMockStore({
        ...storeDataNotificationsDisabled,
        home: {
          cleverTapInboxMessages: [mockCleverTapInboxMessage],
        },
      })
      const screen = render(
        <Provider store={store}>
          <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
        </Provider>
      )

      layoutNotificationList(screen)

      await waitFor(() =>
        expect(ValoraAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_impression, {
          notificationType: NotificationType.clevertap_notification,
          notificationId: `${NotificationType.clevertap_notification}/${mockExpectedCleverTapInboxMessage.id}`,
          notificationPositionInList: 0,
        })
      )

      expect(CleverTap.pushInboxNotificationViewedEventForId).toBeCalledWith(
        mockExpectedCleverTapInboxMessage.id
      )
      expect(CleverTap.markReadInboxMessageForId).toBeCalledWith(
        mockExpectedCleverTapInboxMessage.id
      )
    })
  })
})

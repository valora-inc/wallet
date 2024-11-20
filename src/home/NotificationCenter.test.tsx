import { fireEvent, render, waitFor, within } from '@testing-library/react-native'
import CleverTap from 'clevertap-react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { HomeEvents } from 'src/analytics/Events'
import { openUrl } from 'src/app/actions'
import NotificationCenter from 'src/home/NotificationCenter'
import { NotificationBannerCTATypes, NotificationType } from 'src/home/types'
import { Screens } from 'src/navigator/Screens'
import { getFeatureGate } from 'src/statsig'
import { Spacing } from 'src/styles/styles'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import {
  mockCleverTapInboxMessage,
  mockE164Number,
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
jest.mock('src/analytics/AppAnalytics')
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
jest.mock('src/config', () => ({
  ...jest.requireActual('src/config'),
  ONBOARDING_FEATURES_ENABLED: { CloudBackup: false },
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

    await waitFor(() => expect(AppAnalytics.track).toHaveBeenCalledTimes(4))

    expect(AppAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_center_opened, {
      notificationsCount: 3,
    })
    expect(AppAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_impression, {
      notificationId: NotificationType.backup_prompt,
      notificationType: NotificationType.backup_prompt,
      notificationPositionInList: 0,
    })
    expect(AppAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_impression, {
      notificationId: NotificationType.verification_prompt,
      notificationType: NotificationType.verification_prompt,
      notificationPositionInList: 1,
    })
    expect(AppAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_impression, {
      notificationId: NotificationType.celo_asset_education,
      notificationType: NotificationType.celo_asset_education,
      notificationPositionInList: 2,
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

      expect(AppAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_select, {
        notificationType: NotificationType.backup_prompt,
        selectedAction: NotificationBannerCTATypes.accept,
        notificationId: NotificationType.backup_prompt,
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

      expect(AppAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_select, {
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

      expect(AppAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_select, {
        notificationType: NotificationType.celo_asset_education,
        selectedAction: NotificationBannerCTATypes.decline,
        notificationId: NotificationType.celo_asset_education,
        notificationPositionInList: 0,
      })
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
      })
      const { getByText } = render(
        <Provider store={store}>
          <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
        </Provider>
      )

      fireEvent.press(getByText('notification.cta'))

      expect(AppAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_select, {
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
      })
      const { getByText } = render(
        <Provider store={store}>
          <NotificationCenter {...getMockStackScreenProps(Screens.NotificationCenter)} />
        </Provider>
      )

      fireEvent.press(getByText('dismiss'))

      expect(AppAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_select, {
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

      expect(store.getActions()).toEqual([])

      fireEvent.press(getByText('Press Remote'))
      expect(store.getActions()).toEqual([openUrl(testNotification.ctaUri, false, true)])
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

      expect(store.getActions()).toEqual([])

      fireEvent.press(getByText('Press Internal'))
      expect(store.getActions()).toEqual([openUrl(testNotification.ctaUri, false, true)])
      fireEvent.press(getByText('Press External'))
      expect(store.getActions()).toEqual([
        openUrl(testNotification.ctaUri, false, true),
        openUrl(testNotification.ctaUri, true, true),
      ])
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
      expect(store.getActions()).toEqual([openUrl('https://example.com', false, true)])

      expect(CleverTap.pushInboxNotificationClickedEventForId).toBeCalledWith(
        mockExpectedCleverTapInboxMessage.id
      )

      expect(AppAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_select, {
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

      expect(AppAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_select, {
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
        expect(AppAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_impression, {
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

import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { openUrl } from 'src/app/actions'
import { DAYS_TO_BACKUP } from 'src/backup/consts'
import { fetchAvailableRewards } from 'src/consumerIncentives/slice'
import { SuperchargeToken } from 'src/consumerIncentives/types'
import NotificationBox from 'src/home/NotificationBox'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { Currency } from 'src/utils/currencies'
import { createMockStore, getElementText } from 'test/utils'
import { mockE164Number, mockE164NumberPepper, mockPaymentRequests } from 'test/values'

const TWO_DAYS_MS = 2 * 24 * 60 * 1000
const RECENT_BACKUP_TIME = new Date().getTime() - TWO_DAYS_MS
const EXPIRED_BACKUP_TIME = RECENT_BACKUP_TIME - DAYS_TO_BACKUP

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

const storeDataNotificationsEnabled = {
  goldToken: { educationCompleted: false },
  account: {
    backupCompleted: false,
    dismissedGetVerified: false,
    accountCreationTime: EXPIRED_BACKUP_TIME,
  },
  paymentRequest: {
    incomingPaymentRequests: mockPaymentRequests.slice(0, 2),
  },
  home: {
    notifications: {
      testNotification,
    },
  },
  verify: { komenci: { errorTimestamps: [] }, status: { komenci: false } },
}

const storeDataNotificationsDisabled = {
  goldToken: { educationCompleted: true },
  account: {
    backupCompleted: true,
    dismissedInviteFriends: true,
    dismissedGetVerified: true,
    accountCreationTime: RECENT_BACKUP_TIME,
  },
  paymentRequest: {
    incomingPaymentRequests: [],
  },
  home: {
    notifications: {
      testNotification: {
        ...testNotification,
        dismissed: true,
      },
    },
  },
  verify: { komenci: { errorTimestamps: [] }, status: { komenci: false } },
}

const testReward = {
  amount: '2',
  contractAddress: 'contractAddress',
  createdAt: Date.now(),
  index: 0,
  proof: [],
  tokenAddress: 'tokenAddress',
}

const superchargeSetUp = {
  web3: {
    account: 'account',
  },
  app: {
    numberVerified: true,
    superchargeTokens: [
      {
        token: SuperchargeToken.cUSD,
        minBalance: 10,
        maxBalance: 1000,
      },
    ],
  },
  supercharge: {
    availableRewards: [testReward],
  },
}

const superchargeSetUpWithoutRewards = {
  ...superchargeSetUp,
  supercharge: {
    availableRewards: [],
  },
}

describe('NotificationBox', () => {
  it('renders correctly for with all notifications', () => {
    const store = createMockStore({
      ...storeDataNotificationsEnabled,
      account: {
        ...storeDataNotificationsEnabled.account,
        e164PhoneNumber: mockE164Number,
      },
      identity: { e164NumberToSalt: { [mockE164Number]: mockE164NumberPepper } },
      stableToken: { balances: { [Currency.Dollar]: '0.00' } },
      goldToken: { balance: '0.00' },
    })
    const tree = render(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders backup when backup is late', () => {
    const store = createMockStore({
      ...storeDataNotificationsDisabled,
      account: {
        backupCompleted: false,
        accountCreationTime: EXPIRED_BACKUP_TIME,
      },
    })
    const { getByText } = render(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )
    expect(getByText('backupKeyNotification')).toBeTruthy()
  })

  it('renders educations when not complete yet', () => {
    const store = createMockStore({
      ...storeDataNotificationsDisabled,
      goldToken: { educationCompleted: false },
    })
    const { getByText } = render(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )
    expect(getByText('whatIsGold')).toBeTruthy()
    // Functionality disabled for now
    // expect(getByText('inviteAnyone')).toBeTruthy()
  })

  it('renders incoming payment request when they exist', () => {
    const store = createMockStore({
      ...storeDataNotificationsDisabled,
      account: {
        ...storeDataNotificationsDisabled.account,
      },
      paymentRequest: {
        incomingPaymentRequests: [mockPaymentRequests[0]],
      },
    })
    const { getByTestId } = render(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )

    const titleElement = getByTestId('IncomingPaymentRequestNotification/FAKE_ID_1/Title')
    expect(getElementText(titleElement)).toBe('incomingPaymentRequestNotificationTitle, {}')
    const amountElement = getByTestId('IncomingPaymentRequestNotification/FAKE_ID_1/Amount')
    expect(getElementText(amountElement)).toBe('₱266,000.00')
    const detailsElement = getByTestId('IncomingPaymentRequestNotification/FAKE_ID_1/Details')
    expect(getElementText(detailsElement)).toBe('Dinner for me and the gals, PIZZAA!')
  })

  it('renders incoming payment requests when they exist', () => {
    const store = createMockStore({
      ...storeDataNotificationsDisabled,
      account: {
        ...storeDataNotificationsDisabled.account,
      },
      paymentRequest: {
        incomingPaymentRequests: mockPaymentRequests,
      },
    })
    const { getByText } = render(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )
    expect(getByText(/incomingPaymentRequestsSummaryTitle/)).toBeTruthy()
  })

  it('renders outgoing payment requests when they exist', () => {
    const store = createMockStore({
      ...storeDataNotificationsDisabled,
      account: {
        ...storeDataNotificationsDisabled.account,
      },
      paymentRequest: {
        outgoingPaymentRequests: mockPaymentRequests,
      },
    })
    const { getByText } = render(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )
    expect(getByText(/outgoingPaymentRequestsSummaryTitle/)).toBeTruthy()
  })

  it('renders outgoing payment request when they exist', () => {
    const store = createMockStore({
      ...storeDataNotificationsDisabled,
      account: {
        ...storeDataNotificationsDisabled.account,
      },
      paymentRequest: {
        outgoingPaymentRequests: [mockPaymentRequests[0]],
      },
    })
    const { getByTestId } = render(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )

    const titleElement = getByTestId('OutgoingPaymentRequestNotification/FAKE_ID_1/Title')
    expect(getElementText(titleElement)).toBe(
      'outgoingPaymentRequestNotificationTitle, {"name":"John Doe"}'
    )
    const amountElement = getByTestId('OutgoingPaymentRequestNotification/FAKE_ID_1/Amount')
    expect(getElementText(amountElement)).toBe('₱266,000.00')
    const detailsElement = getByTestId('OutgoingPaymentRequestNotification/FAKE_ID_1/Details')
    expect(getElementText(detailsElement)).toBe('Dinner for me and the gals, PIZZAA!')
  })

  it('renders verification reminder when not verified', () => {
    const store = createMockStore({
      ...storeDataNotificationsDisabled,
      account: {
        ...storeDataNotificationsDisabled.account,
        dismissedGetVerified: false,
        e164PhoneNumber: mockE164Number,
      },
      identity: { e164NumberToSalt: { [mockE164Number]: mockE164NumberPepper } },
      stableToken: { balances: { [Currency.Dollar]: '0.00' } },
    })
    const { getByText } = render(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )
    expect(getByText('notification.body')).toBeTruthy()
  })

  it('does not render verification reminder when insufficient balance', () => {
    const store = createMockStore({
      ...storeDataNotificationsDisabled,
    })
    const { queryByText } = render(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )
    expect(queryByText('notification.body')).toBeFalsy()
  })

  it('renders all remote notifications that were not dismissed', () => {
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
        <NotificationBox />
      </Provider>
    )
    expect(queryByText('Notification 1')).toBeFalsy()
    expect(queryByText('Notification 2')).toBeTruthy()
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
        <NotificationBox />
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

  it('renders claim rewards notification when there are supercharge rewards', () => {
    const store = createMockStore(superchargeSetUp)
    const { queryByTestId, getByTestId } = render(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )

    expect(queryByTestId('NotificationView/claimSuperchargeRewards')).toBeTruthy()
    expect(queryByTestId('NotificationView/keepSupercharging')).toBeFalsy()
    expect(queryByTestId('NotificationView/startSupercharging')).toBeFalsy()

    fireEvent.press(
      getByTestId('claimSuperchargeRewards/CallToActions/superchargeNotificationStart/Button')
    )
    expect(navigate).toHaveBeenCalledWith(Screens.ConsumerIncentivesHomeScreen)
  })

  it('renders keep supercharging notification when expected', () => {
    const store = createMockStore({
      ...superchargeSetUpWithoutRewards,
      tokens: {
        tokenBalances: {
          cUSD: {
            isCoreToken: true,
            balance: '100',
            symbol: 'cUSD',
          },
        },
      },
    })
    const { queryByTestId, getByTestId } = render(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )

    expect(queryByTestId('NotificationView/claimSuperchargeRewards')).toBeFalsy()
    expect(queryByTestId('NotificationView/keepSupercharging')).toBeTruthy()
    expect(queryByTestId('NotificationView/startSupercharging')).toBeFalsy()

    fireEvent.press(
      getByTestId('keepSupercharging/CallToActions/superchargingNotificationStart/Button')
    )
    expect(navigate).toHaveBeenCalledWith(Screens.ConsumerIncentivesHomeScreen)
  })

  it('does not renders keep supercharging because is dismissed', () => {
    const store = createMockStore({
      ...superchargeSetUpWithoutRewards,
      tokens: {
        tokenBalances: {
          cUSD: {
            isCoreToken: true,
            balance: '100',
            symbol: 'cUSD',
          },
        },
      },
      account: {
        dismissedKeepSupercharging: true,
      },
    })
    const { queryByTestId } = render(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )

    expect(queryByTestId('NotificationView/claimSuperchargeRewards')).toBeFalsy()
    expect(queryByTestId('NotificationView/keepSupercharging')).toBeFalsy()
    expect(queryByTestId('NotificationView/startSupercharging')).toBeFalsy()
  })

  it('renders start supercharging notification if number is not verified', () => {
    const store = createMockStore({
      ...superchargeSetUpWithoutRewards,
      tokens: {
        tokenBalances: {
          cUSD: {
            isCoreToken: true,
            balance: '100',
            symbol: 'cUSD',
          },
        },
      },
      app: {
        numberVerified: false,
      },
    })
    const { queryByTestId, getByTestId } = render(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )

    expect(queryByTestId('NotificationView/claimSuperchargeRewards')).toBeFalsy()
    expect(queryByTestId('NotificationView/keepSupercharging')).toBeFalsy()
    expect(queryByTestId('NotificationView/startSupercharging')).toBeTruthy()

    fireEvent.press(
      getByTestId('startSupercharging/CallToActions/startSuperchargingNotificationStart/Button')
    )
    expect(navigate).toHaveBeenCalledWith(Screens.ConsumerIncentivesHomeScreen)
  })

  it('renders start supercharging notification if user does not have enough balance', () => {
    const store = createMockStore({
      ...superchargeSetUpWithoutRewards,
      tokens: {
        tokenBalances: {
          cUSD: {
            isCoreToken: true,
            balance: '5',
            symbol: 'cUSD',
          },
        },
      },
    })
    const { queryByTestId, getByTestId } = render(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )

    expect(queryByTestId('NotificationView/claimSuperchargeRewards')).toBeFalsy()
    expect(queryByTestId('NotificationView/keepSupercharging')).toBeFalsy()
    expect(queryByTestId('NotificationView/startSupercharging')).toBeTruthy()

    fireEvent.press(
      getByTestId('startSupercharging/CallToActions/startSuperchargingNotificationStart/Button')
    )
    expect(navigate).toHaveBeenCalledWith(Screens.ConsumerIncentivesHomeScreen)
  })

  it('does not renders start supercharging because is dismissed', () => {
    const store = createMockStore({
      ...superchargeSetUpWithoutRewards,
      tokens: {
        tokenBalances: {
          cUSD: {
            isCoreToken: true,
            balance: '5',
            symbol: 'cUSD',
          },
        },
      },
      account: {
        dismissedStartSupercharging: true,
      },
    })
    const { queryByTestId } = render(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )

    expect(queryByTestId('NotificationView/claimSuperchargeRewards')).toBeFalsy()
    expect(queryByTestId('NotificationView/keepSupercharging')).toBeFalsy()
    expect(queryByTestId('NotificationView/startSupercharging')).toBeFalsy()
  })
})

import { act, fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { openUrl } from 'src/app/actions'
import { fetchAvailableRewards } from 'src/consumerIncentives/slice'
import { ONE_CUSD_REWARD_RESPONSE } from 'src/consumerIncentives/testValues'
import NotificationBox from 'src/home/NotificationBox'
import { ensurePincode, navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getFeatureGate } from 'src/statsig'
import { NetworkId } from 'src/transactions/types'
import { createMockStore } from 'test/utils'
import {
  mockCusdAddress,
  mockCusdTokenId,
  mockE164Number,
  mockE164NumberPepper,
  mockTokenBalances,
} from 'test/values'

const TWO_DAYS_MS = 2 * 24 * 60 * 1000
const BACKUP_TIME = new Date().getTime() - TWO_DAYS_MS

const mockedEnsurePincode = jest.mocked(ensurePincode)
jest.mock('src/statsig')

jest.mock('src/web3/networkConfig', () => {
  const originalModule = jest.requireActual('src/web3/networkConfig')
  return {
    __esModule: true,
    ...originalModule,
    default: {
      ...originalModule.default,
      networkToNetworkId: {
        celo: 'celo-alfajores',
        ethereum: 'ethereuim-sepolia',
      },
      defaultNetworkId: 'celo-alfajores',
    },
  }
})

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
  account: {
    backupCompleted: false,
    dismissedGetVerified: false,
    accountCreationTime: BACKUP_TIME,
    celoEducationCompleted: false,
  },
  home: {
    notifications: {
      testNotification,
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

describe('NotificationBox', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(getFeatureGate).mockReturnValue(false)
  })
  it('renders correctly for with all notifications', () => {
    const store = createMockStore({
      ...storeDataNotificationsEnabled,
      account: {
        ...storeDataNotificationsEnabled.account,
        e164PhoneNumber: mockE164Number,
      },
      identity: { e164NumberToSalt: { [mockE164Number]: mockE164NumberPepper } },
      tokens: {
        tokenBalances: mockTokenBalances,
      },
    })
    const tree = render(
      <Provider store={store}>
        <NotificationBox showOnlyHomeScreenNotifications={false} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders reverify notification if decentrally verified and not CPV', () => {
    const store = createMockStore({
      app: {
        numberVerified: true,
        phoneNumberVerified: false,
      },
    })
    const { getByText } = render(
      <Provider store={store}>
        <NotificationBox showOnlyHomeScreenNotifications={false} />
      </Provider>
    )

    expect(getByText('reverifyUsingCPVHomecard.description')).toBeTruthy()

    fireEvent.press(getByText('reverifyUsingCPVHomecard.buttonLabel'))
    expect(navigate).toHaveBeenCalledWith(Screens.VerificationStartScreen, { hasOnboarded: true })
  })

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
        <NotificationBox showOnlyHomeScreenNotifications={false} />
      </Provider>
    )
    expect(getByText('whatIsGold')).toBeTruthy()
    // Functionality disabled for now
    // expect(getByText('inviteAnyone')).toBeTruthy()
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
    })
    const { getByText } = render(
      <Provider store={store}>
        <NotificationBox showOnlyHomeScreenNotifications={false} />
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
        <NotificationBox showOnlyHomeScreenNotifications={false} />
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
        <NotificationBox showOnlyHomeScreenNotifications={false} />
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
        <NotificationBox showOnlyHomeScreenNotifications={false} />
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

  it('renders keylessBackup notification when flag is turned on', async () => {
    const store = createMockStore({
      account: {
        backupCompleted: false,
      },
    })
    jest.mocked(getFeatureGate).mockReturnValue(true)
    mockedEnsurePincode.mockImplementation(() => Promise.resolve(true))
    const { queryByTestId, getByTestId } = render(
      <Provider store={store}>
        <NotificationBox showOnlyHomeScreenNotifications={false} />
      </Provider>
    )

    expect(queryByTestId('NotificationView/keyless_backup_prompt')).toBeTruthy()

    await act(() => {
      fireEvent.press(
        getByTestId('KeylessBackupNotification/CallToActions/keylessBackupCTA/Button')
      )
    })
    expect(navigate).toHaveBeenCalledWith(Screens.WalletSecurityPrimer)
  })

  it('renders seed phrase backup notification when keyless backup flag is turned off', async () => {
    const store = createMockStore({
      account: {
        backupCompleted: false,
      },
    })
    jest.mocked(getFeatureGate).mockReturnValue(false)
    mockedEnsurePincode.mockImplementation(() => Promise.resolve(true))
    const { queryByTestId, getByTestId } = render(
      <Provider store={store}>
        <NotificationBox showOnlyHomeScreenNotifications={false} />
      </Provider>
    )

    expect(queryByTestId('NotificationView/backup_prompt')).toBeTruthy()

    await act(() => {
      fireEvent.press(getByTestId('BackupKeyNotification/CallToActions/backupKeyCTA/Button'))
    })
    expect(navigate).toHaveBeenCalledWith(Screens.BackupIntroduction)
  })

  it('renders claim rewards notification when there are supercharge rewards', () => {
    const store = createMockStore(superchargeSetUp)
    const { queryByTestId, getByTestId } = render(
      <Provider store={store}>
        <NotificationBox showOnlyHomeScreenNotifications={false} />
      </Provider>
    )

    expect(queryByTestId('NotificationView/supercharge_available')).toBeTruthy()
    expect(queryByTestId('NotificationView/supercharging')).toBeFalsy()
    expect(queryByTestId('NotificationView/start_supercharging')).toBeFalsy()

    fireEvent.press(
      getByTestId('supercharge_available/CallToActions/superchargeNotificationStart/Button')
    )
    expect(navigate).toHaveBeenCalledWith(Screens.ConsumerIncentivesHomeScreen)
  })

  it('renders keep supercharging notification when expected', () => {
    const store = createMockStore({
      ...superchargeWithoutRewardsSetUp,
      tokens: {
        tokenBalances: mockcUsdBalance,
      },
    })
    const { queryByTestId, getByTestId } = render(
      <Provider store={store}>
        <NotificationBox showOnlyHomeScreenNotifications={false} />
      </Provider>
    )

    expect(queryByTestId('NotificationView/supercharge_available')).toBeFalsy()
    expect(queryByTestId('NotificationView/supercharging')).toBeTruthy()
    expect(queryByTestId('NotificationView/start_supercharging')).toBeFalsy()

    fireEvent.press(
      getByTestId('supercharging/CallToActions/superchargingNotificationStart/Button')
    )
    expect(navigate).toHaveBeenCalledWith(Screens.ConsumerIncentivesHomeScreen)
  })

  it('does not renders keep supercharging because is dismissed', () => {
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
        <NotificationBox showOnlyHomeScreenNotifications={false} />
      </Provider>
    )

    expect(queryByTestId('NotificationView/supercharge_available')).toBeFalsy()
    expect(queryByTestId('NotificationView/supercharging')).toBeFalsy()
    expect(queryByTestId('NotificationView/start_supercharging')).toBeFalsy()
  })

  it('renders start supercharging notification if number is not verified', () => {
    const store = createMockStore({
      ...superchargeWithoutRewardsSetUp,
      tokens: {
        tokenBalances: mockcUsdBalance,
      },
      app: {
        ...superchargeWithoutRewardsSetUp.app,
        phoneNumberVerified: false,
      },
    })
    const { queryByTestId, getByTestId } = render(
      <Provider store={store}>
        <NotificationBox showOnlyHomeScreenNotifications={false} />
      </Provider>
    )

    expect(queryByTestId('NotificationView/supercharge_available')).toBeFalsy()
    expect(queryByTestId('NotificationView/supercharging')).toBeFalsy()
    expect(queryByTestId('NotificationView/start_supercharging')).toBeTruthy()

    fireEvent.press(
      getByTestId('start_supercharging/CallToActions/startSuperchargingNotificationStart/Button')
    )
    expect(navigate).toHaveBeenCalledWith(Screens.ConsumerIncentivesHomeScreen)
  })

  it('renders start supercharging notification if user does not have enough balance', () => {
    const store = createMockStore({
      ...superchargeWithoutRewardsSetUp,
      tokens: {
        tokenBalances: mockcUsdWithoutEnoughBalance,
      },
    })
    const { queryByTestId, getByTestId } = render(
      <Provider store={store}>
        <NotificationBox showOnlyHomeScreenNotifications={false} />
      </Provider>
    )

    expect(queryByTestId('NotificationView/supercharge_available')).toBeFalsy()
    expect(queryByTestId('NotificationView/supercharging')).toBeFalsy()
    expect(queryByTestId('NotificationView/start_supercharging')).toBeTruthy()

    fireEvent.press(
      getByTestId('start_supercharging/CallToActions/startSuperchargingNotificationStart/Button')
    )
    expect(navigate).toHaveBeenCalledWith(Screens.ConsumerIncentivesHomeScreen)
  })

  it('does not renders start supercharging because is dismissed', () => {
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
        <NotificationBox showOnlyHomeScreenNotifications={false} />
      </Provider>
    )

    expect(queryByTestId('NotificationView/supercharge_available')).toBeFalsy()
    expect(queryByTestId('NotificationView/supercharging')).toBeFalsy()
    expect(queryByTestId('NotificationView/start_supercharging')).toBeFalsy()
  })

  it('only renders notifications marked for the home screen when showOnlyHomeScreenNotifications is true', () => {
    const store = createMockStore({
      ...storeDataNotificationsDisabled,
      home: {
        notifications: {
          notification1: {
            ...testNotification,
            dismissed: true,
            showOnHomeScreen: true,
            content: {
              en: {
                ...testNotification.content.en,
                body: 'Notification 1',
              },
            },
          },
          notification2: {
            ...testNotification,
            showOnHomeScreen: true, // This is the only one that should show
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
              },
            },
          },
        },
      },
    })
    const { queryByText } = render(
      <Provider store={store}>
        <NotificationBox showOnlyHomeScreenNotifications={true} />
      </Provider>
    )
    expect(queryByText('Notification 1')).toBeFalsy()
    expect(queryByText('Notification 2')).toBeTruthy()
    expect(queryByText('Notification 3')).toBeFalsy()
  })
})

import { act, fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { openUrl } from 'src/app/actions'
import NotificationBox from 'src/home/NotificationBox'
import { ensurePincode, navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore } from 'test/utils'
import { mockE164Number, mockTokenBalances } from 'test/values'
import { ONBOARDING_FEATURES_ENABLED } from 'src/config'
import { ToggleableOnboardingFeatures } from 'src/onboarding/types'

const TWO_DAYS_MS = 2 * 24 * 60 * 1000
const BACKUP_TIME = new Date().getTime() - TWO_DAYS_MS

jest.mock('src/config', () => ({
  ...jest.requireActual('src/config'),
  ONBOARDING_FEATURES_ENABLED: { CloudBackup: false },
}))
const mockedEnsurePincode = jest.mocked(ensurePincode)

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

describe('NotificationBox', () => {
  beforeEach(() => {
    jest.replaceProperty(
      ONBOARDING_FEATURES_ENABLED,
      ToggleableOnboardingFeatures.CloudBackup,
      false
    )
    jest.clearAllMocks()
  })
  it('renders correctly for with all notifications', () => {
    const store = createMockStore({
      ...storeDataNotificationsEnabled,
      account: {
        ...storeDataNotificationsEnabled.account,
        e164PhoneNumber: mockE164Number,
      },
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
        <NotificationBox showOnlyHomeScreenNotifications={false} />
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

  it('renders keylessBackup notification when flag is turned on', async () => {
    const store = createMockStore({
      account: {
        backupCompleted: false,
        cloudBackupCompleted: false,
      },
    })
    jest.replaceProperty(
      ONBOARDING_FEATURES_ENABLED,
      ToggleableOnboardingFeatures.CloudBackup,
      true
    )
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

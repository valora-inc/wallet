import {
  Actions,
  celebratedNftFound,
  cleverTapInboxMessagesReceived,
  nftCelebrationDisplayed,
  nftRewardDisplayed,
  nftRewardReadyToDisplay,
} from 'src/home/actions'
import {
  DEFAULT_PRIORITY,
  NftCelebrationStatus,
  Notification,
  State,
  initialState,
  homeReducer as reducer,
} from 'src/home/reducers'
import { NetworkId } from 'src/transactions/types'
import { mockCleverTapInboxMessage, mockContractAddress } from 'test/values'

const createTestNotification = (body: string) => ({
  ctaUri: 'https://celo.org',
  priority: DEFAULT_PRIORITY,
  content: {
    en: {
      body,
      cta: 'Start',
      dismiss: 'Dismiss',
    },
  },
})

const mockRewardProperties = {
  deepLink: 'celo://test',
  rewardExpirationDate: '3000-12-01T00:00:00.000Z',
  rewardReminderDate: '3000-01-01T00:00:00.000Z',
}

describe('home reducer', () => {
  it('should return the initial state', () => {
    // @ts-ignore
    expect(reducer(undefined, {})).toEqual(initialState)
  })

  it('UPDATE_NOTIFICATIONS should override based on the id', () => {
    const notification1 = createTestNotification('Notification 1')
    const notification2 = createTestNotification('Notification 2')
    let updatedState = reducer(undefined, {
      type: Actions.UPDATE_NOTIFICATIONS,
      notifications: {
        notification1,
        notification2,
      },
    })
    expect(updatedState).toEqual({
      ...initialState,
      notifications: {
        notification1,
        notification2,
      },
    })

    updatedState = reducer(updatedState, {
      type: Actions.UPDATE_NOTIFICATIONS,
      notifications: {
        notification1: {
          ...notification1,
          ctaUri: 'https://valoraapp.com',
          minVersion: '1.8.0',
          priority: 50,
        },
      },
    })
    // Notification 2 deleted, notification 1 updated.
    expect(updatedState).toEqual({
      ...initialState,
      notifications: {
        notification1: {
          ...notification1,
          ctaUri: 'https://valoraapp.com',
          minVersion: '1.8.0',
          priority: 50,
        },
      },
    })

    // Now we remove one of the optional fields
    updatedState = reducer(updatedState, {
      type: Actions.UPDATE_NOTIFICATIONS,
      notifications: {
        notification1,
      },
    })
    // The optional field is now removed
    expect(updatedState).toEqual({
      ...initialState,
      notifications: {
        notification1,
      },
    })

    // Now we update an already dismissed notification
    updatedState = reducer(
      {
        ...updatedState,
        notifications: {
          ...updatedState.notifications,
          notification1: {
            ...(updatedState.notifications.notification1 as Notification),
            dismissed: true,
          },
        },
      },
      {
        type: Actions.UPDATE_NOTIFICATIONS,
        notifications: {
          notification1: {
            ...notification1,
            iconUrl: 'http://example.com/icon.png',
          },
        },
      }
    )
    // The notification remains dismissed
    expect(updatedState).toEqual({
      ...initialState,
      notifications: {
        notification1: {
          ...notification1,
          iconUrl: 'http://example.com/icon.png',
          dismissed: true,
        },
      },
    })
  })

  it('should dismiss notifications', () => {
    const notification1 = createTestNotification('Notification 1')
    const notification2 = createTestNotification('Notification 2')
    expect(
      reducer(
        {
          ...initialState,
          notifications: {
            notification1,
            notification2,
          },
        },
        {
          type: Actions.DISMISS_NOTIFICATION,
          id: 'notification1',
        }
      )
    ).toEqual({
      ...initialState,
      notifications: {
        notification1: {
          ...notification1,
          dismissed: true,
        },
        notification2,
      },
    })
  })

  it('should update cleverTapInboxMessages', () => {
    const messages = [mockCleverTapInboxMessage]

    const updatedState = reducer(undefined, cleverTapInboxMessagesReceived(messages))

    expect(updatedState.cleverTapInboxMessages).toEqual(messages)
  })

  it('should set nftCelebration', () => {
    const updatedState = reducer(
      undefined,
      celebratedNftFound({
        networkId: NetworkId['celo-alfajores'],
        contractAddress: mockContractAddress,
        ...mockRewardProperties,
      })
    )

    expect(updatedState.nftCelebration).toEqual({
      networkId: NetworkId['celo-alfajores'],
      contractAddress: mockContractAddress,
      status: NftCelebrationStatus.celebrationReadyToDisplay,
      ...mockRewardProperties,
    })
  })

  it('should mark nftCelebration as displayed', () => {
    const state = {
      nftCelebration: { status: NftCelebrationStatus.celebrationReadyToDisplay },
    } as State
    const updatedState = reducer(state, nftCelebrationDisplayed())

    expect(updatedState.nftCelebration).toHaveProperty(
      'status',
      NftCelebrationStatus.celebrationDisplayed
    )
  })

  it('should set reward as ready', () => {
    const state = { nftCelebration: { status: NftCelebrationStatus.celebrationDisplayed } } as State
    const updatedState = reducer(
      state,
      nftRewardReadyToDisplay({ showReminder: false, valuesToSync: mockRewardProperties })
    )

    expect(updatedState.nftCelebration).toHaveProperty(
      'status',
      NftCelebrationStatus.rewardReadyToDisplay
    )

    expect(updatedState.nftCelebration).toEqual(expect.objectContaining(mockRewardProperties))
  })

  it('should set reminder as ready', () => {
    const state = { nftCelebration: { status: NftCelebrationStatus.rewardDisplayed } } as State
    const updatedState = reducer(
      state,
      nftRewardReadyToDisplay({ showReminder: true, valuesToSync: mockRewardProperties })
    )

    expect(updatedState.nftCelebration).toHaveProperty(
      'status',
      NftCelebrationStatus.reminderReadyToDisplay
    )

    expect(updatedState.nftCelebration).toEqual(expect.objectContaining(mockRewardProperties))
  })

  it('should mark reward as displayed', () => {
    const state = { nftCelebration: { status: NftCelebrationStatus.rewardReadyToDisplay } } as State
    const updatedState = reducer(state, nftRewardDisplayed())

    expect(updatedState.nftCelebration).toHaveProperty(
      'status',
      NftCelebrationStatus.rewardDisplayed
    )
  })

  it('should mark reminder as displayed', () => {
    const state = {
      nftCelebration: { status: NftCelebrationStatus.reminderReadyToDisplay },
    } as State
    const updatedState = reducer(state, nftRewardDisplayed())

    expect(updatedState.nftCelebration).toEqual({
      status: NftCelebrationStatus.reminderDisplayed,
    })
  })
})

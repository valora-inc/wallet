import DeviceInfo from 'react-native-device-info'
import { NftCelebrationStatus } from 'src/home/reducers'
import {
  cleverTapInboxMessagesSelector,
  getExtraNotifications,
  nftCelebrationSelector,
  showNftCelebrationSelector,
  showNftRewardSelector,
} from 'src/home/selectors'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { NetworkId } from 'src/transactions/types'
import { getMockStoreData } from 'test/utils'
import { mockCleverTapInboxMessage } from 'test/values'

jest.mock('src/statsig')

describe(getExtraNotifications, () => {
  const mockedVersion = DeviceInfo.getVersion as jest.MockedFunction<typeof DeviceInfo.getVersion>
  mockedVersion.mockImplementation(() => '1.8.0')

  it('only returns notifications that are not dismissed, compatible with the current app version and country', () => {
    const state = getMockStoreData({
      networkInfo: {
        userLocationData: {
          countryCodeAlpha2: 'PH',
          region: null,
          ipAddress: null,
        },
      },
      home: {
        notifications: {
          notif1: {
            ctaUri: 'https://celo.org',
            content: {
              en: { body: 'A notification', cta: 'Start', dismiss: 'Dismiss' },
            },
          },
          notif2: {
            ctaUri: 'https://celo.org',
            content: {
              en: { body: 'A dismissed notification', cta: 'Start', dismiss: 'Dismiss' },
            },
            dismissed: true,
          },
          notif3: {
            ctaUri: 'https://celo.org',
            content: {
              en: {
                body: 'A notification within the version range',
                cta: 'Start',
                dismiss: 'Dismiss',
              },
            },
            minVersion: '1.8.0',
            maxVersion: '2.0.0',
          },
          notif4: {
            ctaUri: 'https://celo.org',
            content: {
              en: {
                body: 'A notification above the app version',
                cta: 'Start',
                dismiss: 'Dismiss',
              },
            },
            minVersion: '1.9.0',
          },
          notif5: {
            ctaUri: 'https://celo.org',
            content: {
              en: {
                body: 'A notification below the app version',
                cta: 'Start',
                dismiss: 'Dismiss',
              },
            },
            maxVersion: '1.7.9',
          },
          notif6: {
            ctaUri: 'https://celo.org',
            content: {
              en: {
                body: 'A notification only for France',
                cta: 'Start',
                dismiss: 'Dismiss',
              },
            },
            countries: ['FR'],
          },
          notif7: {
            ctaUri: 'https://celo.org',
            content: {
              en: {
                body: 'A notification only for the Philippines',
                cta: 'Start',
                dismiss: 'Dismiss',
              },
            },
            countries: ['PH'],
          },
          notif8: {
            ctaUri: 'https://celo.org',
            content: {
              en: {
                body: 'A notification for every country except the Philippines',
                cta: 'Start',
                dismiss: 'Dismiss',
              },
            },
            blockedCountries: ['PH'],
          },
          notif9: {
            ctaUri: 'https://celo.org',
            content: {
              en: {
                body: 'A notification for every country except France',
                cta: 'Start',
                dismiss: 'Dismiss',
              },
            },
            blockedCountries: ['FR'],
          },
        },
      },
    })

    const extraNotifications = getExtraNotifications(state)
    expect(Object.keys(extraNotifications)).toEqual(['notif1', 'notif3', 'notif7', 'notif9'])
  })
})

describe('cleverTapInboxMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns messages when feature gate is enabled', () => {
    jest.mocked(getFeatureGate).mockReturnValueOnce(true)
    const state = getMockStoreData({
      home: {
        cleverTapInboxMessages: [mockCleverTapInboxMessage],
      },
    })
    const messages = cleverTapInboxMessagesSelector(state)
    expect(messages).toEqual([mockCleverTapInboxMessage])
  })

  it('does not return messages when feature gate is disabled', () => {
    jest.mocked(getFeatureGate).mockReturnValueOnce(false)
    const state = getMockStoreData({
      home: {
        cleverTapInboxMessages: [mockCleverTapInboxMessage],
      },
    })
    const messages = cleverTapInboxMessagesSelector(state)
    expect(messages).toEqual([])
  })
})

describe('nftCelebrationSelector', () => {
  it('should return falsy value when nftCelebration is not set', () => {
    const state = getMockStoreData({
      home: {
        nftCelebration: undefined,
      },
    })

    const data = nftCelebrationSelector(state)
    expect(data).toBeFalsy()
  })

  it('should return networkId, contractAddress when nftCelebration is set', () => {
    const state = getMockStoreData({
      home: {
        nftCelebration: {
          networkId: NetworkId['celo-alfajores'],
          contractAddress: '0xTEST',
        },
      },
    })

    const data = nftCelebrationSelector(state)
    expect(data).toEqual({
      networkId: NetworkId['celo-alfajores'],
      contractAddress: '0xTEST',
    })
  })
})

describe('showNftCelebrationSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers({ now: new Date('3000-01-01T00:00:00.000Z') })
  })

  afterEach(() => {
    jest.useFakeTimers({ doNotFake: ['Date'] })
  })

  it('should return false when feature gate is disabled', () => {
    jest
      .mocked(getFeatureGate)
      .mockImplementation((featureGate) => featureGate !== StatsigFeatureGates.SHOW_NFT_CELEBRATION)

    const state = getMockStoreData({
      home: {
        nftCelebration: {
          status: NftCelebrationStatus.celebrationReadyToDisplay,
        },
      },
    })

    const canShowNftCelebration = showNftCelebrationSelector(state)
    expect(canShowNftCelebration).toBe(false)
  })

  it('should return false when nftCelebration is not defined', () => {
    jest.mocked(getFeatureGate).mockReturnValueOnce(true)

    const state = getMockStoreData({
      home: {
        nftCelebration: null,
      },
    })

    const canShowNftCelebration = showNftCelebrationSelector(state)
    expect(canShowNftCelebration).toBe(false)
  })

  it('should return true when nftCelebration is not yet displayed', () => {
    jest.mocked(getFeatureGate).mockReturnValueOnce(true)

    const state = getMockStoreData({
      home: {
        nftCelebration: {
          status: NftCelebrationStatus.celebrationReadyToDisplay,
        },
      },
    })

    const canShowNftCelebration = showNftCelebrationSelector(state)
    expect(canShowNftCelebration).toBe(true)
  })
})

describe('showNftRewardSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers({ now: new Date('3000-01-01T00:00:00.000Z') })
  })

  afterEach(() => {
    jest.useFakeTimers({ doNotFake: ['Date'] })
  })

  it('should return false when feature gate is disabled', () => {
    jest
      .mocked(getFeatureGate)
      .mockImplementation((featureGate) => featureGate !== StatsigFeatureGates.SHOW_NFT_REWARD)

    const state = getMockStoreData({
      home: {
        nftCelebration: {
          status: NftCelebrationStatus.rewardReadyToDisplay,
        },
      },
    })

    const canShowNftReward = showNftRewardSelector(state)
    expect(canShowNftReward).toBe(false)
  })

  it('should return false when nftCelebration is not defined', () => {
    jest.mocked(getFeatureGate).mockReturnValueOnce(true)

    const state = getMockStoreData({
      home: {
        nftCelebration: undefined,
      },
    })

    const canShowNftReward = showNftRewardSelector(state)
    expect(canShowNftReward).toBe(false)
  })

  it('should return true when reward is not yet displayed', () => {
    jest.mocked(getFeatureGate).mockReturnValueOnce(true)

    const state = getMockStoreData({
      home: {
        nftCelebration: {
          status: NftCelebrationStatus.rewardReadyToDisplay,
        },
      },
    })

    const canShowNftReward = showNftRewardSelector(state)
    expect(canShowNftReward).toBe(true)
  })

  it('should return true when reminder is not yet displayed', () => {
    jest.mocked(getFeatureGate).mockReturnValueOnce(true)

    const state = getMockStoreData({
      home: {
        nftCelebration: {
          status: NftCelebrationStatus.reminderReadyToDisplay,
        },
      },
    })

    const canShowNftReward = showNftRewardSelector(state)
    expect(canShowNftReward).toBe(true)
  })

  it('should return false when it is expired', () => {
    jest.mocked(getFeatureGate).mockReturnValueOnce(true)

    const state = getMockStoreData({
      home: {
        nftCelebration: {
          status: NftCelebrationStatus.celebrationReadyToDisplay,
          rewardExpirationDate: '2000-01-01T00:00:00.000Z',
        },
      },
    })

    const canShowNftReward = showNftRewardSelector(state)
    expect(canShowNftReward).toBe(false)
  })
})

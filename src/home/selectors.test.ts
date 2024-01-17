import _ from 'lodash'
import DeviceInfo from 'react-native-device-info'
import { cleverTapInboxMessagesSelector, getExtraNotifications } from 'src/home/selectors'
import Logger from 'src/utils/Logger'
import { getMockStoreData } from 'test/utils'
import { mockCleverTapInboxMessage, mockExpectedCleverTapInboxMessage } from 'test/values'

jest.mock('src/utils/Logger')

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
  it('returns cleverTapInboxMessages', () => {
    const state = getMockStoreData({
      home: {
        cleverTapInboxMessages: [mockExpectedCleverTapInboxMessage],
      },
    })

    const messages = cleverTapInboxMessagesSelector(state)
    expect(messages).toEqual([mockCleverTapInboxMessage])
  })

  it('returns message with overriden priority', () => {
    const rawMessageWithOverridenPriority = {
      ...mockExpectedCleverTapInboxMessage,
      msg: {
        ...mockExpectedCleverTapInboxMessage.msg,
        tags: ['priority:1000'],
      },
    }
    const state = getMockStoreData({
      home: {
        cleverTapInboxMessages: [rawMessageWithOverridenPriority],
      },
    })

    const expectedMessage = {
      ...mockCleverTapInboxMessage,
      priority: 1000,
    }
    const messages = cleverTapInboxMessagesSelector(state)
    expect(messages).toEqual([expectedMessage])
  })

  it('returns message with openInExternalBrowser set to `true`', () => {
    const rawMessageWithOpenInExternalBrowserTag = {
      ...mockExpectedCleverTapInboxMessage,
      msg: {
        ...mockExpectedCleverTapInboxMessage.msg,
        tags: ['openInExternalBrowser'],
      },
    }
    const state = getMockStoreData({
      home: {
        cleverTapInboxMessages: [rawMessageWithOpenInExternalBrowserTag],
      },
    })

    const expectedMessage = {
      ...mockCleverTapInboxMessage,
      openInExternalBrowser: true,
    }
    const messages = cleverTapInboxMessagesSelector(state)
    expect(messages).toEqual([expectedMessage])
  })

  it('logs an error when receives not an array as messages', () => {
    const state = getMockStoreData({
      home: {
        cleverTapInboxMessages: undefined,
      },
    })

    const messages = cleverTapInboxMessagesSelector(state)
    expect(messages).toEqual([])
    expect(Logger.error).toHaveBeenCalled()
  })

  it('logs an error when receives message without text', () => {
    const invalidMessage = _.cloneDeep(mockExpectedCleverTapInboxMessage)
    _.set(invalidMessage, 'msg.content[0].message.text', '')

    const state = getMockStoreData({
      home: {
        cleverTapInboxMessages: [invalidMessage],
      },
    })

    const messages = cleverTapInboxMessagesSelector(state)
    expect(messages).toEqual([])
    expect(Logger.error).toHaveBeenCalled()
  })

  it.each(['android', 'ios'])('extracts appropriate link for %s', (os) => {
    jest.doMock('react-native', () => {
      const ReactNative = jest.requireActual('react-native')
      ReactNative.Platform.OS = os
      return ReactNative
    })

    const link = `link for ${os}`

    const messageWithAndroidLink = _.cloneDeep(mockExpectedCleverTapInboxMessage)
    _.set(messageWithAndroidLink, 'msg.content[0].action.links[0].url.android.text', link)

    const state = getMockStoreData({
      home: {
        cleverTapInboxMessages: [messageWithAndroidLink],
      },
    })

    const expectedMessage = {
      ...mockCleverTapInboxMessage,
      ctaUrl: link,
    }
    const messages = cleverTapInboxMessagesSelector(state)
    expect(messages).toEqual([expectedMessage])
  })
})

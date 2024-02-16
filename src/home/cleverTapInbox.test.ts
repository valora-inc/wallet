import CleverTap from 'clevertap-react-native'
import _ from 'lodash'
import { Platform } from 'react-native'
import {
  ExpectedCleverTapInboxMessage,
  cleverTapInboxMessagesChannel,
  parseCleverTapMessages,
} from 'src/home/cleverTapInbox'
import { getFeatureGate } from 'src/statsig'
import Logger from 'src/utils/Logger'
import { mockCleverTapInboxMessage, mockExpectedCleverTapInboxMessage } from 'test/values'

jest.mock('src/statsig')
jest.mock('src/utils/Logger')

jest.mock('clevertap-react-native', () => ({
  addListener: jest.fn(),
  initializeInbox: jest.fn(),
}))

describe('cleverTapInboxMessagesChannel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('initializes CleverTap Inbox when feature gate is enabled', () => {
    jest.mocked(getFeatureGate).mockReturnValueOnce(true)
    cleverTapInboxMessagesChannel()
    expect(CleverTap.initializeInbox).toHaveBeenCalled()
  })

  it('does not initialize CleverTap Inbox when feature gate is disabled', () => {
    jest.mocked(getFeatureGate).mockReturnValueOnce(false)
    cleverTapInboxMessagesChannel()
    expect(CleverTap.initializeInbox).not.toHaveBeenCalled()
  })
})

describe('parseCleverTapInboxMessages', () => {
  it('correctly parses expected clevertap inbox messages', () => {
    const parsedMessages = parseCleverTapMessages([mockExpectedCleverTapInboxMessage])
    expect(parsedMessages).toEqual([mockCleverTapInboxMessage])
  })

  it('correctly parses expected message with overriden priority', () => {
    const rawMessageWithOverridenPriority = {
      ...mockExpectedCleverTapInboxMessage,
      msg: {
        ...mockExpectedCleverTapInboxMessage.msg,
        tags: ['priority:1000'],
      },
    }

    const expectedMessage = {
      ...mockCleverTapInboxMessage,
      priority: 1000,
    }

    const parsedMessages = parseCleverTapMessages([rawMessageWithOverridenPriority])
    expect(parsedMessages).toEqual([expectedMessage])
  })

  it('correctly parses expected message with openInExternalBrowser set to `true`', () => {
    const rawMessageWithOpenInExternalBrowserTag = {
      ...mockExpectedCleverTapInboxMessage,
      msg: {
        ...mockExpectedCleverTapInboxMessage.msg,
        tags: ['openInExternalBrowser'],
      },
    }

    const expectedMessage = {
      ...mockCleverTapInboxMessage,
      openInExternalBrowser: true,
    }

    const parsedMessages = parseCleverTapMessages([rawMessageWithOpenInExternalBrowserTag])
    expect(parsedMessages).toEqual([expectedMessage])
  })

  it('logs an error when receives not an array as messages', () => {
    const invalidMessages = undefined as unknown as ExpectedCleverTapInboxMessage[]
    const parsedMessages = parseCleverTapMessages(invalidMessages)

    expect(parsedMessages).toEqual([])
    expect(Logger.error).toHaveBeenCalled()
  })

  it('logs an error when receives message without text', () => {
    const invalidMessage = _.cloneDeep(mockExpectedCleverTapInboxMessage)
    _.set(invalidMessage, 'msg.content[0].message.text', '')

    const parsedMessages = parseCleverTapMessages([invalidMessage])
    expect(parsedMessages).toEqual([])
    expect(Logger.error).toHaveBeenCalled()
  })

  it.each(['android', 'ios'])('extracts appropriate link for %s', (os) => {
    const actualOS = Platform.OS
    Platform.OS = os as typeof Platform.OS

    const link = `link for ${os}`

    const messageWithOsSpecificLink = _.cloneDeep(mockExpectedCleverTapInboxMessage)
    _.set(messageWithOsSpecificLink, `msg.content[0].action.links[0].url.${os}.text`, link)

    const expectedMessage = {
      ...mockCleverTapInboxMessage,
      ctaUrl: link,
    }
    const parsedMessages = parseCleverTapMessages([messageWithOsSpecificLink])

    Platform.OS = actualOS

    expect(parsedMessages).toEqual([expectedMessage])
  })
})

import CleverTap from 'clevertap-react-native'
import { noop } from 'lodash'
import { Platform } from 'react-native'
import { eventChannel } from 'redux-saga'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import Logger from 'src/utils/Logger'

const TAG = 'CleverTapInbox'

export function cleverTapInboxMessagesChannel() {
  const useCleverTapInbox = getFeatureGate(StatsigFeatureGates.CLEVERTAP_INBOX)

  return eventChannel((emit: any) => {
    if (!useCleverTapInbox) {
      return noop // empty channel
    }

    const emitMessages = () => {
      const useCleverTapInbox = getFeatureGate(StatsigFeatureGates.CLEVERTAP_INBOX)
      if (!useCleverTapInbox) {
        return
      }

      CleverTap.getAllInboxMessages((error: any, messages: any) => {
        if (error) {
          Logger.error(TAG, 'Failed to get CleverTap Inbox messages', error)
          return
        }

        const parsedMessages = parseCleverTapMessages(messages)
        emit(parsedMessages)
      })
    }

    CleverTap.addListener(CleverTap.CleverTapInboxDidInitialize, emitMessages)
    CleverTap.addListener(CleverTap.CleverTapInboxMessagesDidUpdate, emitMessages)
    CleverTap.initializeInbox()

    return () => {
      CleverTap.removeListener(CleverTap.CleverTapInboxDidInitialize)
      CleverTap.removeListener(CleverTap.CleverTapInboxMessagesDidUpdate)
    }
  })
}

export function parseCleverTapMessages(rawMessages: ExpectedCleverTapInboxMessage[]) {
  const messages: CleverTapInboxMessage[] = []

  try {
    if (!Array.isArray(rawMessages)) {
      Logger.error(TAG, 'Unexpected CleverTap Inbox messages format', {
        rawMessages,
      })
      return messages
    }

    for (const rawMessage of rawMessages) {
      const messageId = rawMessage.id ?? rawMessage._id
      const content = rawMessage.msg?.content?.[0]
      const header = content?.title?.text
      const text = content?.message?.text
      const iconUrl = content?.icon?.url
      const icon = iconUrl ? { uri: iconUrl } : undefined
      const action = content?.action?.links?.[0]
      const ctaText = action?.text
      const ctaUrl =
        Platform.OS === 'android'
          ? action?.url?.android?.text
          : Platform.OS === 'ios'
            ? action?.url?.ios?.text
            : ''

      const PRIORITY_TAG = 'priority:'
      const priority = Number(
        rawMessage.msg?.tags
          ?.find((tag: string) => tag.startsWith(PRIORITY_TAG))
          ?.slice(PRIORITY_TAG.length)
      )

      const openInExternalBrowser = rawMessage.msg?.tags?.includes('openInExternalBrowser') ?? false

      if (!messageId || !text || !ctaText || !ctaUrl) {
        Logger.error(TAG, 'Unexpected CleverTap Inbox message format', {
          messageId,
          text,
          ctaText,
          ctaUrl,
          rawMessage,
        })
        continue
      }

      messages.push({
        messageId,
        header,
        text,
        icon,
        ctaText,
        ctaUrl,
        priority: !Number.isNaN(priority) ? priority : undefined,
        openInExternalBrowser,
      })
    }
  } catch (error) {
    Logger.error(TAG, 'Unexpected error while parsing CleverTap Inbox messages', {
      error,
      rawMessages,
    })
  }

  return messages
}

export interface CleverTapInboxMessage {
  messageId: string
  header?: string
  text: string
  icon?: { uri: string }
  ctaText: string
  ctaUrl: string
  priority?: number
  openInExternalBrowser: boolean
}

// CleverTap Inbox message type inferred from received data.
// All properties are optional because it's not guaranteed that any of them will actually exist.
export interface ExpectedCleverTapInboxMessage {
  isRead?: boolean
  id?: string
  _id?: string
  date?: number
  wzrk_id?: string
  wzrk_pivot?: string
  msg?: Msg
  wzrk_ttl?: number
}

interface Msg {
  enableTags?: boolean
  content?: Content[]
  type?: string
  bg?: string
  tags?: string[]
  orientation?: string
}

interface Content {
  action?: Action
  message?: Message
  key?: number
  icon?: Media
  title?: Message
  media?: Media
}

interface Action {
  hasUrl?: boolean
  url?: {
    android?: Url
    ios?: Url
  }
  links?: Link[]
  hasLinks?: boolean
}

interface Url {
  replacements?: string
  text?: string
  og?: string
}

interface Link {
  color?: string
  bg?: string
  type?: string
  text?: string
  copyText?: Url
  kv?: Record<string, string>
  url?: {
    ios?: Url
    android?: Url
  }
}

interface Message {
  color?: string
  og?: string
  text?: string
  replacements?: string
}

interface Media {
  content_type?: string
  poster?: string
  filename?: string
  url?: string
  key?: string
  processing?: boolean
}

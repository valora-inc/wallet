import CleverTap from 'clevertap-react-native'
import { eventChannel } from 'redux-saga'
import Logger from 'src/utils/Logger'

const TAG = 'CleverTapInbox'

export function cleverTapInboxMessagesChannel() {
  return eventChannel((emit: any) => {
    const emitMessages = () => {
      CleverTap.getAllInboxMessages((error: any, messages: any) => {
        if (error) {
          Logger.error(TAG, 'Failed to get CleverTap Inbox messages', error)
          return
        }

        emit(messages)
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

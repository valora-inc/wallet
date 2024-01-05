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

export const mockCleverTapInboxMessage = {
  wzrkParams: { wzrk_id: '0_0' },
  id: '1704393845',
  wzrk_id: '0_0',
  msg: {
    tags: [],
    type: 'message-icon',
    content: [
      {
        icon: {
          processing: false,
          poster: '',
          filename: '',
          content_type: 'image/jpeg',
          key: 'fd152d1004504c0ab68a99ce9e3fe5e7',
          url: 'https://d2trgtv8344lrj.cloudfront.net/dist/1634904064/i/fd152d1004504c0ab68a99ce9e3fe5e7.jpeg?v=1704392507',
        },
        title: {
          color: '#434761',
          replacements: 'CleverTap Message Header',
          text: 'CleverTap Message Header',
        },
        action: {
          url: { ios: { replacements: '', text: '' }, android: { replacements: '', text: '' } },
          links: [
            {
              kv: {},
              url: {
                ios: { replacements: 'https://valoraapp.com', text: 'https://valoraapp.com' },
                android: { replacements: 'https://valoraapp.com', text: 'https://valoraapp.com' },
              },
              copyText: { replacements: 'https://valoraapp.com', text: 'https://valoraapp.com' },
              text: 'CleverTap Message CTA',
              bg: '#ffffff',
              color: '#007bff',
              type: 'url',
            },
          ],
          hasLinks: true,
          hasUrl: false,
        },
        message: {
          color: '#434761',
          replacements: 'CleverTap Message Body Text',
          text: 'CleverTap Message Body Text',
        },
        media: {},
        key: 99060129,
      },
    ],
    enableTags: false,
    custom_kv: [],
    orientation: 'p',
    bg: '#ffffff',
  },
  tags: [''],
  isRead: true,
}

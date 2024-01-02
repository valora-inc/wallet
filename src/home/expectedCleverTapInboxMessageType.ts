// CleverTap Inbox message type inferred from received data.
// All properties are optional because it's not guaranteed that any of them actually exists.

export interface ExpectedCleverTapInboxMessage {
  isRead?: boolean
  id?: string
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
  icon?: Record<string, unknown>
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

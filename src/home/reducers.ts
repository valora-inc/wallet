import { RehydrateAction } from 'redux-persist'
import { Actions, ActionTypes } from 'src/home/actions'
import { CleverTapInboxMessage } from 'src/home/cleverTapInbox'
import { getRehydratePayload, REHYDRATE } from 'src/redux/persist-helper'

export const DEFAULT_PRIORITY = 20

export interface NotificationTexts {
  body: string
  cta: string
  dismiss: string
}

export interface Notification {
  ctaUri: string
  content: { [lang: string]: NotificationTexts | undefined }
  dismissed?: boolean
  iconUrl?: string
  minVersion?: string
  maxVersion?: string
  countries?: string[]
  blockedCountries?: string[]
  openExternal?: boolean
  priority?: number
  showOnHomeScreen?: boolean
}

export interface IdToNotification {
  [id: string]: Notification | undefined
}

export interface State {
  loading: boolean
  notifications: IdToNotification
  cleverTapInboxMessages: CleverTapInboxMessage[]
  hasVisitedHome: boolean
}

export const initialState = {
  loading: false,
  notifications: {},
  cleverTapInboxMessages: [],
  hasVisitedHome: false,
}

export const homeReducer = (state: State = initialState, action: ActionTypes | RehydrateAction) => {
  switch (action.type) {
    case REHYDRATE: {
      // Ignore some persisted properties
      const rehydratedState = getRehydratePayload(action, 'home')
      return {
        ...state,
        ...rehydratedState,
        loading: false,
      }
    }
    case Actions.SET_LOADING:
      return {
        ...state,
        loading: action.loading,
      }
    case Actions.UPDATE_NOTIFICATIONS:
      // Doing it this way removes any notifications not received on the action.
      let updatedNotifications = {}
      for (const [id, updatedNotification] of Object.entries(action.notifications)) {
        if (!updatedNotification) {
          continue
        }
        const existingNotification = state.notifications[id]
        updatedNotifications = {
          ...updatedNotifications,
          [id]: {
            priority: DEFAULT_PRIORITY,
            ...updatedNotification,
            // Keep locally modified fields
            ...(existingNotification
              ? {
                  dismissed: existingNotification.dismissed,
                }
              : undefined),
          },
        }
      }
      return {
        ...state,
        notifications: updatedNotifications,
      }
    case Actions.DISMISS_NOTIFICATION:
      const notification = state.notifications[action.id]
      if (!notification) {
        return state
      }
      return {
        ...state,
        notifications: {
          ...state.notifications,
          [action.id]: {
            ...notification,
            dismissed: true,
          },
        },
      }
    case Actions.CLEVERTAP_INBOX_MESSAGES_RECEIVED:
      return {
        ...state,
        cleverTapInboxMessages: action.messages,
      }
    case Actions.VISIT_HOME:
      return {
        ...state,
        hasVisitedHome: true,
      }
    default:
      return state
  }
}

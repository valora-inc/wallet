import { RehydrateAction } from 'redux-persist'
import { Actions, ActionTypes } from 'src/home/actions'
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
}

export interface CleverTapNotification {
  ti: number
  custom_kv: object
  type: string
  dismissed?: boolean
}

export interface IdToNotification {
  [id: string]: Notification | undefined
}

export interface IdToCleverTapNotification {
  [id: string]: CleverTapNotification | undefined
}

export interface State {
  loading: boolean
  notifications: IdToNotification
  cleverTapNotifications: IdToCleverTapNotification
}

export const initialState = {
  loading: false,
  notifications: {},
  cleverTapNotifications: {},
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
    case Actions.UPDATE_CLEVER_TAP_NOTIFICATIONS:
      // Doing it this way removes any notifications not received on the action.
      let updatedCleverTapNotifications = {}
      for (const [id, updatedCleverTapNotification] of Object.entries(
        action.cleverTapNotifications
      )) {
        if (!updatedCleverTapNotification) {
          continue
        }
        const existingCleverTapNotification = state.cleverTapNotifications[id]
        updatedCleverTapNotifications = {
          ...updatedCleverTapNotifications,
          [id]: {
            priority: DEFAULT_PRIORITY,
            ...updatedCleverTapNotification,
            // Keep locally modified fields
            ...(existingCleverTapNotification
              ? {
                  dismissed: existingCleverTapNotification.dismissed,
                }
              : undefined),
          },
        }
      }
      return {
        ...state,
        cleverTapNotifications: updatedCleverTapNotifications,
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
    case Actions.DISMISS_CLEVER_TAP_NOTIFICATION:
      const cleverTapNotification = state.cleverTapNotifications[action.id]
      if (!cleverTapNotification) {
        return state
      }
      return {
        ...state,
        cleverTapNotifications: {
          ...state.cleverTapNotifications,
          [action.id]: {
            ...cleverTapNotification,
            dismissed: true,
          },
        },
      }
    default:
      return state
  }
}

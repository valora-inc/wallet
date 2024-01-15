import { ExpectedCleverTapInboxMessage } from 'src/home/cleverTapInbox'
import { IdToNotification } from 'src/home/reducers'

export enum Actions {
  SET_LOADING = 'HOME/SET_LOADING',
  UPDATE_NOTIFICATIONS = 'HOME/UPDATE_NOTIFICATIONS',
  DISMISS_NOTIFICATION = 'HOME/DISMISS_NOTIFICATION',
  REFRESH_BALANCES = 'HOME/REFRESH_BALANCES',
  START_BALANCE_AUTOREFRESH = 'HOME/START_BALANCE_AUTOREFRESH',
  STOP_BALANCE_AUTOREFRESH = 'HOME/STOP_BALANCE_AUTOREFRESH',
  VISIT_HOME = 'HOME/VISIT_HOME',
  UPDATE_CLEVERTAP_INBOX_MESSAGES = 'HOME/UPDATE_CLEVERTAP_INBOX_MESSAGES',
}

export interface VisitHomeAction {
  type: Actions.VISIT_HOME
}

export interface SetLoadingAction {
  type: Actions.SET_LOADING
  loading: boolean
}

export interface UpdateNotificationsAction {
  type: Actions.UPDATE_NOTIFICATIONS
  notifications: IdToNotification
}

export interface DismissNotificationAction {
  type: Actions.DISMISS_NOTIFICATION
  id: string
}

export interface RefreshBalancesBalancesAction {
  type: Actions.REFRESH_BALANCES
}

export interface UpdateCleverTapInboxMessagesAction {
  type: Actions.UPDATE_CLEVERTAP_INBOX_MESSAGES
  messages: ExpectedCleverTapInboxMessage[]
}

export type ActionTypes =
  | SetLoadingAction
  | UpdateNotificationsAction
  | DismissNotificationAction
  | UpdateCleverTapInboxMessagesAction

export const visitHome = (): VisitHomeAction => ({
  type: Actions.VISIT_HOME,
})

export const setLoading = (loading: boolean): SetLoadingAction => ({
  type: Actions.SET_LOADING,
  loading,
})

export const updateNotifications = (
  notifications: IdToNotification
): UpdateNotificationsAction => ({
  type: Actions.UPDATE_NOTIFICATIONS,
  notifications,
})

export const dismissNotification = (id: string): DismissNotificationAction => ({
  type: Actions.DISMISS_NOTIFICATION,
  id,
})

export const refreshAllBalances = (): RefreshBalancesBalancesAction => ({
  type: Actions.REFRESH_BALANCES,
})

export const startBalanceAutorefresh = () => ({
  type: Actions.START_BALANCE_AUTOREFRESH,
})

export const stopBalanceAutorefresh = () => ({
  type: Actions.STOP_BALANCE_AUTOREFRESH,
})

export const updateCleverTapInboxMessages = (
  messages: ExpectedCleverTapInboxMessage[]
): UpdateCleverTapInboxMessagesAction => ({
  type: Actions.UPDATE_CLEVERTAP_INBOX_MESSAGES,
  messages,
})

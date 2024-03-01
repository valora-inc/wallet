import { CleverTapInboxMessage } from 'src/home/cleverTapInbox'
import { IdToNotification } from 'src/home/reducers'
import { NetworkId } from 'src/transactions/types'

export enum Actions {
  SET_LOADING = 'HOME/SET_LOADING',
  UPDATE_NOTIFICATIONS = 'HOME/UPDATE_NOTIFICATIONS',
  DISMISS_NOTIFICATION = 'HOME/DISMISS_NOTIFICATION',
  REFRESH_BALANCES = 'HOME/REFRESH_BALANCES',
  START_BALANCE_AUTOREFRESH = 'HOME/START_BALANCE_AUTOREFRESH',
  STOP_BALANCE_AUTOREFRESH = 'HOME/STOP_BALANCE_AUTOREFRESH',
  VISIT_HOME = 'HOME/VISIT_HOME',
  CLEVERTAP_INBOX_MESSAGES_RECEIVED = 'HOME/CLEVERTAP_INBOX_MESSAGES_RECEIVED',
  CELEBRATED_NFT_FOUND = 'HOME/CELEBRATED_NFT_FOUND',
  NFT_CELEBRATION_DISPLAYED = 'HOME/NFT_CELEBRATION_DISPLAYED',
  NFT_REWARD_READY = 'HOME/NFT_REWARD_READY',
  NFT_REWARD_DISPLAYED = 'HOME/NFT_REWARD_DISPLAYED',
  NFT_REWARD_REMINDER_READY = 'HOME/NFT_REWARD_REMINDER_READY',
  NFT_REWARD_REMINDER_DISPLAYED = 'HOME/NFT_REWARD_REMINDER_DISPLAYED',
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

interface CleverTapInboxMessagesReceivedAction {
  type: Actions.CLEVERTAP_INBOX_MESSAGES_RECEIVED
  messages: CleverTapInboxMessage[]
}

interface CelebratedNftFoundAction {
  type: Actions.CELEBRATED_NFT_FOUND
  networkId: NetworkId
  contractAddress: string
  expirationDate: string
  reminderDate: string
  deepLink: string
}

interface NftCelebrationDisplayedAction {
  type: Actions.NFT_CELEBRATION_DISPLAYED
}

interface NftRewardReadyAction {
  type: Actions.NFT_REWARD_READY
}

interface NftRewardDisplayedAction {
  type: Actions.NFT_REWARD_DISPLAYED
}

interface NftRewardReminderReadyAction {
  type: Actions.NFT_REWARD_REMINDER_READY
}

export type ActionTypes =
  | SetLoadingAction
  | UpdateNotificationsAction
  | DismissNotificationAction
  | CleverTapInboxMessagesReceivedAction
  | VisitHomeAction
  | CelebratedNftFoundAction
  | NftCelebrationDisplayedAction
  | NftRewardReadyAction
  | NftRewardDisplayedAction
  | NftRewardReminderReadyAction

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

export const cleverTapInboxMessagesReceived = (
  messages: CleverTapInboxMessage[]
): CleverTapInboxMessagesReceivedAction => ({
  type: Actions.CLEVERTAP_INBOX_MESSAGES_RECEIVED,
  messages,
})

export const celebratedNftFound = ({
  networkId,
  contractAddress,
  expirationDate,
  reminderDate,
  deepLink,
}: {
  networkId: NetworkId
  contractAddress: string
  expirationDate: string
  reminderDate: string
  deepLink: string
}): CelebratedNftFoundAction => ({
  type: Actions.CELEBRATED_NFT_FOUND,
  networkId,
  contractAddress,
  expirationDate,
  reminderDate,
  deepLink,
})

export const nftCelebrationDisplayed = (): NftCelebrationDisplayedAction => ({
  type: Actions.NFT_CELEBRATION_DISPLAYED,
})

export const nftRewardReady = (): NftRewardReadyAction => ({
  type: Actions.NFT_REWARD_READY,
})

export const nftRewardDisplayed = (): NftRewardDisplayedAction => ({
  type: Actions.NFT_REWARD_DISPLAYED,
})

export const nftRewardReminderReady = (): NftRewardReminderReadyAction => ({
  type: Actions.NFT_REWARD_REMINDER_READY,
})

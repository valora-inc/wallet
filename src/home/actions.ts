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
  NFT_REWARD_READY_TO_DISPLAY = 'HOME/NFT_REWARD_READY_TO_DISPLAY',
  NFT_REWARD_DISPLAYED = 'HOME/NFT_REWARD_DISPLAYED',
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
  rewardExpirationDate: string
  rewardReminderDate: string
  deepLink: string
}

interface NftCelebrationDisplayedAction {
  type: Actions.NFT_CELEBRATION_DISPLAYED
}

interface NftRewardReadyToDisplayAction {
  type: Actions.NFT_REWARD_READY_TO_DISPLAY
  showReminder: boolean
  valuesToSync: {
    rewardExpirationDate: string
    rewardReminderDate: string
    deepLink: string
  }
}

interface NftRewardDisplayedAction {
  type: Actions.NFT_REWARD_DISPLAYED
}

export type ActionTypes =
  | SetLoadingAction
  | UpdateNotificationsAction
  | DismissNotificationAction
  | CleverTapInboxMessagesReceivedAction
  | VisitHomeAction
  | CelebratedNftFoundAction
  | NftCelebrationDisplayedAction
  | NftRewardReadyToDisplayAction
  | NftRewardDisplayedAction

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
  rewardExpirationDate,
  rewardReminderDate,
  deepLink,
}: {
  networkId: NetworkId
  contractAddress: string
  rewardExpirationDate: string
  rewardReminderDate: string
  deepLink: string
}): CelebratedNftFoundAction => ({
  type: Actions.CELEBRATED_NFT_FOUND,
  networkId,
  contractAddress,
  rewardExpirationDate,
  rewardReminderDate,
  deepLink,
})

export const nftCelebrationDisplayed = (): NftCelebrationDisplayedAction => ({
  type: Actions.NFT_CELEBRATION_DISPLAYED,
})

export const nftRewardReadyToDisplay = ({
  showReminder,
  valuesToSync: { rewardExpirationDate, rewardReminderDate, deepLink },
}: {
  showReminder: boolean
  valuesToSync: {
    rewardExpirationDate: string
    rewardReminderDate: string
    deepLink: string
  }
}): NftRewardReadyToDisplayAction => ({
  type: Actions.NFT_REWARD_READY_TO_DISPLAY,
  showReminder,
  valuesToSync: { rewardExpirationDate, rewardReminderDate, deepLink },
})

export const nftRewardDisplayed = (): NftRewardDisplayedAction => ({
  type: Actions.NFT_REWARD_DISPLAYED,
})

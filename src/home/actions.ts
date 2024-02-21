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
  JUMPSTART_CLAIM_STARTED = 'HOME/JUMPSTART_CLAIM_STARTED',
  JUMPSTART_CLAIM_SUCCEEDED = 'HOME/JUMPSTART_CLAIM_SUCCEEDED',
  JUMPSTART_CLAIM_FAILED = 'HOME/JUMPSTART_CLAIM_FAILED',
  JUMPSTART_LOADING_DISMISSED = 'HOME/JUMPSTART_LOADING_DISMISSED',
  JUMPSTART_ERROR_DISMISSED = 'HOME/JUMPSTART_ERROR_DISMISSED',
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
}

interface NftCelebrationDisplayedAction {
  type: Actions.NFT_CELEBRATION_DISPLAYED
}

interface JumpstartClaimStartedAction {
  type: Actions.JUMPSTART_CLAIM_STARTED
}

interface JumpstartClaimSucceededdAction {
  type: Actions.JUMPSTART_CLAIM_SUCCEEDED
}
interface JumpstartClaimFailedAction {
  type: Actions.JUMPSTART_CLAIM_FAILED
}

interface JumpstartLoadingDismissedAction {
  type: Actions.JUMPSTART_LOADING_DISMISSED
}

interface JumpstartErrorDismissedAction {
  type: Actions.JUMPSTART_ERROR_DISMISSED
}

export type ActionTypes =
  | SetLoadingAction
  | UpdateNotificationsAction
  | DismissNotificationAction
  | CleverTapInboxMessagesReceivedAction
  | VisitHomeAction
  | CelebratedNftFoundAction
  | NftCelebrationDisplayedAction
  | JumpstartClaimStartedAction
  | JumpstartClaimSucceededdAction
  | JumpstartClaimFailedAction
  | JumpstartLoadingDismissedAction
  | JumpstartErrorDismissedAction

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
}: {
  networkId: NetworkId
  contractAddress: string
}): CelebratedNftFoundAction => ({
  type: Actions.CELEBRATED_NFT_FOUND,
  networkId,
  contractAddress,
})

export const nftCelebrationDisplayed = (): NftCelebrationDisplayedAction => ({
  type: Actions.NFT_CELEBRATION_DISPLAYED,
})

export const jumpstartClaimStarted = (): JumpstartClaimStartedAction => ({
  type: Actions.JUMPSTART_CLAIM_STARTED,
})

export const jumpstartClaimSucceeded = (): JumpstartClaimSucceededdAction => ({
  type: Actions.JUMPSTART_CLAIM_SUCCEEDED,
})

export const jumpstartClaimFailed = (): JumpstartClaimFailedAction => ({
  type: Actions.JUMPSTART_CLAIM_FAILED,
})

export const jumpstartLoadingDismissed = (): JumpstartLoadingDismissedAction => ({
  type: Actions.JUMPSTART_LOADING_DISMISSED,
})

export const jumpstartErrorDismissed = (): JumpstartErrorDismissedAction => ({
  type: Actions.JUMPSTART_ERROR_DISMISSED,
})

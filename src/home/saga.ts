import { notificationsChannel } from 'src/firebase/firebase'
import {
  Actions,
  cleverTapInboxMessagesReceived,
  setLoading,
  updateNotifications,
} from 'src/home/actions'
import { CleverTapInboxMessage, cleverTapInboxMessagesChannel } from 'src/home/cleverTapInbox'
import { IdToNotification } from 'src/home/reducers'
import { fetchCurrentRate } from 'src/localCurrency/actions'
import { executeShortcutSuccess } from 'src/positions/slice'
import { withTimeout } from 'src/redux/sagas-helpers'
import { fetchTokenBalances } from 'src/tokens/slice'
import { Actions as TransactionActions } from 'src/transactions/actions'
import Logger from 'src/utils/Logger'
import { safely } from 'src/utils/safely'
import { getConnectedAccount } from 'src/web3/saga'
import { call, cancelled, put, spawn, take, takeLeading } from 'typed-redux-saga'

const REFRESH_TIMEOUT = 15000
const TAG = 'home/saga'

export function withLoading<Fn extends (...args: any[]) => any>(fn: Fn, ...args: Parameters<Fn>) {
  return function* withLoadingGen() {
    yield* put(setLoading(true))
    try {
      const res = yield* call(fn, ...args)
      return res
    } finally {
      yield* put(setLoading(false))
    }
  }
}

export function* refreshBalances() {
  Logger.debug(TAG, 'Fetching all balances')
  yield* call(getConnectedAccount)
  yield* put(fetchTokenBalances({ showLoading: false }))
  yield* put(fetchCurrentRate())
}

export function* watchRefreshBalances() {
  yield* call(refreshBalances)
  yield* takeLeading(
    [Actions.REFRESH_BALANCES, executeShortcutSuccess.type],
    safely(withLoading(withTimeout(REFRESH_TIMEOUT, refreshBalances)))
  )
  yield* takeLeading(
    TransactionActions.UPDATE_TRANSACTIONS,
    safely(withTimeout(REFRESH_TIMEOUT, refreshBalances))
  )
}

function* fetchNotifications() {
  const channel = yield* call(notificationsChannel)
  if (!channel) {
    return
  }
  try {
    while (true) {
      const notifications = (yield* take(channel)) as IdToNotification
      yield* put(updateNotifications(notifications))
    }
  } catch (error) {
    Logger.error(`${TAG}@fetchNotifications`, 'Failed to update notifications', error)
  } finally {
    if (yield* cancelled()) {
      channel.close()
    }
  }
}

function* fetchCleverTapInboxMessages() {
  const channel = yield* call(cleverTapInboxMessagesChannel)

  try {
    while (true) {
      const notifications = (yield* take(channel)) as CleverTapInboxMessage[]
      yield* put(cleverTapInboxMessagesReceived(notifications))
    }
  } catch (error) {
    Logger.error(
      `${TAG}@updateCleverTapInboxMessages`,
      'Failed to update CleverTap Inbox messages',
      error
    )
  } finally {
    if (yield* cancelled()) {
      channel.close()
    }
  }
}

export function* homeSaga() {
  yield* spawn(watchRefreshBalances)
  yield* spawn(fetchNotifications)
  yield* spawn(fetchCleverTapInboxMessages)
}

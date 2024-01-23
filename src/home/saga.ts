import { fetchSentEscrowPayments } from 'src/escrow/actions'
import { notificationsChannel } from 'src/firebase/firebase'
import {
  Actions,
  cleverTapInboxMessagesReceived,
  refreshAllBalances,
  setLoading,
  updateNotifications,
} from 'src/home/actions'
import { CleverTapInboxMessage, cleverTapInboxMessagesChannel } from 'src/home/cleverTapInbox'
import { IdToNotification } from 'src/home/reducers'
import { fetchCurrentRate } from 'src/localCurrency/actions'
import { shouldFetchCurrentRate } from 'src/localCurrency/selectors'
import { executeShortcutSuccess } from 'src/positions/slice'
import { withTimeout } from 'src/redux/sagas-helpers'
import { shouldUpdateBalance } from 'src/redux/selectors'
import { fetchTokenBalances } from 'src/tokens/slice'
import { Actions as TransactionActions } from 'src/transactions/actions'
import Logger from 'src/utils/Logger'
import { safely } from 'src/utils/safely'
import { getConnectedAccount } from 'src/web3/saga'
import {
  call,
  cancel,
  cancelled,
  delay,
  fork,
  put,
  select,
  spawn,
  take,
  takeLeading,
} from 'typed-redux-saga'

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
  yield* put(fetchSentEscrowPayments())
}

export function* autoRefreshSaga() {
  while (true) {
    if (yield* select(shouldUpdateBalance)) {
      yield* put(refreshAllBalances())
    }
    if (yield* select(shouldFetchCurrentRate)) {
      yield* put(fetchCurrentRate())
    }
    yield* delay(10 * 1000) // sleep 10 seconds
  }
}

export function* autoRefreshWatcher() {
  while (yield* take(Actions.START_BALANCE_AUTOREFRESH)) {
    // starts the task in the background
    const autoRefresh = yield* fork(autoRefreshSaga)
    yield* take(Actions.STOP_BALANCE_AUTOREFRESH)
    yield* cancel(autoRefresh)
  }
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
  yield* spawn(autoRefreshWatcher)
  yield* spawn(fetchNotifications)
  yield* spawn(fetchCleverTapInboxMessages)
}

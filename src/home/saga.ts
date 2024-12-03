import { Actions as AccountActions } from 'src/account/actions'
import { depositSuccess, withdrawSuccess } from 'src/earn/slice'
import { createFiatConnectTransferCompleted } from 'src/fiatconnect/slice'
import { notificationsChannel } from 'src/firebase/firebase'
import {
  Actions,
  cleverTapInboxMessagesReceived,
  setLoading,
  updateNotifications,
} from 'src/home/actions'
import { CleverTapInboxMessage, cleverTapInboxMessagesChannel } from 'src/home/cleverTapInbox'
import { IdToNotification } from 'src/home/reducers'
import { depositTransactionSucceeded } from 'src/jumpstart/slice'
import { fetchLocalCurrencyRateSaga } from 'src/localCurrency/saga'
import { fetchPositionsSaga, fetchShortcutsSaga } from 'src/positions/saga'
import { executeShortcutSuccess } from 'src/positions/slice'
import { withTimeout } from 'src/redux/sagas-helpers'
import { Actions as SendActions } from 'src/send/actions'
import { swapSuccess } from 'src/swap/slice'
import { fetchTokenBalancesSaga } from 'src/tokens/saga'
import { updateFeedFirstPage, updateTransactions } from 'src/transactions/slice'
import Logger from 'src/utils/Logger'
import { safely } from 'src/utils/safely'
import { all, call, cancelled, put, spawn, take, takeLeading } from 'typed-redux-saga'

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

export function* refreshAllBalances() {
  yield* all([
    call(fetchTokenBalancesSaga),
    call(fetchLocalCurrencyRateSaga),
    call(fetchPositionsSaga),
    call(fetchShortcutsSaga),
  ])
}

export function* watchRefreshBalances() {
  yield* takeLeading(
    [
      updateTransactions.type, // emitted on recieve new transactions from graphql endpoint
      updateFeedFirstPage.type, // emitted on recieve new transactions from zerion endpoint
      Actions.REFRESH_BALANCES, // emitted on manual pull to refresh and app foregrounded
      AccountActions.INITIALIZE_ACCOUNT_SUCCESS, // emitted after onboarding
      // the below actions are emitted after a successful transaction that is
      // initiated from the wallet.
      executeShortcutSuccess.type,
      depositSuccess.type,
      withdrawSuccess.type,
      SendActions.SEND_PAYMENT_SUCCESS,
      createFiatConnectTransferCompleted.type,
      depositTransactionSucceeded.type,
      swapSuccess.type,
    ],
    safely(withLoading(withTimeout(REFRESH_TIMEOUT, refreshAllBalances)))
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

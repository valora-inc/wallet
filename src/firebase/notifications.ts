import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import BigNumber from 'bignumber.js'
import { call, put, select } from 'redux-saga/effects'
import { showMessage } from 'src/alert/actions'
import { AppEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { TokenTransactionType } from 'src/apollo/types'
import { openUrl } from 'src/app/actions'
import {
  RewardsScreenOrigin,
  trackRewardsScreenOpenEvent,
} from 'src/consumerIncentives/analyticsEventsTracker'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import {
  NotificationReceiveState,
  NotificationTypes,
  TransferNotificationData,
} from 'src/notifications/types'
import { PaymentRequest } from 'src/paymentRequest/types'
import { getRecipientFromAddress, RecipientInfo } from 'src/recipients/recipient'
import { recipientInfoSelector } from 'src/recipients/reducer'
import { navigateToRequestedPaymentReview } from 'src/transactions/actions'
import { TokenTransactionTypeV2 } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'

const TAG = 'FirebaseNotifications'

function* handlePaymentRequested(
  paymentRequest: PaymentRequest,
  notificationState: NotificationReceiveState
) {
  if (notificationState === NotificationReceiveState.AppAlreadyOpen) {
    return
  }

  if (!paymentRequest.requesterAddress) {
    Logger.error(TAG, 'Payment request must specify a requester address')
    return
  }

  const info: RecipientInfo = yield select(recipientInfoSelector)
  const targetRecipient = getRecipientFromAddress(paymentRequest.requesterAddress, info)

  navigateToRequestedPaymentReview({
    firebasePendingRequestUid: paymentRequest.uid,
    recipient: targetRecipient,
    amount: new BigNumber(paymentRequest.amount),
    currency: Currency.Dollar,
    reason: paymentRequest.comment,
    type: TokenTransactionType.PayRequest,
  })
}

function* handlePaymentReceived(
  transferNotification: TransferNotificationData,
  notificationState: NotificationReceiveState
) {
  if (notificationState !== NotificationReceiveState.AppAlreadyOpen) {
    const address = transferNotification.sender.toLowerCase()

    yield call(navigate, Screens.TransactionDetailsScreen, {
      transaction: {
        __typename: 'TokenTransferV2',
        type: TokenTransactionTypeV2.Received,
        transactionHash: transferNotification.txHash,
        timestamp: new BigNumber(transferNotification.timestamp).toNumber(),
        block: transferNotification.blockNumber,
        address,
        amount: {
          value: transferNotification.value,
          tokenAddress: transferNotification.tokenAddress,
        },
        metadata: {
          title: transferNotification.name,
          image: transferNotification.imageUrl,
          comment: transferNotification.comment,
        },
        fees: [],
      },
    })
  }
}

export function* handleNotification(
  message: FirebaseMessagingTypes.RemoteMessage,
  notificationState: NotificationReceiveState
) {
  ValoraAnalytics.track(AppEvents.push_notification_opened, {
    id: message.data?.id,
    state: notificationState,
    type: message.data?.type,
  })
  // See if this is a notification with an open url or webview action (`ou` prop in the data)
  const urlToOpen = message.data?.ou
  if (urlToOpen) {
    trackRewardsScreenOpenEvent(urlToOpen, RewardsScreenOrigin.PushNotification)
  }
  const openExternal = message.data?.openExternal === 'true'
  const openUrlAction = urlToOpen ? openUrl(urlToOpen, openExternal, true) : null

  if (notificationState === NotificationReceiveState.AppAlreadyOpen) {
    const { title, body } = message.notification ?? {}
    if (title) {
      yield put(showMessage(body || title, undefined, null, openUrlAction, body ? title : null))
    }
  } else {
    // Notification was received while app wasn't already open (i.e. tapped to act on it)
    // So directly handle the action if any
    if (openUrlAction) {
      yield put(openUrlAction)
      return
    }
  }

  switch (message.data?.type) {
    case NotificationTypes.PAYMENT_REQUESTED:
      yield call(
        handlePaymentRequested,
        (message.data as unknown) as PaymentRequest,
        notificationState
      )
      break

    case NotificationTypes.PAYMENT_RECEIVED:
      yield call(
        handlePaymentReceived,
        (message.data as unknown) as TransferNotificationData,
        notificationState
      )
      break

    default:
      Logger.info(TAG, `Got unknown notification type ${message.data?.type}`)
      break
  }
}

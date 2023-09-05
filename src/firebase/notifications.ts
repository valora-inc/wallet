import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import BigNumber from 'bignumber.js'
import { showError, showMessage } from 'src/alert/actions'
import { AppEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { openUrl } from 'src/app/actions'
import {
  RewardsScreenOrigin,
  trackRewardsScreenOpenEvent,
} from 'src/consumerIncentives/analyticsEventsTracker'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import {
  FiatConnectKycApprovedData,
  NotificationReceiveState,
  NotificationTypes,
  TransferNotificationData,
} from 'src/notifications/types'
import { PaymentRequest } from 'src/paymentRequest/types'
import { transactionDataFromPaymentRequest } from 'src/paymentRequest/utils'
import { RecipientInfo, getRecipientFromAddress } from 'src/recipients/recipient'
import { recipientInfoSelector } from 'src/recipients/reducer'
import { TransactionDataInput } from 'src/send/SendAmount'
import { stablecoinsSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { navigateToRequestedPaymentReview } from 'src/transactions/actions'
import { TokenTransactionTypeV2 } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { call, put, select } from 'typed-redux-saga'
import { Network } from 'src/transactions/types'

const TAG = 'FirebaseNotifications'

function* handlePaymentRequested(paymentRequest: PaymentRequest) {
  if (!paymentRequest.requesterAddress) {
    Logger.error(TAG, 'Payment request must specify a requester address')
    return
  }

  const info: RecipientInfo = yield* select(recipientInfoSelector)
  const requester = getRecipientFromAddress(paymentRequest.requesterAddress, info)
  const stableTokens: TokenBalance[] = yield* select(stablecoinsSelector)

  let transactionData: TransactionDataInput
  try {
    transactionData = transactionDataFromPaymentRequest({
      paymentRequest,
      stableTokens,
      requester,
    })
  } catch (e) {
    yield* put(showError(ErrorMessages.INSUFFICIENT_BALANCE_STABLE))
    return
  }

  navigateToRequestedPaymentReview(transactionData, false)
}

function handlePaymentReceived(transferNotification: TransferNotificationData) {
  const address = transferNotification.sender.toLowerCase()

  navigate(Screens.TransactionDetailsScreen, {
    transaction: {
      __typename: 'TokenTransferV3',
      network: Network.Celo,
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
      yield* put(showMessage(body || title, undefined, null, openUrlAction, body ? title : null))
    }
    return
  }

  // Notification was received while app wasn't already open (i.e. tapped to act on it)
  // So directly handle the action if any
  if (openUrlAction) {
    yield* put(openUrlAction)
    return
  }

  switch (message.data?.type) {
    case NotificationTypes.PAYMENT_REQUESTED:
      // message.data can be any object, but we control it so we know what it is and can safely cast
      yield* call(handlePaymentRequested, message.data as unknown as PaymentRequest)
      break

    case NotificationTypes.PAYMENT_RECEIVED:
      // message.data can be any object, but we control it so we know what it is and can safely cast
      handlePaymentReceived(message.data as unknown as TransferNotificationData)
      break

    case NotificationTypes.FIAT_CONNECT_KYC_APPROVED:
      navigate(
        Screens.FiatConnectRefetchQuote,
        // message.data can be any object, but we control it so we know what it is and can safely cast
        message.data as unknown as FiatConnectKycApprovedData
      )
      break

    default:
      Logger.info(TAG, `Got unknown notification type ${message.data?.type}`)
      break
  }
}

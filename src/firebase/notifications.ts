import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import BigNumber from 'bignumber.js'
import { showMessage } from 'src/alert/actions'
import { AppEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
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
import { TokenTransactionTypeV2, TransactionStatus } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { put } from 'typed-redux-saga'
import networkConfig from 'src/web3/networkConfig'
import { getTokenId } from 'src/tokens/utils'

const TAG = 'FirebaseNotifications'

function handlePaymentReceived(transferNotification: TransferNotificationData) {
  const address = transferNotification.sender.toLowerCase()

  navigate(Screens.TransactionDetailsScreen, {
    transaction: {
      __typename: 'TokenTransferV3',
      networkId: networkConfig.defaultNetworkId,
      type: TokenTransactionTypeV2.Received,
      transactionHash: transferNotification.txHash,
      timestamp: new BigNumber(transferNotification.timestamp).toNumber(),
      block: transferNotification.blockNumber,
      address,
      amount: {
        tokenId: getTokenId(networkConfig.defaultNetworkId, transferNotification.tokenAddress),
        value: transferNotification.value,
        tokenAddress: transferNotification.tokenAddress,
      },
      metadata: {
        title: transferNotification.name,
        image: transferNotification.imageUrl,
        comment: transferNotification.comment,
      },
      fees: [],
      status: TransactionStatus.Complete,
    },
  })
}

export function* handleNotification(
  message: FirebaseMessagingTypes.RemoteMessage,
  notificationState: NotificationReceiveState
) {
  if (
    typeof message.data?.id === 'object' ||
    typeof message.data?.type === 'object' ||
    typeof message.data?.ou === 'object'
  ) {
    // should never happen
    Logger.error(TAG, 'Received invalid object data types from notifications', message.data)
    return
  }

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

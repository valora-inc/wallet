export enum NotificationTypes {
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_REQUESTED = 'PAYMENT_REQUESTED',
}

export interface TransferNotificationData {
  recipient: string
  sender: string
  value: string
  blockNumber: string
  txHash: string
  timestamp: string
  comment: string
  currency: string
  senderName: string
  senderImageUrl: string
  isReward: boolean
  type?: NotificationTypes.PAYMENT_RECEIVED
}

export enum NotificationReceiveState {
  AppAlreadyOpen = 'AppAlreadyOpen',
  AppOpenedFromBackground = 'AppOpenedFromBackground',
  AppColdStart = 'AppColdStart',
}

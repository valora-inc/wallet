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
  tokenAddress: string
  type?: NotificationTypes.PAYMENT_RECEIVED
  name?: string
  imageUrl?: string
}

export enum NotificationReceiveState {
  AppAlreadyOpen = 'AppAlreadyOpen',
  AppOpenedFromBackground = 'AppOpenedFromBackground',
  AppColdStart = 'AppColdStart',
}

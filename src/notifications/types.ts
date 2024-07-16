import { KycSchema } from '@fiatconnect/fiatconnect-types'
import { Address } from 'viem'

export enum NotificationTypes {
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  FIAT_CONNECT_KYC_APPROVED = 'FIAT_CONNECT_KYC_APPROVED',
}

export interface TransferNotificationData {
  recipient: Address
  sender: Address
  value: string
  blockNumber: string
  txHash: string
  timestamp: string
  comment: string
  tokenAddress: Address
  type?: NotificationTypes.PAYMENT_RECEIVED
  name?: string
  imageUrl?: string
}

export interface FiatConnectKycApprovedData {
  kycSchema: KycSchema
  providerId: string
  type: NotificationTypes.FIAT_CONNECT_KYC_APPROVED
}

export enum NotificationReceiveState {
  AppAlreadyOpen = 'AppAlreadyOpen',
  AppOpenedFromBackground = 'AppOpenedFromBackground',
  AppColdStart = 'AppColdStart',
}

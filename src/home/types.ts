export enum HomeActionName {
  Send = 'Send',
  Receive = 'Receive',
  Add = 'Add',
  Swap = 'Swap',
  Withdraw = 'Withdraw',
}

export enum NotificationType {
  escrow_tx_summary = 'escrow_tx_summary',
  escrow_tx_pending = 'escrow_tx_pending',
  celo_asset_education = 'celo_asset_education',
  verification_prompt = 'verification_prompt',
  backup_prompt = 'backup_prompt',
  keyless_backup_prompt = 'keyless_backup_prompt',
  remote_notification = 'remote_notification',
  clevertap_notification = 'clevertap_notification',
}

export enum NotificationBannerCTATypes {
  accept = 'accept',
  decline = 'decline',
  review = 'review',
  reclaim = 'reclaim',
  remind = 'remind',
  pay = 'pay',
  remote_notification_cta = 'remote_notification_cta',
}

export interface Notification {
  renderElement: (params?: { index?: number }) => React.ReactElement
  priority: number
  showOnHomeScreen?: boolean
  id: string
  type: NotificationType
  onView?: () => void
}

export enum SuperchargeButtonType {
  PillRewards = 'PILL_REWARDS',
  PillSupercharge = 'PILL_SUPERCHARGE',
  MenuRewards = 'MENU_REWARDS',
  MenuSupercharge = 'MENU_SUPERCHARGE',
}

export interface Dapp {
  id: string
  categoryId: string
  iconUrl: string
  name: string
  description: string
  dappUrl: string
  isFeatured: boolean
}

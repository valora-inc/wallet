export enum DappSection {
  RecentlyUsed = 'recently used',
  Featured = 'featured',
  All = 'all',
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

export interface ActiveDapp extends Dapp {
  openedFrom: DappSection
}

export interface DappCategory {
  backgroundColor: string
  fontColor: string
  id: string
  name: string
}

// used for the dapp connect request bottom sheet
export enum DappConnectInfo {
  Default = 'default', // display the same content as before app version 1.35
  Basic = 'basic', // display more correct title for connection request, indicate if dapp is in dappsList, display dapp logo for dappkit requests
  Full = 'full', // display detailed transaction data (future feature)
}

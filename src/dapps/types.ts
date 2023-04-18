export enum DappSection {
  RecentlyUsed = 'recently used',
  Featured = 'featured',
  All = 'all',
  FavoritesDappScreen = 'favorites dapp screen',
  FavoritesHomeScreen = 'favorites home screen',
}

export interface DappV1 {
  id: string
  iconUrl: string
  name: string
  description: string
  dappUrl: string
  isFeatured: boolean
  categoryId: string
}

export interface DappV2 {
  id: string
  iconUrl: string
  name: string
  description: string
  dappUrl: string
  isFeatured: boolean
  categories: string[]
}

export interface DappV2WithCategoryNames extends DappV2 {
  categoryNames: string[]
}

export const isDappV2 = (dapp: DappV1 | DappV2): dapp is DappV2 => 'categories' in dapp

// Needs to be a type as an interface can only extend an object type
// or intersection of object types with statically known members.
export type ActiveDapp = (DappV1 | DappV2) & { openedFrom: DappSection }

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

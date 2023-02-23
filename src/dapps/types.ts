export enum DappSection {
  RecentlyUsed = 'recently used',
  Featured = 'featured',
  All = 'all',
  FavoritesDappScreen = 'favorites dapp screen',
  FavoritesHomeScreen = 'favorites home screen',
}

// XOR for categoryId and categories
export type Dapp = {
  id: string
  iconUrl: string
  name: string
  description: string
  dappUrl: string
  isFeatured: boolean
} & ({ categoryId: string; categories?: never } | { categoryId?: never; categories: string[] })

// Needs to be a type as an interface can only extend an object type
// or intersection of object types with statically known members.
export type ActiveDapp = Dapp & { openedFrom: DappSection }

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

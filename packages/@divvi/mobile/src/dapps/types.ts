export enum DappSection {
  Featured = 'featured',
  All = 'all',
  FavoritesDappScreen = 'favorites dapp screen',
  MostPopular = 'mostPopular',
}

export interface Dapp {
  id: string
  iconUrl: string
  name: string
  description: string
  dappUrl: string
  categories: string[]
}

export interface DappWithCategoryNames extends Dapp {
  categoryNames: string[]
}

// Needs to be a type as an interface can only extend an object type
// or intersection of object types with statically known members.
export type ActiveDapp = Dapp & { openedFrom: DappSection }

export interface DappCategory {
  backgroundColor: string
  fontColor: string
  id: string
  name: string
}

export enum InviteRewardsType {
  NFT = 'nft',
  CUSD = 'cUSD',
  NONE = 'none',
}

export interface QrCode {
  type: string
  data: string
}

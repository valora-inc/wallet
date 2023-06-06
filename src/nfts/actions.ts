import { Nft } from 'src/nfts/types'

export enum Actions {
  NFT_SHARE = 'NFTS/SHARE',
  NFT_SAVE = 'NFTS/SAVE',
}

export interface ShareNftAction {
  type: Actions.NFT_SHARE
  nft: Nft
}

export interface SaveNftAction {
  type: Actions.NFT_SAVE
  nft: Nft
}

export const shareNft = (nft: Nft): ShareNftAction => ({
  type: Actions.NFT_SHARE,
  nft,
})

export const saveNft = (nft: Nft): SaveNftAction => ({
  type: Actions.NFT_SAVE,
  nft,
})

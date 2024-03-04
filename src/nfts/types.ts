import { NetworkId } from 'src/transactions/types'

interface NftMetaDataAttribute {
  trait_type: string
  value: string
}

interface NftMedia {
  raw: string
  gateway: string
}

export interface NftMetadata {
  name: string
  description: string
  image: string
  animation_url?: string
  dna?: string | null
  id?: number | null
  date?: number | null
  attributes?: NftMetaDataAttribute[] | null
}

export interface Nft {
  tokenId: string
  contractAddress: string
  tokenUri?: string | null
  ownerAddress?: string | null
  metadata: NftMetadata | null
  media: NftMedia[]
}

export interface NftWithNetworkId extends Nft {
  networkId: NetworkId
}

export interface NftWithMetadata extends Omit<NftWithNetworkId, 'metadata'> {
  metadata: NftMetadata
}

export enum NftMediaType {
  Image = 'image',
}

export enum NftOrigin {
  NftsInfoCarouselMain = 'nftsInfoCarouselMain',
  NftsInfoCarouselThumbnail = 'nftsInfoCarouselThumbnail',
  TransactionFeed = 'transactionFeed',
  NftGallery = 'nftGallery',
  Assets = 'assets',
  NftCelebration = 'nftCelebration',
}

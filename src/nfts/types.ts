interface NftMetaDataAttribute {
  trait_type: string
  value: string
}

interface NftMedia {
  raw: string
  gateway: string
}

export interface Nft {
  tokenId: string
  contractAddress: string
  tokenUri?: string | null
  ownerAddress?: string | null
  metadata: {
    name: string
    description: string
    image: string
    animation_url?: string
    dna?: string | null
    id?: number | null
    date?: number | null
    attributes?: NftMetaDataAttribute[] | null
  } | null
  media: NftMedia[]
}

export enum NftMediaType {
  Image = 'image',
  Video = 'video',
}

export enum NftOrigin {
  NftsInfoCarouselMain = 'nftsInfoCarouselMain',
  NftsInfoCarouselThumbnail = 'nftsInfoCarouselThumbnail',
  TransactionFeed = 'transactionFeed',
}

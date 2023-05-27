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
  tokenUri: string | null
  ownerAddress: string | null
  metadata: {
    name: string
    description: string
    image: string
    dna?: string | null
    id?: number | null
    date?: number | null
    attributes?: NftMetaDataAttribute[] | null
  } | null
  media: NftMedia[]
}

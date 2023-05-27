export interface Nft {
  tokenId: string
  contractAddress: string
  tokenUri: string | null
  ownerAddress: string | null
  metadata: {
    name: string
    description: string
    image: string
    dna?: string
    id?: number
    date?: number
    attributes?: [
      {
        trait_type: string
        value: string
      }
    ]
  } | null
  media:
    | [
        {
          raw: string
          gateway: string
        }
      ]
    | []
}

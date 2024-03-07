import { NetworkId } from 'src/transactions/types'

type NftContract = {
  networkId?: NetworkId
  contractAddress?: string
}

export function isSameNftContract(
  nft1: NftContract | undefined | null,
  nft2: NftContract | undefined | null
) {
  if (!nft1 || !nft1.contractAddress || !nft1.networkId) {
    return false
  }

  if (!nft2 || !nft2.contractAddress || !nft2.networkId) {
    return false
  }

  return nft1.networkId === nft2.networkId && nft1.contractAddress === nft2.contractAddress
}

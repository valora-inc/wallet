import { NftEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { Nft, NftMediaType, NftOrigin } from 'src/nfts/types'
import Logger from 'src/utils/Logger'

export function getGatewayUrl(nft: Nft, mediaType = NftMediaType.Image) {
  switch (mediaType) {
    default:
    case NftMediaType.Image:
      return nft.media.find((media) => media.raw === nft.metadata?.image)?.gateway
  }
}

export function onImageLoad(nft: Nft, origin: NftOrigin, error: boolean) {
  const { contractAddress, tokenId } = nft
  const url = getGatewayUrl(nft)
  error
    ? Logger.error(
        origin,
        `ContractAddress=${contractAddress}, TokenId: ${tokenId}, Failed to load image from ${url}`
      )
    : Logger.info(
        origin,
        `ContractAddress=${contractAddress}, TokenId: ${tokenId}, Loaded image from ${url}`
      )

  ValoraAnalytics.track(NftEvents.nft_image_load, {
    tokenId,
    contractAddress,
    url,
    origin,
    error,
  })
}

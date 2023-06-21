import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { NftOrigin } from 'src/nfts/types'
import { getGatewayUrl, onImageLoad } from 'src/nfts/utils'
import { mockNftAllFields } from 'test/values'

describe('nfts/utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('getGatewayUrl', () => {
    expect(getGatewayUrl(mockNftAllFields)).toEqual(mockNftAllFields.media[0].gateway)
  })

  it('onImageLoad success', () => {
    onImageLoad(mockNftAllFields, NftOrigin.TransactionFeed, false)
    expect(ValoraAnalytics.track).toBeCalledWith('nft_image_load', {
      tokenId: mockNftAllFields.tokenId,
      contractAddress: mockNftAllFields.contractAddress,
      url: mockNftAllFields.media[0].gateway,
      origin: NftOrigin.TransactionFeed,
      error: false,
    })
    expect(ValoraAnalytics.track).toBeCalledTimes(1)
  })

  it('onImageLoad error', () => {
    onImageLoad(mockNftAllFields, NftOrigin.NftsInfoCarouselMain, true)
    expect(ValoraAnalytics.track).toBeCalledWith('nft_image_load', {
      tokenId: mockNftAllFields.tokenId,
      contractAddress: mockNftAllFields.contractAddress,
      url: mockNftAllFields.media[0].gateway,
      origin: NftOrigin.NftsInfoCarouselMain,
      error: true,
    })
    expect(ValoraAnalytics.track).toBeCalledTimes(1)
  })
})

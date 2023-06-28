import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import NftsInfoCarousel from 'src/nfts/NftsInfoCarousel'
import networkConfig from 'src/web3/networkConfig'
import { getMockStackScreenProps } from 'test/utils'
import { mockNftAllFields, mockNftMinimumFields, mockNftNullMetadata } from 'test/values'

jest.mock('src/utils/Logger')

describe('NftsInfoCarousel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly with one Nft', () => {
    const { queryByTestId, getByTestId, getByText } = render(
      <NftsInfoCarousel
        {...getMockStackScreenProps(Screens.NftsInfoCarousel, { nfts: [mockNftAllFields] })}
      />
    )

    // Correct image source should be rendered
    expect(getByTestId('NftsInfoCarousel/MainImage')).toHaveProp('source', {
      uri: mockNftAllFields.media[0].gateway,
    })
    expect(getByText(mockNftAllFields.metadata!.name)).toBeTruthy()

    // The image carousel should not render if there is only one Nft
    expect(queryByTestId('NftsInfoCarousel/NftImageCarousel')).toBeNull()
  })

  it('renders correctly with two valid Nfts', () => {
    const nft1Thumbnail = `NftsInfoCarousel/NftThumbnail/${mockNftAllFields.contractAddress}-${mockNftAllFields.tokenId}`
    const nft2Thumbnail = `NftsInfoCarousel/NftThumbnail/${mockNftMinimumFields.contractAddress}-${mockNftMinimumFields.tokenId}`
    const { getByTestId, getByText } = render(
      <NftsInfoCarousel
        {...getMockStackScreenProps(Screens.NftsInfoCarousel, {
          nfts: [mockNftAllFields, mockNftMinimumFields],
        })}
      />
    )

    // Carousel should be rendered
    expect(getByTestId('NftsInfoCarousel/NftImageCarousel')).toBeTruthy()

    // Correct Nft Image and name should be rendered
    expect(getByTestId('NftsInfoCarousel/MainImage')).toHaveProp('source', {
      uri: mockNftAllFields.media[0].gateway,
    })
    expect(getByText(mockNftAllFields.metadata!.name)).toBeTruthy()

    // Toggle to Second Nft
    fireEvent.press(getByTestId(nft2Thumbnail))
    expect(getByText(mockNftMinimumFields.metadata!.name)).toBeTruthy()
    expect(getByTestId('NftsInfoCarousel/MainImage')).toHaveProp('source', {
      uri: mockNftMinimumFields.media[0].gateway,
    })

    // Return to first Nft
    fireEvent.press(getByTestId(nft1Thumbnail))
    expect(getByText(mockNftAllFields.metadata!.name)).toBeTruthy()
    expect(getByTestId('NftsInfoCarousel/MainImage')).toHaveProp('source', {
      uri: mockNftAllFields.media[0].gateway,
    })
  })

  it('renders full screen error when no Nft(s)', () => {
    const { getByTestId, queryByTestId } = render(
      <NftsInfoCarousel {...getMockStackScreenProps(Screens.NftsInfoCarousel, { nfts: [] })} />
    )

    expect(getByTestId('NftsInfoCarousel/NftsLoadErrorScreen')).toBeTruthy()
    expect(queryByTestId('NftsInfoCarousel')).toBeNull()
  })

  it('renders error image state on Nft null metadata', () => {
    const { getByText } = render(
      <NftsInfoCarousel
        {...getMockStackScreenProps(Screens.NftsInfoCarousel, { nfts: [mockNftNullMetadata] })}
      />
    )
    expect(getByText('nftInfoCarousel.nftImageLoadError')).toBeTruthy()
  })

  it('image carousel should render Nfts with null metadata as red info icon', () => {
    const { getByTestId, getByText, queryByText } = render(
      <NftsInfoCarousel
        {...getMockStackScreenProps(Screens.NftsInfoCarousel, {
          nfts: [mockNftAllFields, mockNftNullMetadata],
        })}
      />
    )

    // The Nft with null metadata will render with an error icon in carousel and display error text when selected
    expect(queryByText('nftInfoCarousel.nftImageLoadError')).toBeNull()
    expect(getByTestId('NftsInfoCarousel/ImageErrorIcon')).toBeTruthy()
    expect(getByTestId('NftsInfoCarousel/NftImageCarousel')).toBeTruthy()
    fireEvent.press(
      getByTestId(
        `NftsInfoCarousel/NftThumbnail/${mockNftNullMetadata.contractAddress}-${mockNftNullMetadata.tokenId}`
      )
    )

    expect(getByText('nftInfoCarousel.nftImageLoadError')).toBeTruthy()
    expect(getByText('nftInfoCarousel.viewOnCeloExplorer')).toBeTruthy()
  })

  it('opens link for Explorer', () => {
    const { getByTestId } = render(
      <NftsInfoCarousel
        {...getMockStackScreenProps(Screens.NftsInfoCarousel, { nfts: [mockNftMinimumFields] })}
      />
    )

    fireEvent.press(getByTestId('ViewOnExplorer'))
    expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, {
      uri: `${networkConfig.celoExplorerBaseTokenUrl}${mockNftMinimumFields.contractAddress}/instance/${mockNftMinimumFields.tokenId}/metadata`,
    })
  })

  it('should not render link to explorer if no token id is provided', () => {
    const noTokenId = mockNftMinimumFields
    noTokenId.tokenId = null as unknown as string
    const { queryByTestId } = render(
      <NftsInfoCarousel
        {...getMockStackScreenProps(Screens.NftsInfoCarousel, { nfts: [noTokenId] })}
      />
    )

    expect(queryByTestId('ViewOnExplorer')).toBeNull()
  })
})

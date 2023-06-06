import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import NftsInfoCarousel from 'src/nfts/NftsInfoCarousel'
import networkConfig from 'src/web3/networkConfig'
import { getMockStackScreenProps } from 'test/utils'
import { mockNft, mockNft2, mockNft3 } from 'test/values'

describe('NftsInfoCarousel', () => {
  it('renders correctly with one Nft', () => {
    const { queryByTestId, getByTestId, getByText } = render(
      <NftsInfoCarousel
        {...getMockStackScreenProps(Screens.NftsInfoCarousel, { nfts: [mockNft] })}
      />
    )

    // Correct Nft Image and name should be rendered
    expect(
      getByTestId(`NftsInfoCarousel/NftImage-${mockNft.contractAddress}-${mockNft.tokenId}`)
    ).toBeTruthy()
    expect(getByText(mockNft.metadata!.name)).toBeTruthy()

    // The image carousel should not render if there is only one Nft
    expect(queryByTestId('NftsInfoCarousel/NftImageCarousel')).toBeNull()
  })

  it('renders correctly with two valid Nfts', () => {
    const { getByTestId, getByText } = render(
      <NftsInfoCarousel
        {...getMockStackScreenProps(Screens.NftsInfoCarousel, { nfts: [mockNft, mockNft2] })}
      />
    )

    // Correct Nft Image and name should be rendered
    expect(
      getByTestId(`NftsInfoCarousel/NftImage-${mockNft.contractAddress}-${mockNft.tokenId}`)
    ).toBeTruthy()
    expect(getByText(mockNft.metadata!.name)).toBeTruthy()

    expect(getByTestId('NftsInfoCarousel/NftImageCarousel')).toBeTruthy()

    // Toggle to Second Nft
    fireEvent.press(
      getByTestId(`NftsInfoCarousel/NftThumbnail/${mockNft2.contractAddress}-${mockNft2.tokenId}`)
    )
    expect(getByText(mockNft2.metadata!.name)).toBeTruthy()

    // Return to first Nft
    fireEvent.press(
      getByTestId(`NftsInfoCarousel/NftThumbnail/${mockNft.contractAddress}-${mockNft.tokenId}`)
    )
    expect(getByText(mockNft.metadata!.name)).toBeTruthy()
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
        {...getMockStackScreenProps(Screens.NftsInfoCarousel, { nfts: [mockNft3] })}
      />
    )
    expect(getByText('nftInfoCarousel.nftImageLoadError')).toBeTruthy()
  })

  it('image carousel should not render Nfts with null metadata', () => {
    const { queryByTestId } = render(
      <NftsInfoCarousel
        {...getMockStackScreenProps(Screens.NftsInfoCarousel, { nfts: [mockNft, mockNft3] })}
      />
    )

    // Two Nfts but one with null metadata will prevent the image carousel from rendering
    expect(queryByTestId('NftsInfoCarousel/NftImageCarousel')).toBeNull()
  })

  it('should be able to navigate back', () => {
    const { getByTestId } = render(
      <NftsInfoCarousel
        {...getMockStackScreenProps(Screens.NftsInfoCarousel, { nfts: [mockNft] })}
      />
    )

    fireEvent.press(getByTestId('NftsInfoCarousel/BackButton'))
    expect(navigateBack).toHaveBeenCalled()
  })

  it('opens link for Explorer', () => {
    const { getByTestId } = render(
      <NftsInfoCarousel
        {...getMockStackScreenProps(Screens.NftsInfoCarousel, { nfts: [mockNft] })}
      />
    )

    fireEvent.press(getByTestId('ViewOnExplorer'))
    expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, {
      uri: `${networkConfig.celoExplorerBaseTokenUrl}${mockNft.contractAddress}/instance/${mockNft.tokenId}/metadata`,
    })
  })
})

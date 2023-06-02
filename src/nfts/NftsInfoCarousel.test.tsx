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
    const tree = render(
      <NftsInfoCarousel
        {...getMockStackScreenProps(Screens.NftsInfoCarousel, { nfts: [mockNft] })}
      />
    )

    expect(tree).toMatchSnapshot()
  })

  it('renders correctly with two valid Nfts', () => {
    const tree = render(
      <NftsInfoCarousel
        {...getMockStackScreenProps(Screens.NftsInfoCarousel, { nfts: [mockNft, mockNft2] })}
      />
    )

    expect(tree).toMatchSnapshot()
  })

  it('renders error state when no Nft(s)', () => {
    const tree = render(
      <NftsInfoCarousel {...getMockStackScreenProps(Screens.NftsInfoCarousel, { nfts: [] })} />
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders error image state on Nft null metadata', () => {
    const tree = render(
      <NftsInfoCarousel
        {...getMockStackScreenProps(Screens.NftsInfoCarousel, { nfts: [mockNft3] })}
      />
    )
    expect(tree).toMatchSnapshot()
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

  it('toggle active Nft', () => {
    const { getByTestId, getByText } = render(
      <NftsInfoCarousel
        {...getMockStackScreenProps(Screens.NftsInfoCarousel, { nfts: [mockNft, mockNft2] })}
      />
    )

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

import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import NftsInfoCarousel from 'src/nfts/NftsInfoCarousel'
import networkConfig from 'src/web3/networkConfig'
import { getMockStackScreenProps } from 'test/utils'
import { mockNftAllFields, mockNftMinimumFields, mockNftNullMetadata } from 'test/values'

describe('NftsInfoCarousel', () => {
  it('renders correctly with one Nft', () => {
    const { queryByTestId, getByTestId, getByText } = render(
      <NftsInfoCarousel
        {...getMockStackScreenProps(Screens.NftsInfoCarousel, { nfts: [mockNftAllFields] })}
      />
    )

    // Correct Nft Image and name should be rendered
    expect(
      getByTestId(
        `NftsInfoCarousel/NftImage-${mockNftAllFields.contractAddress}-${mockNftAllFields.tokenId}`
      )
    ).toBeTruthy()
    expect(getByText(mockNftAllFields.metadata!.name)).toBeTruthy()

    // The image carousel should not render if there is only one Nft
    expect(queryByTestId('NftsInfoCarousel/NftImageCarousel')).toBeNull()
  })

  it('renders correctly with two valid Nfts', () => {
    const { getByTestId, getByText } = render(
      <NftsInfoCarousel
        {...getMockStackScreenProps(Screens.NftsInfoCarousel, {
          nfts: [mockNftAllFields, mockNftMinimumFields],
        })}
      />
    )

    // Correct Nft Image and name should be rendered
    expect(
      getByTestId(
        `NftsInfoCarousel/NftImage-${mockNftAllFields.contractAddress}-${mockNftAllFields.tokenId}`
      )
    ).toBeTruthy()
    expect(getByText(mockNftAllFields.metadata!.name)).toBeTruthy()

    expect(getByTestId('NftsInfoCarousel/NftImageCarousel')).toBeTruthy()

    // Toggle to Second Nft
    fireEvent.press(
      getByTestId(
        `NftsInfoCarousel/NftThumbnail/${mockNftMinimumFields.contractAddress}-${mockNftMinimumFields.tokenId}`
      )
    )
    expect(getByText(mockNftMinimumFields.metadata!.name)).toBeTruthy()

    // Return to first Nft
    fireEvent.press(
      getByTestId(
        `NftsInfoCarousel/NftThumbnail/${mockNftAllFields.contractAddress}-${mockNftAllFields.tokenId}`
      )
    )
    expect(getByText(mockNftAllFields.metadata!.name)).toBeTruthy()
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

  it('image carousel should not render Nfts with null metadata', () => {
    const { queryByTestId } = render(
      <NftsInfoCarousel
        {...getMockStackScreenProps(Screens.NftsInfoCarousel, {
          nfts: [mockNftAllFields, mockNftNullMetadata],
        })}
      />
    )

    // Two Nfts but one with null metadata will prevent the image carousel from rendering
    expect(queryByTestId('NftsInfoCarousel/NftImageCarousel')).toBeNull()
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
})

import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import NftsInfoCarousel from 'src/nfts/NftsInfoCarousel'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockNftAllFields, mockNftMinimumFields, mockNftNullMetadata } from 'test/values'

jest.mock('src/utils/Logger')

describe('NftsInfoCarousel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly with one Nft', () => {
    const { queryByTestId, getByTestId, getByText } = render(
      <Provider store={createMockStore()}>
        <NftsInfoCarousel
          {...getMockStackScreenProps(Screens.NftsInfoCarousel, { nfts: [mockNftAllFields] })}
        />
      </Provider>
    )

    // Correct image source should be rendered
    expect(getByTestId('NftsInfoCarousel/MainVideo').children[0]).toHaveProp(
      'source',
      expect.objectContaining({
        uri: mockNftAllFields.media[1].gateway,
        headers: {
          origin: networkConfig.nftsValoraAppUrl,
        },
      })
    )
    expect(getByText(mockNftAllFields.metadata!.name)).toBeTruthy()

    // The image carousel should not render if there is only one Nft
    expect(queryByTestId('NftsInfoCarousel/NftImageCarousel')).toBeNull()
  })

  it('renders correctly with two valid Nfts', () => {
    const nft1Thumbnail = `NftsInfoCarousel/NftThumbnail/${mockNftAllFields.contractAddress}-${mockNftAllFields.tokenId}`
    const nft2Thumbnail = `NftsInfoCarousel/NftThumbnail/${mockNftMinimumFields.contractAddress}-${mockNftMinimumFields.tokenId}`
    const { getByTestId, getByText } = render(
      <Provider store={createMockStore()}>
        <NftsInfoCarousel
          {...getMockStackScreenProps(Screens.NftsInfoCarousel, {
            nfts: [mockNftAllFields, mockNftMinimumFields],
          })}
        />
      </Provider>
    )

    // Carousel should be rendered
    expect(getByTestId('NftsInfoCarousel/NftImageCarousel')).toBeTruthy()

    // Correct Nft Video and name should be rendered
    expect(getByTestId('NftsInfoCarousel/MainVideo').children[0]).toHaveProp(
      'source',
      expect.objectContaining({
        uri: mockNftAllFields.media[1].gateway,
        headers: {
          origin: networkConfig.nftsValoraAppUrl,
        },
      })
    )
    expect(getByText(mockNftAllFields.metadata!.name)).toBeTruthy()

    // Toggle to Second Nft
    fireEvent.press(getByTestId(nft2Thumbnail))
    expect(getByText(mockNftMinimumFields.metadata!.name)).toBeTruthy()
    expect(getByTestId('NftsInfoCarousel/MainImage')).toHaveProp(
      'source',
      expect.objectContaining({
        uri: mockNftMinimumFields.media[0].gateway,
        headers: {
          origin: networkConfig.nftsValoraAppUrl,
        },
      })
    )

    // Return to first Nft
    fireEvent.press(getByTestId(nft1Thumbnail))
    expect(getByText(mockNftAllFields.metadata!.name)).toBeTruthy()
    expect(getByTestId('NftsInfoCarousel/MainVideo').children[0]).toHaveProp(
      'source',
      expect.objectContaining({
        uri: mockNftAllFields.media[1].gateway,
        headers: {
          origin: networkConfig.nftsValoraAppUrl,
        },
      })
    )
  })

  it('renders full screen error when no Nft(s)', () => {
    const { getByTestId, queryByTestId } = render(
      <Provider store={createMockStore()}>
        <NftsInfoCarousel {...getMockStackScreenProps(Screens.NftsInfoCarousel, { nfts: [] })} />
      </Provider>
    )

    expect(getByTestId('NftsInfoCarousel/NftsLoadErrorScreen')).toBeTruthy()
    expect(queryByTestId('NftsInfoCarousel')).toBeNull()
  })

  it('renders error image state on Nft null metadata', () => {
    const { getByText } = render(
      <Provider store={createMockStore()}>
        <NftsInfoCarousel
          {...getMockStackScreenProps(Screens.NftsInfoCarousel, { nfts: [mockNftNullMetadata] })}
        />
      </Provider>
    )
    expect(getByText('nftInfoCarousel.nftImageLoadError')).toBeTruthy()
  })

  it('image carousel should render Nfts with null metadata as red info icon', () => {
    const { getByTestId, getByText, queryByText } = render(
      <Provider store={createMockStore()}>
        <NftsInfoCarousel
          {...getMockStackScreenProps(Screens.NftsInfoCarousel, {
            nfts: [mockNftAllFields, mockNftNullMetadata],
          })}
        />
      </Provider>
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
      <Provider store={createMockStore()}>
        <NftsInfoCarousel
          {...getMockStackScreenProps(Screens.NftsInfoCarousel, { nfts: [mockNftMinimumFields] })}
        />
      </Provider>
    )

    fireEvent.press(getByTestId('ViewOnExplorer'))
    expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, {
      uri: `${networkConfig.celoExplorerBaseNFTUrl}${mockNftMinimumFields.contractAddress}/instance/${mockNftMinimumFields.tokenId}/metadata`,
    })
  })

  it('should not render link to explorer if no token id is provided', () => {
    const noTokenId = mockNftMinimumFields
    noTokenId.tokenId = null as unknown as string
    const { queryByTestId } = render(
      <Provider store={createMockStore()}>
        <NftsInfoCarousel
          {...getMockStackScreenProps(Screens.NftsInfoCarousel, { nfts: [noTokenId] })}
        />
      </Provider>
    )

    expect(queryByTestId('ViewOnExplorer')).toBeNull()
  })
})

import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import NftsInfoCarousel from 'src/nfts/NftsInfoCarousel'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockNft, mockNft2, mockNft3 } from 'test/values'

describe('NftsInfoCarousel', () => {
  it('renders correctly with one Nft', () => {
    const store = createMockStore({})
    store.dispatch = jest.fn()
    const { queryByTestId, getByTestId, getByText } = render(
      <Provider store={store}>
        <NftsInfoCarousel
          {...getMockStackScreenProps(Screens.NftsInfoCarousel, { nfts: [mockNft] })}
        />
      </Provider>
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
    const store = createMockStore({})
    store.dispatch = jest.fn()
    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <NftsInfoCarousel
          {...getMockStackScreenProps(Screens.NftsInfoCarousel, { nfts: [mockNft, mockNft2] })}
        />
      </Provider>
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
    const store = createMockStore({})
    store.dispatch = jest.fn()
    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <NftsInfoCarousel {...getMockStackScreenProps(Screens.NftsInfoCarousel, { nfts: [] })} />
      </Provider>
    )

    expect(getByTestId('NftsInfoCarousel/NftsLoadErrorScreen')).toBeTruthy()
    expect(queryByTestId('NftsInfoCarousel')).toBeNull()
  })

  it('renders error image state on Nft null metadata', () => {
    const store = createMockStore({})
    store.dispatch = jest.fn()
    const { getByText } = render(
      <Provider store={store}>
        <NftsInfoCarousel
          {...getMockStackScreenProps(Screens.NftsInfoCarousel, { nfts: [mockNft3] })}
        />
      </Provider>
    )
    expect(getByText('nftInfoCarousel.nftImageLoadError')).toBeTruthy()
  })

  it('image carousel should not render Nfts with null metadata', () => {
    const store = createMockStore({})
    store.dispatch = jest.fn()
    const { queryByTestId } = render(
      <Provider store={store}>
        <NftsInfoCarousel
          {...getMockStackScreenProps(Screens.NftsInfoCarousel, { nfts: [mockNft, mockNft3] })}
        />
      </Provider>
    )

    // Two Nfts but one with null metadata will prevent the image carousel from rendering
    expect(queryByTestId('NftsInfoCarousel/NftImageCarousel')).toBeNull()
  })

  it('should be able to navigate back', () => {
    const store = createMockStore({})
    store.dispatch = jest.fn()
    const { getByTestId } = render(
      <Provider store={store}>
        <NftsInfoCarousel
          {...getMockStackScreenProps(Screens.NftsInfoCarousel, { nfts: [mockNft] })}
        />
      </Provider>
    )

    fireEvent.press(getByTestId('NftsInfoCarousel/BackButton'))
    expect(navigateBack).toHaveBeenCalled()
  })

  it('opens link for Explorer', () => {
    const store = createMockStore({})
    store.dispatch = jest.fn()
    const { getByTestId } = render(
      <Provider store={store}>
        <NftsInfoCarousel
          {...getMockStackScreenProps(Screens.NftsInfoCarousel, { nfts: [mockNft] })}
        />
      </Provider>
    )

    fireEvent.press(getByTestId('ViewOnExplorer'))
    expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, {
      uri: `${networkConfig.celoExplorerBaseTokenUrl}${mockNft.contractAddress}/instance/${mockNft.tokenId}/metadata`,
    })
  })
})

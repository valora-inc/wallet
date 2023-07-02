import { render } from '@testing-library/react-native'
import React from 'react'
import { Text } from 'react-native'
import { NftEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import NftImage from 'src/nfts/NftImage'
import { NftOrigin } from 'src/nfts/types'
import { mockNftAllFields, mockNftNullMetadata } from 'test/values'

jest.mock('src/analytics/ValoraAnalytics')

describe('NftImage', () => {
  const ErrorComponent = <Text>Some error state</Text>

  it('should initially display a loading state', () => {
    const { getByTestId, queryByText } = render(
      <NftImage
        nft={mockNftAllFields}
        origin={NftOrigin.NftsInfoCarouselMain}
        ErrorComponent={ErrorComponent}
        testID="NftImage"
      />
    )

    expect(getByTestId('NftImage')).toBeTruthy()
    expect(getByTestId('NftImage/ImagePlaceholder')).toBeTruthy()
    expect(queryByText('Some error state')).toBeFalsy()
    expect(ValoraAnalytics.track).not.toHaveBeenCalled()
  })

  it('should display an error state if there is no nft metadata', () => {
    const { getByText, queryByTestId } = render(
      <NftImage
        nft={mockNftNullMetadata}
        origin={NftOrigin.NftsInfoCarouselMain}
        ErrorComponent={ErrorComponent}
        testID="NftImage"
      />
    )

    expect(queryByTestId('NftImage')).toBeFalsy()
    expect(queryByTestId('NftImage/ImagePlaceholder')).toBeFalsy()
    expect(getByText('Some error state')).toBeTruthy()
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(NftEvents.nft_image_load, {
      contractAddress: '0x000000000000000000000000000000000000CE10',
      error: 'No nft metadata',
      origin: 'nftsInfoCarouselMain',
      tokenId: '4',
      url: undefined,
    })
  })
})

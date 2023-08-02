import { render } from '@testing-library/react-native'
import React from 'react'
import { Text } from 'react-native'
import { Provider } from 'react-redux'
import { NftEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import NftVideo from 'src/nfts/NftVideo'
import { NftOrigin } from 'src/nfts/types'
import { createMockStore } from 'test/utils'
import { mockNftAllFields, mockNftNullMetadata } from 'test/values'

jest.mock('src/analytics/ValoraAnalytics')
jest.mock('react-native-video', () => 'ReactNativeVideo')

describe('NftVideo', () => {
  const ErrorComponent = <Text>Some error state</Text>

  it('should initially display a loading state', () => {
    const { getByTestId, queryByText } = render(
      <Provider store={createMockStore()}>
        <NftVideo
          nft={mockNftAllFields}
          origin={NftOrigin.NftsInfoCarouselMain}
          ErrorComponent={ErrorComponent}
          testID="NftVideo"
        />
      </Provider>
    )

    expect(getByTestId('NftVideo')).toBeTruthy()
    expect(getByTestId('NftVideo/VideoPlaceholder')).toBeTruthy()
    expect(queryByText('Some error state')).toBeFalsy()
    expect(ValoraAnalytics.track).not.toHaveBeenCalled()
  })

  it('should display an error state if there is no nft metadata', () => {
    const { getByText, queryByTestId } = render(
      <Provider store={createMockStore()}>
        <NftVideo
          nft={mockNftNullMetadata}
          origin={NftOrigin.NftsInfoCarouselMain}
          ErrorComponent={ErrorComponent}
          testID="NftVideo"
        />
      </Provider>
    )

    expect(queryByTestId('NftVideo')).toBeFalsy()
    expect(queryByTestId('NftVideo/ImagePlaceholder')).toBeFalsy()
    expect(getByText('Some error state')).toBeTruthy()
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(NftEvents.nft_video_load, {
      contractAddress: '0x000000000000000000000000000000000000CE10',
      error: 'No nft metadata',
      origin: 'nftsInfoCarouselMain',
      tokenId: '4',
      url: undefined,
    })
  })
})

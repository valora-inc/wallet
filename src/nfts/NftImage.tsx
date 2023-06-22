import React, { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { NftEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import SkeletonPlaceholder from 'src/components/SkeletonPlaceholder'
import { Nft, NftOrigin } from 'src/nfts/types'
import colors from 'src/styles/colors'
import variables from 'src/styles/variables'
import Logger from 'src/utils/Logger'

const DEFAULT_IMAGE_HEIGHT = 360

interface ImagePlaceHolderProps {
  testID: string
  height?: number
  width?: number
  borderRadius?: number
}

interface Props extends ImagePlaceHolderProps {
  nft: Nft
  origin: NftOrigin
  shouldAutoScaleHeight?: boolean
  ErrorComponent: React.ReactNode
}

function ImagePlaceholder({ height = 40, width, borderRadius = 0, testID }: ImagePlaceHolderProps) {
  return (
    <SkeletonPlaceholder
      borderRadius={borderRadius}
      backgroundColor={colors.gray2}
      highlightColor={colors.white}
    >
      <View
        style={{
          height,
          width: width ?? variables.width,
          zIndex: -1,
        }}
        testID={testID ?? 'NftsInfoCarousel/ImagePlaceholder'}
      />
    </SkeletonPlaceholder>
  )
}

export default function NftImage({
  nft,
  height,
  width,
  shouldAutoScaleHeight,
  borderRadius,
  origin,
  ErrorComponent,
  testID,
}: Props) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(!nft.metadata)
  const [scaledHeight, setScaledHeight] = useState(DEFAULT_IMAGE_HEIGHT)

  const imageUrl = useMemo(
    () => nft.media.find((media) => media.raw === nft.metadata?.image)?.gateway,
    [nft]
  )

  useEffect(() => {
    setError(!nft.metadata)
  }, [nft])

  function sendEventWithError(error: boolean) {
    const { contractAddress, tokenId } = nft
    ValoraAnalytics.track(NftEvents.nft_image_load, {
      tokenId,
      contractAddress,
      url: imageUrl,
      origin,
      error,
    })

    if (error) {
      Logger.error(
        origin,
        `ContractAddress=${contractAddress}, TokenId: ${tokenId}, Failed to load image from ${imageUrl}`
      )
    }
  }

  function handleLoadError() {
    sendEventWithError(true)
    setError(true)
  }

  function handleLoadSuccess() {
    sendEventWithError(false)
    setIsLoading(false)
  }

  return (
    <>
      {error ? (
        ErrorComponent
      ) : (
        <FastImage
          testID={testID}
          style={{
            borderRadius,
            height: shouldAutoScaleHeight ? scaledHeight : height,
            width,
          }}
          source={{
            uri: imageUrl,
          }}
          onLoad={({ nativeEvent: { width, height } }) => {
            const aspectRatio = width / height
            setScaledHeight(variables.width / aspectRatio)
          }}
          onLoadEnd={handleLoadSuccess}
          onError={handleLoadError}
          resizeMode={
            shouldAutoScaleHeight ? FastImage.resizeMode.contain : FastImage.resizeMode.cover
          }
        >
          {isLoading && (
            <ImagePlaceholder
              height={shouldAutoScaleHeight ? scaledHeight : height}
              width={width}
              borderRadius={borderRadius}
              testID={`${testID}/ImagePlaceholder`}
            />
          )}
        </FastImage>
      )}
    </>
  )
}

import React, { useMemo, useState } from 'react'
import { ImageStyle, StyleProp, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { NftEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import SkeletonPlaceholder from 'src/components/SkeletonPlaceholder'
import { Nft, NftOrigin } from 'src/nfts/types'
import colors from 'src/styles/colors'
import variables from 'src/styles/variables'
import Logger from 'src/utils/Logger'

const DEFAULT_IMAGE_HEIGHT = 360

function scaleImageHeight(originalWidth: number, originalHeight: number, targetWidth: number) {
  const aspectRatio = originalWidth / originalHeight
  return targetWidth / aspectRatio
}
interface ImagePlaceHolderProps {
  testID: string
  height?: number
  width?: number
  borderRadius?: number
}

interface Props extends ImagePlaceHolderProps {
  nft: Nft
  onImageLoadError(): void
  origin: NftOrigin
  shouldAutoScaleHeight?: boolean
  imageStyles?: StyleProp<ImageStyle>
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
          borderRadius,
          zIndex: -1,
        }}
        testID={testID ?? 'NftsInfoCarousel/ImagePlaceholder'}
      />
    </SkeletonPlaceholder>
  )
}

export default function NftImage({
  nft,
  onImageLoadError,
  height,
  width,
  imageStyles,
  shouldAutoScaleHeight = false,
  borderRadius,
  origin,
  testID,
}: Props) {
  const [isLoading, setIsLoading] = useState(true)
  const [scaledHeight, setScaledHeight] = useState(DEFAULT_IMAGE_HEIGHT)

  const imageUrl = useMemo(
    () => nft.media.find((media) => media.raw === nft.metadata?.image)?.gateway,
    [nft]
  )

  function handleLoadError() {
    const { contractAddress, tokenId } = nft
    Logger.error(
      origin,
      `ContractAddress=${contractAddress}, TokenId: ${tokenId}, Failed to load image from ${imageUrl}`
    )
    ValoraAnalytics.track(NftEvents.nft_image_load, {
      tokenId,
      contractAddress,
      url: imageUrl,
      origin,
      error: true,
    })
    onImageLoadError()
  }

  function handleLoadSuccess() {
    const { contractAddress, tokenId } = nft
    ValoraAnalytics.track(NftEvents.nft_image_load, {
      tokenId,
      contractAddress,
      url: imageUrl,
      origin,
      error: false,
    })
    setIsLoading(false)
  }

  return (
    <FastImage
      testID={testID}
      style={[
        { borderRadius, height: shouldAutoScaleHeight ? scaledHeight : height },
        // @ts-ignore
        imageStyles,
      ]}
      source={{
        uri: imageUrl,
      }}
      onLoad={(e) => {
        if (shouldAutoScaleHeight) {
          setScaledHeight(
            scaleImageHeight(e.nativeEvent.width, e.nativeEvent.height, variables.width)
          )
        }
      }}
      onLoadEnd={handleLoadSuccess}
      onError={handleLoadError}
      resizeMode={FastImage.resizeMode.cover}
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
  )
}

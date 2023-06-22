import React, { useMemo, useState } from 'react'
import { ImageStyle, StyleProp, StyleSheet, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { NftEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import SkeletonPlaceholder from 'src/components/SkeletonPlaceholder'
import { Nft, NftOrigin } from 'src/nfts/types'
import colors from 'src/styles/colors'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import Logger from 'src/utils/Logger'

const DEFAULT_IMAGE_HEIGHT = 360

function scaleImageHeight(originalWidth: number, originalHeight: number, targetWidth: number) {
  const aspectRatio = originalWidth / originalHeight
  return targetWidth / aspectRatio
}
interface ImagePlaceHolderProps {
  height: number
  width?: number
  borderRadius?: number
  testID?: string
}

function ImagePlaceholder({ height = 40, width, borderRadius = 8, testID }: ImagePlaceHolderProps) {
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
          borderRadius,
        }}
        testID={testID ?? 'NftsInfoCarousel/ImagePlaceholder'}
      />
    </SkeletonPlaceholder>
  )
}

interface Props {
  nft: Nft
  onImageLoadError(): void
  testID: string
  origin: NftOrigin
  height?: number
  width?: number
  shouldAutoScaleHeight?: boolean
  imageStyles?: StyleProp<ImageStyle>
}

export default function NftImage({
  nft,
  onImageLoadError,
  height,
  width,
  imageStyles,
  shouldAutoScaleHeight = false,
  testID,
  origin,
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
        shouldAutoScaleHeight ? { height: scaledHeight } : {},
        // @ts-ignore
        imageStyles,
        // Put a border radius on the image when loading to match placeholder
        isLoading && styles.loading,
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
          height={height ?? scaledHeight}
          width={width}
          testID={`${testID}/ImagePlaceholder`}
        />
      )}
    </FastImage>
  )
}

const styles = StyleSheet.create({
  loading: {
    borderRadius: Spacing.Smallest8,
  },
})

import { useHeaderHeight } from '@react-navigation/elements'
import React, { useEffect, useState } from 'react'
import { Platform, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import Video, { ResizeMode } from 'react-native-video'
import { NftEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import SkeletonPlaceholder from 'src/components/SkeletonPlaceholder'
import { nftsLoadingSelector } from 'src/nfts/selectors'
import { Nft, NftOrigin } from 'src/nfts/types'
import { useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'
import variables from 'src/styles/variables'
import Logger from 'src/utils/Logger'
import networkConfig from 'src/web3/networkConfig'

const DEFAULT_HEIGHT = 360

interface PlaceHolderProps {
  testID: string
  height?: number
  width?: number
  borderRadius?: number
  mediaType: 'image' | 'video'
}

interface Props extends PlaceHolderProps {
  nft: Nft
  origin: NftOrigin
  shouldAutoScaleHeight?: boolean
  ErrorComponent: React.ReactNode
}

function Placeholder({
  testID,
  width,
  height = DEFAULT_HEIGHT,
  borderRadius = 0,
}: PlaceHolderProps) {
  return (
    <SkeletonPlaceholder
      borderRadius={borderRadius}
      backgroundColor={colors.gray2}
      highlightColor={colors.white}
      testID={testID}
    >
      <View
        style={{
          height,
          width: width ?? variables.width,
          zIndex: -1,
        }}
      />
    </SkeletonPlaceholder>
  )
}

type Status = 'loading' | 'error' | 'success'

export default function NftMedia({
  nft,
  height,
  width,
  shouldAutoScaleHeight,
  borderRadius,
  origin,
  ErrorComponent,
  testID,
  mediaType,
}: Props) {
  const [status, setStatus] = useState<Status>(!nft.metadata ? 'error' : 'loading')
  const [scaledHeight, setScaledHeight] = useState(DEFAULT_HEIGHT)
  const [reloadAttempt, setReloadAttempt] = useState(0)
  const headerHeight = useHeaderHeight()

  const fetchingNfts = useSelector(nftsLoadingSelector)

  const imageUrl = nft.media.find((media) => media.raw === nft.metadata?.image)?.gateway
  const videoUrl = nft.media.find((media) => media.raw === nft.metadata?.animation_url)?.gateway

  useEffect(() => {
    if (nft.metadata) {
      setStatus('loading')
    } else {
      sendLoadEvent('No nft metadata')
      setStatus('error')
    }
  }, [`${nft.contractAddress}-${nft.tokenId}`])

  // if the image failed to load before, try again when the user pulls to refresh
  useEffect(() => {
    if (status === 'error' && fetchingNfts) {
      setStatus('loading')
      setReloadAttempt((prev) => prev + 1)
    }
  }, [status, fetchingNfts])

  function sendLoadEvent(error?: string) {
    const { contractAddress, tokenId } = nft
    ValoraAnalytics.track(NftEvents.nft_media_load, {
      tokenId,
      contractAddress,
      url: imageUrl,
      origin,
      error,
      mediaType,
    })

    if (error) {
      Logger.error(
        origin,
        `ContractAddress=${contractAddress}, TokenId: ${tokenId}, Failed to load media from ${
          mediaType === 'video' && videoUrl ? videoUrl : imageUrl
        }`
      )
    }
  }

  function handleLoadError() {
    sendLoadEvent('Failed to load media')
    setStatus('error')
  }

  function handleLoadSuccess() {
    sendLoadEvent()
    setStatus('success')
  }

  return (
    <>
      {status === 'error' ? (
        ErrorComponent
      ) : mediaType === 'video' && videoUrl ? (
        <View testID={testID}>
          <Video
            source={{
              uri: videoUrl,
              headers: {
                origin: networkConfig.nftsValoraAppUrl,
              },
            }}
            key={`${nft.contractAddress}-${nft.tokenId}-${reloadAttempt}`}
            style={{
              height: shouldAutoScaleHeight ? scaledHeight : height,
              width: variables.width,
              marginTop: Platform.OS === 'ios' ? headerHeight / 2 : 0, // Otherwise the fullscreen option is hidden on iOS
              zIndex: 1, // Make sure the video player is in front of the loading skeleton
            }}
            onLoad={({ naturalSize }) => {
              const aspectRatio = naturalSize.width / naturalSize.height
              setScaledHeight(variables.width / aspectRatio)
              handleLoadSuccess()
            }}
            onError={handleLoadError}
            controls={true}
            minLoadRetryCount={3}
            repeat={true}
            resizeMode={shouldAutoScaleHeight ? ResizeMode.CONTAIN : ResizeMode.COVER}
          />
          {/* This is a hack to get the loading skeleton to overlay the media player while loading, nesting within the player doesn't work */}
          <View style={{ marginTop: -DEFAULT_HEIGHT }}>
            <Placeholder mediaType="video" testID={`${testID}/VideoPlaceholder`} />
          </View>
        </View>
      ) : (
        <FastImage
          key={`${nft.contractAddress}-${nft.tokenId}-${reloadAttempt}`}
          testID={testID}
          style={{
            borderRadius,
            height: shouldAutoScaleHeight ? scaledHeight : height,
            width,
          }}
          source={{
            uri: imageUrl,
            headers: {
              origin: networkConfig.nftsValoraAppUrl,
            },
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
          {status === 'loading' && (
            <Placeholder
              height={shouldAutoScaleHeight ? scaledHeight : height}
              width={width}
              borderRadius={borderRadius}
              testID={`${testID}/ImagePlaceholder`}
              mediaType="image"
            />
          )}
        </FastImage>
      )}
    </>
  )
}

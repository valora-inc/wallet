import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import Video from 'react-native-video'
import { useSelector } from 'react-redux'
import { NftEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import SkeletonPlaceholder from 'src/components/SkeletonPlaceholder'
import { nftsLoadingSelector } from 'src/nfts/selectors'
import { Nft, NftOrigin } from 'src/nfts/types'
import colors from 'src/styles/colors'
import variables from 'src/styles/variables'
import Logger from 'src/utils/Logger'
import networkConfig from 'src/web3/networkConfig'

const DEFAULT_VIDEO_HEIGHT = 360

interface VideoPlaceHolderProps {
  testID: string
}

interface Props extends VideoPlaceHolderProps {
  nft: Nft
  origin: NftOrigin
  shouldAutoScaleHeight?: boolean
  ErrorComponent: React.ReactNode
}

function VideoPlaceholder({ testID }: VideoPlaceHolderProps) {
  return (
    <SkeletonPlaceholder
      backgroundColor={colors.gray2}
      highlightColor={colors.white}
      testID={testID}
    >
      <View
        style={{
          height: DEFAULT_VIDEO_HEIGHT,
          width: variables.width,
          zIndex: -1,
        }}
      />
    </SkeletonPlaceholder>
  )
}

type Status = 'loading' | 'error' | 'success'

export default function NftImage({ nft, origin, ErrorComponent, testID }: Props) {
  const [status, setStatus] = useState<Status>(!nft.metadata ? 'error' : 'loading')
  const [reloadAttempt, setReloadAttempt] = useState(0)

  const fetchingNfts = useSelector(nftsLoadingSelector)

  const videoUrl = nft.media.find((media) => media.raw === nft.metadata?.animation_url)?.gateway

  useEffect(() => {
    if (nft.metadata) {
      setStatus('loading')
    } else {
      sendImageLoadEvent('No nft metadata')
      setStatus('error')
    }
  }, [`${nft.contractAddress}-${nft.tokenId}`])

  useEffect(() => {
    // if the Video failed to load before, try again when the user pulls to refresh
    if (status === 'error' && fetchingNfts) {
      setStatus('loading')
      setReloadAttempt((prev) => prev + 1)
    }
  }, [status, fetchingNfts])

  function sendImageLoadEvent(error?: string) {
    const { contractAddress, tokenId } = nft
    ValoraAnalytics.track(NftEvents.nft_video_load, {
      tokenId,
      contractAddress,
      url: videoUrl,
      origin,
      error,
    })

    if (error) {
      Logger.error(
        origin,
        `ContractAddress=${contractAddress}, TokenId: ${tokenId}, Failed to load video from ${videoUrl}`
      )
    }
  }

  function handleLoadError() {
    sendImageLoadEvent('Failed to load video')
    setStatus('error')
  }

  function handleLoadSuccess() {
    sendImageLoadEvent()
    setStatus('success')
  }

  return (
    <>
      {status === 'error' ? (
        ErrorComponent
      ) : (
        <Video
          source={{
            uri: videoUrl,
            headers: {
              origin: networkConfig.nftsValoraAppUrl,
            },
          }}
          key={`${nft.contractAddress}-${nft.tokenId}-${reloadAttempt}`}
          testID={testID}
          style={{
            marginTop: 42, // Otherwise the video controls are hidden behind the floating header :(
            height: DEFAULT_VIDEO_HEIGHT,
          }}
          onLoad={handleLoadSuccess}
          onError={handleLoadError}
          controls={true}
          resizeMode="cover"
          muted={true}
          minLoadRetryCount={3}
        >
          {status === 'loading' && <VideoPlaceholder testID={`${testID}/VideoPlaceholder`} />}
        </Video>
      )}
    </>
  )
}

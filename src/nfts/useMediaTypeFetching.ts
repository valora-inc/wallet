import { useEffect, useState } from 'react'
import { Nft } from 'src/nfts/types'

function useMediaTypeFetching(activeNft: Nft) {
  const [fetchedMediaType, setFetchedMediaType] = useState<'image' | 'video' | 'text/html' | null>(
    null
  )
  // This should use the useAsync hook instead of useState

  useEffect(() => {
    // If using in hook use the useAsync hook instead of async () =>
    const getMediaType = async () => {
      if (!activeNft || !activeNft.metadata || !activeNft.metadata.animation_url) {
        setFetchedMediaType('image')
        return
      }

      try {
        const response = await fetch(activeNft.metadata.animation_url)
        const contentType = response.headers.get('Content-Type')

        if (contentType?.includes('video')) {
          setFetchedMediaType('video')
        } else {
          setFetchedMediaType('text/html')
        }
      } catch (error) {
        // Handle any fetch errors
        setFetchedMediaType('image')
      }
    }

    getMediaType()
  }, [activeNft])

  return fetchedMediaType
}

export default useMediaTypeFetching

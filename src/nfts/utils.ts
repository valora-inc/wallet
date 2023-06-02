import Share from 'react-native-share'
import { Nft } from 'src/nfts/types'
import { fetchImageAsBase64, saveRemoteToCameraRoll } from 'src/utils/image'
import Logger from 'src/utils/Logger'

const TAG = 'nfts/utils'

// TODO: Add analytics for sharing nft
export const onShare = async (nft: Nft) => {
  try {
    const url =
      nft.media.find((media) => media.raw === nft.metadata?.image)?.gateway ?? nft.metadata?.image
    if (!url) throw new Error('No image url found')
    const { data, mimeType } = await fetchImageAsBase64(url)
    const dataUrl = `data:${mimeType};base64,${data}`
    return Share.open({
      url: dataUrl,
      type: mimeType,
      failOnCancel: false, // don't throw if user cancels share
    })
  } catch (error) {
    Logger.error(TAG, 'Error sharing nft', error)
  }
}

export const onSave = async (nft: Nft) => {
  try {
    const url =
      nft.media.find((media) => media.raw === nft.metadata?.image)?.gateway ?? nft.metadata?.image
    if (!url) throw new Error('No image url found')
    await saveRemoteToCameraRoll(url)
  } catch (error) {
    Logger.error(TAG, 'Error saving nft', error)
  }
}

import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useAsync } from 'react-async-hook'
import { StyleSheet, Text, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { ScrollView } from 'react-native-gesture-handler'
import SkeletonPlaceholder from 'src/components/SkeletonPlaceholder'
import Touchable from 'src/components/Touchable'
import i18n from 'src/i18n'
import GreenLoadingSpinner from 'src/icons/GreenLoadingSpinner'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { Nft } from 'src/nfts/types'
import colors from 'src/styles/colors'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import Logger from 'src/utils/Logger'
import networkConfig from 'src/web3/networkConfig'

const TAG = 'nfts/NftGallery'

// get the size of the thumbnails base on screen sized
const imageSize = Math.min(variables.width / 2.5, variables.height / 6)

function useFetchNfts(address: string) {
  return useAsync(async () => {
    Logger.info(TAG, 'Fetching nfts...')
    try {
      const response = await fetchWithTimeout(`${networkConfig.getNftsUrl}?address=${address}`)
      Logger.info(TAG, `Nfts fetched (statusCode=${response.status})`)
      // status in the range 200-299
      if (!response.ok) {
        throw new Error(
          `Failed to fetch Nfts for ${address}: ${response.status} ${response.statusText}`
        )
      }
      const { result } = await response.json()
      return result as Nft[]
    } catch (error) {
      Logger.error(TAG, 'Failed to fetch nfts', error)
      throw error
    }
  }, [])
}

const ThumbnailImagePlaceholder = () => {
  return (
    <SkeletonPlaceholder backgroundColor={colors.gray2} highlightColor={colors.white}>
      <View style={[{ width: imageSize, height: imageSize }, styles.imageBorderRadius]} />
    </SkeletonPlaceholder>
  )
}

const NftThumbnail = ({ nft }: { nft: Nft }) => {
  const [loading, setLoading] = React.useState(true)
  const url =
    nft.media.find((media) => media.raw === nft.metadata?.image)?.gateway ?? nft.metadata?.image
  return (
    <View style={[styles.imageThumbNail, styles.imageBorderRadius]}>
      <FastImage
        style={[{ width: imageSize, height: imageSize }, styles.imageBorderRadius]}
        source={{ uri: url }}
        onLoadEnd={() => setLoading(false)}
        resizeMode={FastImage.resizeMode.cover}
      >
        {loading && <ThumbnailImagePlaceholder />}
      </FastImage>
    </View>
  )
}

type Props = NativeStackScreenProps<StackParamList, Screens.NftGallery>

export default function NftGallery({ route }: Props) {
  const { walletAddress } = route.params
  const asyncNfts = useFetchNfts(walletAddress)
  const { result, loading, error } = asyncNfts || []

  return (
    <ScrollView contentContainerStyle={styles.contentContainer} style={styles.scrollContainer}>
      {loading && <GreenLoadingSpinner />}
      {error && <Text>Error: {error.message}</Text>}
      <View style={styles.galleryContainer}>
        {result &&
          result
            .filter((nft) => nft.metadata)
            .map((nft) => {
              return (
                <Touchable
                  key={`${nft.contractAddress}-${nft.tokenId}`}
                  onPress={() => navigate(Screens.NftsInfoCarousel, { nfts: [nft] })}
                >
                  <NftThumbnail nft={nft} />
                </Touchable>
              )
            })}
      </View>
    </ScrollView>
  )
}

NftGallery.navigationOptions = () => {
  return {
    ...headerWithBackButton,
    headerTitle: i18n.t('nftGallery.title'),
  }
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryContainer: {
    alignContent: 'space-around',
    justifyContent: 'space-evenly',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  imageBorderRadius: {
    borderRadius: 8,
  },
  imageThumbNail: {
    padding: Spacing.Smallest8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  scrollContainer: {
    flex: 1,
    padding: Spacing.Regular16,
    columnCount: 3,
  },
})

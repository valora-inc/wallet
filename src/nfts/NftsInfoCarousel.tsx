import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useState } from 'react'
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { SafeAreaView } from 'react-native-safe-area-context'
import SkeletonPlaceholder from 'src/components/SkeletonPlaceholder'
import Touchable from 'src/components/Touchable'
import BackChevronStatic from 'src/icons/BackChevronStatic'
import OpenLinkIcon from 'src/icons/OpenLinkIcon'
import TripleDotHorizontal from 'src/icons/TripleDotHorizontal'
import { navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import Logger from 'src/utils/Logger'
import networkConfig from 'src/web3/networkConfig'

const TAG = 'nfts/NftsInfoCarousel'

type Props = NativeStackScreenProps<StackParamList, Screens.NftInfoCarousel>

const scaleImageHeight = (originalWidth: number, originalHeight: number, targetWidth: number) => {
  const aspectRatio = originalWidth / originalHeight
  return targetWidth / aspectRatio
}

export default function NftsInfoCarousel({ route }: Props) {
  const { nfts } = route.params
  const [activeNft, setActiveNft] = useState((nfts && nfts[0]) ?? null)
  const [isLoading, setIsLoading] = useState(true)
  // @ts-expect-error wip
  const [shareBottomSheetVisible, setShareBottomSheetVisible] = useState(false)
  const [scaledHeight, setScaledHeight] = useState(360)

  // Some components that require parent state defined here
  const TopBarButtons = () => {
    return (
      <View style={styles.overlay}>
        <TopBarIconButton
          onPress={() => navigateBack()}
          icon={<BackChevronStatic />}
          style={styles.button}
        />
        <TopBarIconButton
          onPress={() => setShareBottomSheetVisible((prev) => !prev)}
          icon={<TripleDotHorizontal />}
          style={styles.button}
        />
      </View>
    )
  }

  const ThumbnailImagePlaceholder = () => {
    return (
      <SkeletonPlaceholder backgroundColor={colors.gray2} highlightColor={colors.white}>
        <View
          style={{
            height: 40,
            width: 40,
            zIndex: -1,
          }}
        />
      </SkeletonPlaceholder>
    )
  }

  const MainImagePlaceholder = () => {
    return (
      <SkeletonPlaceholder
        borderRadius={8}
        backgroundColor={colors.gray2}
        highlightColor={colors.white}
      >
        <View
          style={{
            height: scaledHeight,
            width: variables.width,
            zIndex: -1,
          }}
        />
      </SkeletonPlaceholder>
    )
  }

  const NftImageCarousel = () => {
    return (
      <View style={styles.NftImageCarouselContainer}>
        <ScrollView
          showsHorizontalScrollIndicator={false}
          horizontal={true}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          style={styles.NftImageCarousel}
        >
          {nfts.map((nft) => {
            let loading = true
            return (
              <Touchable key={nft.metadata?.image} onPress={() => setActiveNft(nft)}>
                <FastImage
                  style={[
                    styles.NftPreviewImageShared,
                    activeNft.tokenUri === nft.tokenUri
                      ? styles.NftPreviewImageSelected
                      : styles.NftPreviewImageUnSelected,
                  ]}
                  source={{
                    uri: nft.media.find((media) => media.raw === nft.metadata?.image)?.gateway,
                  }}
                  onLoad={(e) => {
                    loading = false
                  }}
                  onError={() => {
                    Logger.error(TAG, 'Error loading Nft preview image')
                  }}
                  resizeMode={FastImage.resizeMode.cover}
                >
                  {loading && <ThumbnailImagePlaceholder />}
                </FastImage>
              </Touchable>
            )
          })}
        </ScrollView>
      </View>
    )
  }

  // TODO: Proper Error screen for failure loading Nfts
  if (nfts.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error Loading Nfts</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView>
      <TopBarButtons />
      <ScrollView style={{ height: '100%' }}>
        <FastImage
          style={[
            {
              height: scaledHeight,
              width: variables.width,
            },
          ]}
          source={{
            uri: activeNft.media.find((media) => media.raw === activeNft.metadata?.image)?.gateway,
          }}
          onLoad={(e) => {
            setScaledHeight(
              scaleImageHeight(e.nativeEvent.width, e.nativeEvent.height, variables.width)
            )
          }}
          onLoadEnd={() => setIsLoading(false)}
          onError={() => {
            Logger.error(TAG, 'Error loading Nft image')
          }}
          resizeMode={FastImage.resizeMode.contain}
        >
          {isLoading && <MainImagePlaceholder />}
        </FastImage>
        {nfts.length > 1 && <NftImageCarousel />}
        <View style={styles.sectionContainer}>
          <Text style={styles.title}>{activeNft.metadata?.name}</Text>
        </View>
        <View style={styles.sectionContainer}>
          <Text style={styles.subSectionTitle}>Description</Text>
          <Text style={styles.text}>{activeNft.metadata?.description}</Text>
        </View>
        {activeNft.metadata?.attributes && (
          <View style={styles.sectionContainer}>
            <Text style={styles.subSectionTitle}>Properties</Text>
            {activeNft.metadata?.attributes.map((attribute, index) => (
              <View key={index} style={styles.attributesContainer}>
                <Text style={[styles.attributeTitle, { color: colors.gray3 }]}>
                  {attribute.trait_type}
                </Text>
                <Text style={[styles.text, { color: colors.dark }]}>{attribute.value}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={[styles.sectionContainer, { marginTop: 0 }]}>
          {/* This should be dynamic based on Network in the future */}
          <Touchable
            onPress={() =>
              Linking.openURL(
                `${networkConfig.celoExplorerBaseTokenUrl}${activeNft.contractAddress}/instance/${activeNft.tokenId}/metadata`
              )
            }
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.explorerLink}>View on Celo Explorer</Text>
              <OpenLinkIcon color={colors.gray4} />
            </View>
          </Touchable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginHorizontal: Spacing.Thick24,
    marginTop: Spacing.Regular16,
  },
  title: {
    ...fontStyles.h1,
  },
  subSectionTitle: {
    ...fontStyles.large600,
    marginBottom: Spacing.Regular16,
  },
  text: {
    ...fontStyles.regular,
  },
  attributesContainer: {
    paddingBottom: Spacing.Thick24,
  },
  attributeTitle: {
    ...fontStyles.small500,
  },
  overlay: {
    padding: Spacing.Regular16,
    marginTop: Spacing.Regular16,
    position: 'absolute',
    top: 0,
    left: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 40,
    zIndex: 1,
    width: '100%',
  },
  button: {
    backgroundColor: colors.white,
    borderColor: colors.gray2,
    borderWidth: 1,
    borderRadius: 100,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  NftImageCarouselContainer: {
    flex: 1,
  },
  NftImageCarousel: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.Regular16,
    paddingTop: Spacing.Smallest8,
  },
  NftPreviewImageShared: {
    marginLeft: Spacing.Smallest8,
    borderRadius: 8,
  },
  NftPreviewImageSelected: {
    width: 40,
    height: 40,
  },
  NftPreviewImageUnSelected: {
    width: 32,
    height: 32,
    opacity: 0.5,
  },
  explorerLink: {
    ...fontStyles.small500,
    paddingRight: Spacing.Smallest8,
  },
})

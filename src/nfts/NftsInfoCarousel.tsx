import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { SafeAreaView } from 'react-native-safe-area-context'
import SkeletonPlaceholder from 'src/components/SkeletonPlaceholder'
import Touchable from 'src/components/Touchable'
import InfoIcon from 'src/icons/InfoIcon'
import OpenLinkIcon from 'src/icons/OpenLinkIcon'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { Nft } from 'src/nfts/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import Logger from 'src/utils/Logger'
import networkConfig from 'src/web3/networkConfig'

const TAG = 'nfts/NftsInfoCarousel'
const DEFAULT_IMAGE_HEIGHT = 360

function scaleImageHeight(originalWidth: number, originalHeight: number, targetWidth: number) {
  const aspectRatio = originalWidth / originalHeight
  return targetWidth / aspectRatio
}

function NftsLoadErrorScreen() {
  const { t } = useTranslation()
  return (
    <SafeAreaView
      testID="NftsInfoCarousel/NftsLoadErrorScreen"
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
    >
      <Text>{t('nftInfoCarousel.noNftsFound')}</Text>
    </SafeAreaView>
  )
}

interface ImagePlaceHolderProps {
  height: number
  width?: number
  testID?: string
}

function ImagePlaceholder({ height = 40, width, testID }: ImagePlaceHolderProps) {
  return (
    <SkeletonPlaceholder
      borderRadius={8}
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

interface NftThumbnailProps {
  nft: Nft
  isActive: boolean
  onPress: () => void
}

function NftThumbnail({ nft, isActive, onPress }: NftThumbnailProps) {
  const [loading, setLoading] = useState(true)
  return (
    <Touchable
      style={[
        isActive ? styles.nftThumbnailSelected : styles.nftThumbnailUnselected,
        !nft.metadata && styles.errorThumbnail,
      ]}
      borderless={false}
      onPress={onPress}
      testID={`NftsInfoCarousel/NftThumbnail/${nft.contractAddress}-${nft.tokenId}`}
    >
      {!nft.metadata ? (
        <InfoIcon
          size={isActive ? 24 : 20}
          color={colors.warning}
          testID="NftsInfoCarousel/ErrorIcon"
        />
      ) : (
        <FastImage
          style={[
            styles.nftThumbnailShared,
            isActive ? styles.nftThumbnailSelected : styles.nftThumbnailUnselected,
          ]}
          source={{
            uri: nft.media.find((media) => media.raw === nft.metadata?.image)?.gateway,
          }}
          onError={() => {
            Logger.error(
              TAG,
              `Error loading Nft thumbnail image for Nft contractAddress: ${nft.contractAddress} tokenId: ${nft.tokenId}`
            )
          }}
          onLoadEnd={() => {
            setLoading(false)
          }}
          resizeMode={FastImage.resizeMode.cover}
        >
          {loading && <ImagePlaceholder height={40} width={40} />}
        </FastImage>
      )}
    </Touchable>
  )
}

interface NftImageCarouselProps {
  nfts: Nft[]
  handleOnPress: (nft: Nft) => void
  activeNft: Nft
}

function NftImageCarousel({ nfts, handleOnPress, activeNft }: NftImageCarouselProps) {
  return (
    <View style={styles.nftImageCarouselContainer}>
      <ScrollView
        showsHorizontalScrollIndicator={false}
        horizontal={true}
        contentContainerStyle={styles.carouselScrollViewContentContainer}
        style={styles.nftImageCarousel}
        testID="NftsInfoCarousel/NftImageCarousel"
      >
        {nfts.map((nft) => {
          return (
            <View
              key={`${nft.contractAddress}-${nft.tokenId}`}
              style={styles.nftThumbnailSharedContainer}
            >
              <NftThumbnail
                onPress={() => handleOnPress(nft)}
                // Use contractAddress and tokenId for a unique key
                isActive={
                  `${activeNft.contractAddress}-${activeNft.tokenId}` ===
                  `${nft.contractAddress}-${nft.tokenId}`
                }
                nft={nft}
              />
            </View>
          )
        })}
      </ScrollView>
    </View>
  )
}

type Props = NativeStackScreenProps<StackParamList, Screens.NftsInfoCarousel>

export default function NftsInfoCarousel({ route }: Props) {
  const { nfts } = route.params
  const [activeNft, setActiveNft] = useState(nfts[0] ?? null)
  const [isLoading, setIsLoading] = useState(true)
  const [scaledHeight, setScaledHeight] = useState(DEFAULT_IMAGE_HEIGHT)
  const { t } = useTranslation()

  function pressExplorerLink() {
    navigate(Screens.WebViewScreen, {
      uri: `${networkConfig.celoExplorerBaseTokenUrl}${activeNft.contractAddress}/instance/${activeNft.tokenId}/metadata`,
    })
  }

  function handleThumbnailPress(nft: Nft) {
    setActiveNft(nft)
  }

  // Display error screen no Nfts provided
  if (nfts.length === 0) {
    return <NftsLoadErrorScreen />
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeAreaView} testID="NftsInfoCarousel">
      <ScrollView>
        {/* Main Nft Image */}
        {activeNft.metadata ? (
          <FastImage
            testID="NftsInfoCarousel/MainImage"
            style={[
              styles.mainImage,
              { height: scaledHeight },
              // Put a border radius on the image when loading to match placeholder
              isLoading && styles.borderRadius,
            ]}
            source={{
              uri: activeNft.media.find((media) => media.raw === activeNft.metadata?.image)
                ?.gateway,
            }}
            onLoad={(e) => {
              setScaledHeight(
                scaleImageHeight(e.nativeEvent.width, e.nativeEvent.height, variables.width)
              )
            }}
            onLoadEnd={() => setIsLoading(false)}
            onError={() =>
              Logger.error(
                TAG,
                `Error loading Nft image for Nft contractAddress: ${activeNft.contractAddress} tokenId: ${activeNft.tokenId}`
              )
            }
            resizeMode={FastImage.resizeMode.contain}
          >
            {isLoading && <ImagePlaceholder height={scaledHeight} />}
          </FastImage>
        ) : (
          <View style={styles.nftImageLoadingErrorContainer}>
            <Text style={{ color: colors.light }}>{t('nftInfoCarousel.nftImageLoadError')}</Text>
          </View>
        )}
        {/* Display a carousel selection if multiple images */}
        {nfts.length > 1 && (
          <NftImageCarousel
            nfts={nfts}
            activeNft={activeNft}
            handleOnPress={handleThumbnailPress}
          />
        )}
        {/* Nft Details */}
        {activeNft.metadata && (
          <>
            {activeNft.metadata?.name && (
              <View style={styles.sectionContainer}>
                <Text style={styles.title}>{activeNft.metadata?.name}</Text>
              </View>
            )}
            {activeNft.metadata?.description && (
              <View style={styles.sectionContainer}>
                <Text style={styles.subSectionTitle}>{t('nftInfoCarousel.description')}</Text>
                <Text style={styles.text}>{activeNft.metadata?.description}</Text>
              </View>
            )}
            {activeNft.metadata?.attributes && (
              <View style={styles.sectionContainer}>
                <Text style={styles.subSectionTitle}>{t('nftInfoCarousel.attributes')}</Text>
                {activeNft.metadata?.attributes.map((attribute, index) => (
                  <View key={index} style={styles.attributesContainer}>
                    <Text style={styles.attributeTitle}>{attribute.trait_type}</Text>
                    <Text style={styles.attributeText}>{attribute.value}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
        {/* Nft Explorer Link - show if we have a contract address and token id */}
        {activeNft.tokenId && activeNft.contractAddress && (
          <View style={[styles.sectionContainer, styles.sectionContainerLast]}>
            <Touchable onPress={pressExplorerLink} testID="ViewOnExplorer">
              <View style={styles.explorerLinkContainer}>
                <Text style={styles.explorerLink}>{t('nftInfoCarousel.viewOnCeloExplorer')}</Text>
                <OpenLinkIcon color={colors.onboardingGreen} />
              </View>
            </Touchable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  attributeText: {
    ...fontStyles.regular,
    color: colors.dark,
  },
  attributeTitle: {
    ...fontStyles.small500,
    color: colors.gray3,
  },
  attributesContainer: {
    paddingBottom: Spacing.Thick24,
  },
  borderRadius: {
    borderRadius: Spacing.Smallest8,
  },
  carouselScrollViewContentContainer: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    marginLeft: Spacing.Regular16,
  },
  errorThumbnail: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray2,
  },
  explorerLink: {
    ...fontStyles.small500,
    color: colors.onboardingGreen,
    paddingRight: Spacing.Smallest8,
  },
  explorerLinkContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  nftImageCarousel: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.Regular16,
    paddingTop: Spacing.Smallest8,
  },
  nftImageCarouselContainer: {
    flex: 1,
  },
  nftImageLoadingErrorContainer: {
    width: '100%',
    height: DEFAULT_IMAGE_HEIGHT,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nftThumbnailSelected: {
    height: 40,
    width: 40,
  },
  nftThumbnailShared: {
    borderRadius: Spacing.Smallest8,
  },
  nftThumbnailSharedContainer: {
    borderRadius: Spacing.Smallest8,
    marginRight: Spacing.Smallest8,
    overflow: 'hidden',
  },
  nftThumbnailUnselected: {
    height: 32,
    opacity: 0.5,
    width: 32,
  },
  mainImage: {
    width: variables.width,
  },
  safeAreaView: {
    flex: 1,
  },
  sectionContainer: {
    marginHorizontal: Spacing.Thick24,
    marginTop: Spacing.Regular16,
  },
  sectionContainerLast: {
    marginBottom: Spacing.Large32,
  },
  skeletonImageThumbnailPlaceHolder: {
    height: 40,
    width: 40,
    zIndex: -1,
  },
  subSectionTitle: {
    ...fontStyles.large600,
    marginBottom: Spacing.Regular16,
  },
  text: {
    ...fontStyles.regular,
  },
  title: {
    ...fontStyles.h1,
  },
})

import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { SafeAreaView } from 'react-native-safe-area-context'
import SkeletonPlaceholder from 'src/components/SkeletonPlaceholder'
import Touchable from 'src/components/Touchable'
import InfoIcon from 'src/icons/InfoIcon'
import InfoShadowedIcon from 'src/icons/InfoShadowedIcon'
import OpenLinkIcon from 'src/icons/OpenLinkIcon'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import NftsLoadErrorScreen from 'src/nfts/NftsLoadErrorScreen'
import { Nft } from 'src/nfts/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import Logger from 'src/utils/Logger'
import networkConfig from 'src/web3/networkConfig'

const TAG = 'nfts/NftsInfoCarousel'

type Props = NativeStackScreenProps<StackParamList, Screens.NftsInfoCarousel>

function scaleImageHeight(originalWidth: number, originalHeight: number, targetWidth: number) {
  const aspectRatio = originalWidth / originalHeight
  return targetWidth / aspectRatio
}

const ThumbnailImagePlaceholder = () => {
  return (
    <SkeletonPlaceholder backgroundColor={colors.gray2} highlightColor={colors.white}>
      <View style={styles.skeletonImageThumbnailPlaceHolder} />
    </SkeletonPlaceholder>
  )
}

const NftThumbnail = ({
  nft,
  isActive,
  onPress,
  error,
}: {
  nft: Nft
  isActive: boolean
  onPress: () => void
  error?: boolean
}) => {
  const [loading, setLoading] = useState(true)
  const [imageLoadingError, setImageLoadingError] = useState(false)
  return (
    <Touchable
      style={[
        isActive ? styles.nftThumbnailSelected : styles.nftThumbnailUnSelected,
        (error || imageLoadingError) && styles.errorThumbnail,
      ]}
      borderless={false}
      onPress={onPress}
      testID={`NftsInfoCarousel/NftThumbnail/${nft.contractAddress}-${nft.tokenId}`}
    >
      {error || imageLoadingError ? (
        <InfoIcon
          size={isActive ? 24 : 20}
          color={colors.dark}
          testID="NftsInfoCarousel/ErrorIcon"
        />
      ) : (
        <FastImage
          style={[
            styles.nftThumbnailShared,
            isActive ? styles.nftThumbnailSelected : styles.nftThumbnailUnSelected,
          ]}
          source={{
            uri: nft.media.find((media) => media.raw === nft.metadata?.image)?.gateway,
          }}
          onError={() => {
            setImageLoadingError(true)
            Logger.error(
              TAG,
              `Error loading Nft thumbnail image for Nft contractAddress: ${nft.contractAddress} tokenId: ${nft.tokenId}`
            )
          }}
          resizeMode={FastImage.resizeMode.cover}
          onLoadEnd={() => {
            setLoading(false)
          }}
        >
          {loading && <ThumbnailImagePlaceholder />}
        </FastImage>
      )}
    </Touchable>
  )
}

export default function NftsInfoCarousel({ route }: Props) {
  const { nfts } = route.params
  const [activeNft, setActiveNft] = useState(nfts[0] ?? null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [scaledHeight, setScaledHeight] = useState(360)
  const { t } = useTranslation()

  function pressExplorerLink() {
    navigate(Screens.WebViewScreen, {
      uri: `${networkConfig.celoExplorerBaseTokenUrl}${activeNft.contractAddress}/instance/${activeNft.tokenId}/metadata`,
    })
  }

  function onImageLoadError() {
    setError(true)
    Logger.error(
      TAG,
      `Error loading Nft image for Nft contractAddress: ${activeNft.contractAddress} tokenId: ${activeNft.tokenId}`
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
    const handleOnPress = (nft: Nft) => () => {
      setActiveNft(nft)
    }
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
                  onPress={handleOnPress(nft)}
                  // Use contractAddress and tokenId for a unique key
                  isActive={
                    `${activeNft.contractAddress}-${activeNft.tokenId}` ===
                    `${nft.contractAddress}-${nft.tokenId}`
                  }
                  // If there's no nft metadata, show a red info icon instead
                  error={!nft.metadata}
                  nft={nft}
                />
              </View>
            )
          })}
        </ScrollView>
      </View>
    )
  }

  // Catch All Error Screen
  if (nfts.length === 0) {
    return <NftsLoadErrorScreen />
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeAreaView} testID="NftsInfoCarousel">
      <ScrollView>
        {activeNft.metadata && !error && (
          <FastImage
            testID={`NftsInfoCarousel/NftImage-${activeNft.contractAddress}-${activeNft.tokenId}`}
            style={[
              { height: scaledHeight },
              styles.mainImage,
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
            onError={onImageLoadError}
            resizeMode={FastImage.resizeMode.contain}
          >
            {isLoading && <MainImagePlaceholder />}
          </FastImage>
        )}
        {/* This could happen if the indexer is experiencing issues with particular nfts */}
        {(!activeNft.metadata || error) && (
          <View style={styles.nftImageLoadingErrorContainer}>
            <InfoShadowedIcon />
            <Text style={styles.errorImageText}>{t('nftInfoCarousel.nftImageLoadError')}</Text>
          </View>
        )}

        {nfts.length > 1 && <NftImageCarousel />}
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
        {/* This should be dynamic based on Network in the future. Always show as fallback */}
        <View style={[styles.sectionContainer, styles.sectionContainerLast]}>
          <Touchable onPress={pressExplorerLink} testID="ViewOnExplorer">
            <View style={styles.explorerLinkContainer}>
              <Text style={styles.explorerLink}>{t('nftInfoCarousel.viewOnCeloExplorer')}</Text>
              <OpenLinkIcon color={colors.onboardingGreen} />
            </View>
          </Touchable>
        </View>
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
  errorImageText: {
    marginTop: Spacing.Regular16,
    ...fontStyles.regular,
    color: colors.gray3,
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
    height: 360,
    backgroundColor: colors.gray1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  nftThumbnailSelected: {
    height: 40,
    width: 40,
  },
  nftThumbnailShared: {
    borderRadius: 8,
  },
  nftThumbnailSharedContainer: {
    borderRadius: 8,
    marginRight: 8,
    overflow: 'hidden',
  },
  nftThumbnailUnSelected: {
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

import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Touchable from 'src/components/Touchable'
import ImageErrorIcon from 'src/icons/ImageErrorIcon'
import OpenLinkIcon from 'src/icons/OpenLinkIcon'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import NftImage from 'src/nfts/NftImage'
import NftsLoadError from 'src/nfts/NftsLoadError'
import { Nft, NftOrigin } from 'src/nfts/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import networkConfig from 'src/web3/networkConfig'

const DEFAULT_IMAGE_HEIGHT = 360

interface NftThumbnailProps {
  nft: Nft
  isActive: boolean
  onPress: () => void
}

function NftThumbnail({ nft, isActive, onPress }: NftThumbnailProps) {
  return (
    <Touchable
      style={[
        isActive ? styles.nftThumbnailSelected : styles.nftThumbnailUnselected,
        !nft.metadata && styles.errorThumbnail,
      ]}
      hitSlop={variables.iconHitslop}
      borderless={false}
      onPress={onPress}
      testID={`NftsInfoCarousel/NftThumbnail/${nft.contractAddress}-${nft.tokenId}`}
    >
      <NftImage
        nft={nft}
        ErrorComponent={
          <View style={styles.nftImageLoadingErrorContainer}>
            <ImageErrorIcon
              // The thumbnails are 20% larger when selected vs unselected
              size={isActive ? 24 : 20}
              testID="NftsInfoCarousel/ImageErrorIcon"
            />
          </View>
        }
        height={40}
        borderRadius={8}
        testID="NftsInfoCarousel/ThumbnailImage"
        origin={NftOrigin.NftsInfoCarouselThumbnail}
      />
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
              // Use contractAddress and tokenId for a unique key
              key={`${nft.contractAddress}-${nft.tokenId}`}
              style={styles.nftThumbnailSharedContainer}
            >
              <NftThumbnail
                onPress={() => handleOnPress(nft)}
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
  const { t } = useTranslation()

  function pressExplorerLink() {
    navigate(Screens.WebViewScreen, {
      uri: `${networkConfig.celoExplorerBaseTokenUrl}${activeNft.contractAddress}/instance/${activeNft.tokenId}/metadata`,
    })
  }

  function handleThumbnailPress(nft: Nft) {
    setActiveNft(nft)
  }

  // Full page error screen shown when ntfs === []
  if (nfts.length === 0) {
    return <NftsLoadError />
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeAreaView} testID="NftsInfoCarousel">
      <ScrollView>
        {/* Main Nft Image */}
        <NftImage
          nft={activeNft}
          ErrorComponent={
            <View style={styles.nftImageLoadingErrorContainer}>
              <ImageErrorIcon color="#C93717" />
              <Text style={styles.errorImageText}>{t('nftInfoCarousel.nftImageLoadError')}</Text>
            </View>
          }
          testID="NftsInfoCarousel/MainImage"
          origin={NftOrigin.NftsInfoCarouselMain}
          shouldAutoScaleHeight
        />
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
    height: DEFAULT_IMAGE_HEIGHT,
    backgroundColor: colors.gray1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  nftThumbnailSelected: {
    height: 40,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
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

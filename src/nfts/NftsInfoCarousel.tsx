import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { SafeAreaView } from 'react-native-safe-area-context'
import SkeletonPlaceholder from 'src/components/SkeletonPlaceholder'
import Touchable from 'src/components/Touchable'
import BackChevronStatic from 'src/icons/BackChevronStatic'
import OpenLinkIcon from 'src/icons/OpenLinkIcon'
import TripleDotHorizontal from 'src/icons/TripleDotHorizontal'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import useNftShareBottomSheet from 'src/nfts/NftBottomSheet'
import { Nft } from 'src/nfts/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import Logger from 'src/utils/Logger'
import networkConfig from 'src/web3/networkConfig'

const TAG = 'nfts/NftsInfoCarousel'

type Props = NativeStackScreenProps<StackParamList, Screens.NftsInfoCarousel>

const scaleImageHeight = (originalWidth: number, originalHeight: number, targetWidth: number) => {
  const aspectRatio = originalWidth / originalHeight
  return targetWidth / aspectRatio
}

const NftsLoadErrorScreen = () => {
  const { t } = useTranslation()
  return (
    <SafeAreaView
      style={{
        flex: 1,
      }}
    >
      <TopBarIconButton
        style={{ margin: Spacing.Smallest8 }}
        icon={<BackChevronStatic />}
        onPress={navigateBack}
      />
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          marginHorizontal: Spacing.Thick24,
        }}
      >
        <Text style={[styles.title, { marginBottom: Spacing.Thick24 }]}>
          {t('nftInfoCarousel.loadErrorTitle')}
        </Text>
        <Text style={[styles.subTitle, { marginBottom: Spacing.Regular16, textAlign: 'center' }]}>
          {t('nftInfoCarousel.loadErrorSubtitle')}
        </Text>
        <Touchable onPress={() => navigate(Screens.SupportContact)}>
          <Text style={[styles.text, styles.contactSupportTouchable]}>
            {t('nftInfoCarousel.contactSupport')}
          </Text>
        </Touchable>
      </View>
    </SafeAreaView>
  )
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
  setActiveNft,
  activeNft,
}: {
  nft: Nft
  setActiveNft: any
  activeNft: Nft
}) => {
  const [loading, setLoading] = useState(true)
  return (
    <Touchable borderless={false} onPress={() => setActiveNft(nft)}>
      <FastImage
        style={[
          styles.nftPreviewImageShared,
          activeNft.tokenUri === nft.tokenUri
            ? styles.nftPreviewImageSelected
            : styles.nftPreviewImageUnSelected,
        ]}
        source={{
          uri: nft.media.find((media) => media.raw === nft.metadata?.image)?.gateway,
        }}
        onError={() => {
          Logger.error(TAG, 'Error loading Nft preview image')
        }}
        resizeMode={FastImage.resizeMode.cover}
        onLoadEnd={() => {
          setLoading(false)
        }}
      >
        {loading && <ThumbnailImagePlaceholder />}
      </FastImage>
    </Touchable>
  )
}

export default function NftsInfoCarousel({ route }: Props) {
  const { nfts } = route.params
  const [activeNft, setActiveNft] = useState((nfts && nfts[0]) ?? null)
  const [isLoading, setIsLoading] = useState(true)
  const [scaledHeight, setScaledHeight] = useState(360)
  const { t } = useTranslation()

  const android_ripple = {
    color: colors.gray2,
    foreground: true,
    borderless: true,
  }

  const { openSheet, NftShareBottomSheet } = useNftShareBottomSheet({ nft: activeNft })

  const PlatformSpecificTopBarButtons = () => {
    if (Platform.OS === 'ios') {
      return (
        <View style={styles.topBarButtonsContainer}>
          <TopBarIconButton
            onPress={() => navigateBack()}
            icon={<BackChevronStatic />}
            style={[styles.button, styles.iOSButton]}
          />
          {activeNft.metadata && (
            <TopBarIconButton
              onPress={openSheet}
              icon={<TripleDotHorizontal />}
              style={[styles.button, styles.iOSButton]}
            />
          )}
        </View>
      )
    } else {
      return (
        <View style={styles.topBarButtonsContainer}>
          <View>
            <Pressable
              android_ripple={android_ripple}
              onPress={() => navigateBack()}
              style={styles.button}
            >
              <BackChevronStatic />
            </Pressable>
          </View>
          {activeNft.metadata && (
            <View>
              <Pressable
                android_ripple={android_ripple}
                // onPress={handleShareAction}
                onPress={openSheet}
                style={styles.button}
              >
                <TripleDotHorizontal />
              </Pressable>
            </View>
          )}
        </View>
      )
    }
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
      <View style={styles.nftImageCarouselContainer}>
        <ScrollView
          showsHorizontalScrollIndicator={false}
          horizontal={true}
          contentContainerStyle={styles.carouselScrollViewContentContainer}
          style={styles.nftImageCarousel}
        >
          {/* Only display Nfts with metadata */}
          {nfts
            .filter((nft) => nft.metadata)
            .map((nft) => {
              return (
                <View
                  key={`${nft.contractAddress}-${nft.tokenId}`}
                  style={styles.nftPreviewImageSharedContainer}
                >
                  <NftThumbnail nft={nft} setActiveNft={setActiveNft} activeNft={activeNft} />
                </View>
              )
            })}
        </ScrollView>
      </View>
    )
  }

  // Display error screen no Nfts provided
  if (nfts.length === 0) {
    return <NftsLoadErrorScreen />
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <PlatformSpecificTopBarButtons />
      <ScrollView>
        {activeNft.metadata && (
          <FastImage
            style={[
              {
                height: scaledHeight,
                width: variables.width,
              },
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
            onError={() => {
              Logger.error(TAG, 'Error loading Nft image')
            }}
            resizeMode={FastImage.resizeMode.contain}
          >
            {isLoading && <MainImagePlaceholder />}
          </FastImage>
        )}
        {/* This could happen if the indexer is experiencing issues with particular nfts */}
        {!activeNft.metadata && (
          <View style={styles.nftImageLoadingErrorContainer}>
            <Text style={{ color: colors.light }}>{t('nftInfoCarousel.nftImageLoadError')}</Text>
          </View>
        )}

        {nfts.length > 1 && <NftImageCarousel />}
        <View style={styles.sectionContainer}>
          <Text style={styles.title}>{activeNft.metadata?.name}</Text>
        </View>
        {activeNft.metadata && (
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
        <View style={styles.sectionContainer}>
          <Touchable
            onPress={() =>
              Linking.openURL(
                `${networkConfig.celoExplorerBaseTokenUrl}${activeNft.contractAddress}/instance/${activeNft.tokenId}/metadata`
              )
            }
          >
            <View style={styles.explorerLinkContainer}>
              <Text style={styles.explorerLink}>{t('nftInfoCarousel.viewOnCeloExplorer')}</Text>
              <OpenLinkIcon color={colors.onboardingGreen} />
            </View>
          </Touchable>
        </View>
      </ScrollView>
      {NftShareBottomSheet}
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
  button: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.dark,
    borderRadius: 100,
    elevation: 4,
    height: 32,
    justifyContent: 'center',
    shadowColor: colors.dark,
    shadowOffset: {
      height: 2,
      width: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    width: 32,
  },
  carouselScrollViewContentContainer: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    marginLeft: Spacing.Regular16,
  },
  contactSupportTouchable: {
    alignItems: 'center',
    ...fontStyles.large600,
    color: colors.onboardingGreen,
    textDecorationLine: 'underline',
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
  iOSButton: {
    marginTop: Spacing.Thick24,
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
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nftPreviewImageSelected: {
    height: 40,
    width: 40,
  },
  nftPreviewImageShared: {
    borderRadius: 8,
  },
  nftPreviewImageSharedContainer: {
    borderRadius: 8,
    marginRight: 8,
    overflow: 'hidden',
  },
  nftPreviewImageUnSelected: {
    height: 32,
    opacity: 0.5,
    width: 32,
  },
  sectionContainer: {
    marginHorizontal: Spacing.Thick24,
    marginTop: Spacing.Regular16,
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
  subTitle: {
    ...fontStyles.large,
  },
  text: {
    ...fontStyles.regular,
  },
  title: {
    ...fontStyles.h1,
  },
  topBarButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 0,
    marginTop: Spacing.Regular16,
    padding: Spacing.Regular16,
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 1,
  },
})

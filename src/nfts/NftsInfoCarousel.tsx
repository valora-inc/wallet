import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect } from 'react'
import { Image, ImageBackground, Linking, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Touchable from 'src/components/Touchable'
import BackChevronStatic from 'src/icons/BackChevronStatic'
import OpenLinkIcon from 'src/icons/OpenLinkIcon'
import TripleDotHorizontal from 'src/icons/TripleDotHorizontal'
import { navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { handleNftUrl } from 'src/nfts/utils'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

type Props = NativeStackScreenProps<StackParamList, Screens.NftInfoCarousel>

export default function NftsInfoCarousel({ route }: Props) {
  const { nfts } = route.params
  const [activeNft, setActiveNft] = React.useState(nfts[0])
  const [shareBottomSheetVisible, setShareBottomSheetVisible] = React.useState(false)

  useEffect(() => {
    console.log('shareBottomSheetVisible', shareBottomSheetVisible)
  }, [shareBottomSheetVisible])

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
          {nfts.map((nft, index) => {
            return (
              <Touchable key={index} onPress={() => setActiveNft(nft)}>
                <Image
                  style={[
                    styles.NftPreviewImageShared,
                    activeNft.tokenId === nft.tokenId
                      ? styles.NftPreviewImageSelected
                      : styles.NftPreviewImageUnSelected,
                  ]}
                  source={{ uri: handleNftUrl(nft.metadata?.image) }}
                />
              </Touchable>
            )
          })}
        </ScrollView>
      </View>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView>
        <ImageBackground
          style={{ height: 360 }}
          source={{ uri: handleNftUrl(activeNft.metadata?.image) }}
        >
          <View style={styles.topBarIconContainer}>
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
        </ImageBackground>
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
                `https://explorer.celo.org/mainnet/token/${activeNft.contractAddress}/instance/${activeNft.tokenId}/metadata`
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
  button: {
    backgroundColor: colors.white,
    borderRadius: 100,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarIconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.Regular16,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
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

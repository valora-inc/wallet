import React from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import Touchable from 'src/components/Touchable'
import ImageErrorIcon from 'src/icons/ImageErrorIcon'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import NftImage from 'src/nfts/NftImage'
import NftsLoadError from 'src/nfts/NftsLoadError'
import { myNftsErrorSelector, myNftsLoadingSelector, myNftsSelector } from 'src/nfts/selectors'
import { fetchMyNfts } from 'src/nfts/slice'
import { Nft, NftOrigin } from 'src/nfts/types'
import colors from 'src/styles/colors'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'

// This is used instead of a gap between the images because the gap is not supported in RN yet.
const imageSize = Math.min(variables.width / 2.5, variables.height / 4)

function NftTouchable({ nft }: { nft: Nft }) {
  return (
    <Touchable
      key={`${nft.contractAddress}-${nft.tokenId}`}
      onPress={() => navigate(Screens.NftsInfoCarousel, { nfts: [nft] })}
      style={styles.touchableIcon}
    >
      <NftImage
        nft={nft}
        testID="NftGallery/NftImage"
        width={imageSize}
        height={imageSize}
        ErrorComponent={
          <View style={styles.errorView}>
            <ImageErrorIcon color="#C93717" />
          </View>
        }
        origin={NftOrigin.NftGallery}
        borderRadius={Spacing.Smallest8}
      />
    </Touchable>
  )
}

export default function NftGallery() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const loading = useSelector(myNftsLoadingSelector)
  const error = useSelector(myNftsErrorSelector)
  const nfts = useSelector(myNftsSelector)

  function onRefresh() {
    dispatch(fetchMyNfts())
  }

  if (error) {
    return (
      <SafeAreaView testID="NftGallery" style={styles.safeAreaContainer} edges={['top']}>
        <DrawerTopBar middleElement={<Text>{t('nftGallery.title')}</Text>} />
        <NftsLoadError />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView testID="NftGallery" style={styles.safeAreaContainer} edges={['top']}>
      <DrawerTopBar middleElement={<Text>{t('nftGallery.title')}</Text>} />
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            tintColor={colors.greenBrand}
            colors={[colors.greenBrand]}
            style={{ backgroundColor: colors.light }}
          />
        }
      >
        {!loading && !error && (
          <View style={styles.galleryContainer}>
            {nfts.map((nft) => (
              <NftTouchable key={`${nft.contractAddress}-${nft.tokenId}`} nft={nft} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorView: {
    width: imageSize,
    height: imageSize,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray2,
    borderRadius: Spacing.Regular16,
  },
  galleryContainer: {
    alignContent: 'space-around',
    justifyContent: 'space-evenly',
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: Spacing.Regular16,
  },
  iconMargin: {
    marginTop: '32%',
  },
  scrollContainer: {
    flex: 1,
  },
  safeAreaContainer: {
    flexGrow: 1,
  },
  touchableIcon: {
    marginBottom: Spacing.Thick24,
    borderRadius: Spacing.Regular16,
  },
})

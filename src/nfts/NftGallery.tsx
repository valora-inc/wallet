import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { NftEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Touchable from 'src/components/Touchable'
import ImageErrorIcon from 'src/icons/ImageErrorIcon'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import NftImage from 'src/nfts/NftImage'
import NftsLoadError from 'src/nfts/NftsLoadError'
import { nftsErrorSelector, nftsLoadingSelector, nftsSelector } from 'src/nfts/selectors'
import { fetchNfts } from 'src/nfts/slice'
import { NftOrigin } from 'src/nfts/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'

// This is used instead of a gap between the images because the gap is not supported in RN yet.
const imageSize = (variables.width - Spacing.Regular16 * 3) / 2

export default function NftGallery() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const loading = useSelector(nftsLoadingSelector)
  const error = useSelector(nftsErrorSelector)
  const nfts = useSelector(nftsSelector)

  useEffect(() => {
    ValoraAnalytics.track(NftEvents.nft_gallery_screen_open, { numNfts: nfts.length })
    dispatch(fetchNfts())
  }, [])

  return (
    <SafeAreaView testID="NftGallery" style={styles.safeAreaContainer} edges={['top']}>
      <DrawerTopBar middleElement={<Text>{t('nftGallery.title')}</Text>} />
      {error ? (
        <NftsLoadError testID="NftGallery/NftsLoadErrorScreen" />
      ) : (
        <FlatList
          numColumns={2}
          data={nfts}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              tintColor={colors.greenBrand}
              colors={[colors.greenBrand]}
              style={{ backgroundColor: colors.light }}
              refreshing={loading}
              onRefresh={() => dispatch(fetchNfts())}
            />
          }
          renderItem={({ item, index }) => (
            <Touchable
              borderless={false}
              onPress={() => navigate(Screens.NftsInfoCarousel, { nfts: [item] })}
              style={[
                styles.touchableIcon,
                // For even indexes, add right margin; for odd indexes, add left margin.
                // If the index is even and it's the last image, add a right margin to left-align the image in the last row.
                index % 2 === 0
                  ? { marginRight: Spacing.Regular16 } &&
                    index === nfts.length - 1 &&
                    styles.lastImage
                  : { marginLeft: Spacing.Regular16 },
              ]}
            >
              <NftImage
                nft={item}
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
          )}
          keyExtractor={(item) => `${item.contractAddress}-${item.tokenId}`}
          ListEmptyComponent={
            loading ? null : (
              <View style={styles.noNftsView}>
                <Text style={styles.noNftsText}>{t('nftGallery.noNfts')}</Text>
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    alignItems: 'center',
    paddingBottom: '12%',
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
  lastImage: {
    marginRight: variables.width / 2 - Spacing.Smallest8,
  },
  noNftsView: {
    padding: Spacing.Regular16,
    marginTop: '32%',
  },
  noNftsText: {
    ...fontStyles.regular,
    color: colors.gray3,
    textAlign: 'center',
  },
  safeAreaContainer: {
    flexGrow: 1,
  },
  touchableIcon: {
    marginBottom: Spacing.Regular16,
    borderRadius: Spacing.Regular16,
  },
})

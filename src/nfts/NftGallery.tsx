import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { NftEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Touchable from 'src/components/Touchable'
import ImageErrorIcon from 'src/icons/ImageErrorIcon'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { styles as headerStyles } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import NftMedia from 'src/nfts/NftMedia'
import NftsLoadError from 'src/nfts/NftsLoadError'
import {
  nftsErrorSelector,
  nftsLoadingSelector,
  nftsWithMetadataSelector,
} from 'src/nfts/selectors'
import { fetchNfts } from 'src/nfts/slice'
import { NftOrigin } from 'src/nfts/types'
import { useDispatch, useSelector } from 'src/redux/hooks'
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
  const nfts = useSelector(nftsWithMetadataSelector)
  const insets = useSafeAreaInsets()

  useEffect(() => {
    ValoraAnalytics.track(NftEvents.nft_gallery_screen_open, { numNfts: nfts.length })
    dispatch(fetchNfts())
  }, [])

  return (
    <SafeAreaView testID="NftGallery" style={styles.container} edges={['top']}>
      <DrawerTopBar
        middleElement={<Text style={headerStyles.headerTitle}>{t('nftGallery.title')}</Text>}
      />
      {error ? (
        <NftsLoadError testID="NftGallery/NftsLoadErrorScreen" />
      ) : (
        <FlatList
          numColumns={2}
          ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          data={nfts}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom }]}
          // Workaround iOS setting an incorrect automatic inset at the top
          scrollIndicatorInsets={{ top: 0.01 }}
          refreshControl={
            <RefreshControl
              tintColor={colors.primary}
              colors={[colors.primary]}
              style={{ backgroundColor: colors.white }}
              refreshing={loading}
              onRefresh={() => dispatch(fetchNfts())}
            />
          }
          renderItem={({ item, index }) => (
            <View
              style={[
                styles.touchableContainer,
                // For even indexes, add right margin; for odd indexes, add left margin.
                // If the index is even and it's the last image, add a right margin to left-align the image in the last row.
                index % 2 === 0
                  ? { marginRight: Spacing.Regular16 } &&
                    index === nfts.length - 1 &&
                    styles.lastImage
                  : { marginLeft: Spacing.Regular16 },
              ]}
            >
              <Touchable
                borderless={false}
                onPress={() =>
                  navigate(Screens.NftsInfoCarousel, { nfts: [item], networkId: item.networkId })
                }
                style={styles.touchableIcon}
              >
                <NftMedia
                  nft={item}
                  testID="NftGallery/NftImage"
                  width={imageSize}
                  height={imageSize}
                  ErrorComponent={
                    <View style={styles.errorView}>
                      <ImageErrorIcon />
                      {item.metadata?.name && (
                        <Text numberOfLines={2} style={styles.noNftMetadataText}>
                          {item.metadata.name}
                        </Text>
                      )}
                    </View>
                  }
                  origin={NftOrigin.NftGallery}
                  borderRadius={Spacing.Regular16}
                  mediaType="image"
                />
              </Touchable>
            </View>
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
  container: {
    flex: 1,
  },
  contentContainer: {
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
  itemSeparator: {
    height: Spacing.Regular16,
  },
  lastImage: {
    marginRight: variables.width / 2 - Spacing.Smallest8,
  },
  noNftMetadataText: {
    ...fontStyles.small,
    textAlign: 'center',
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
  touchableContainer: {
    overflow: 'hidden',
    borderRadius: Spacing.Regular16,
  },
  touchableIcon: {
    borderRadius: Spacing.Regular16,
  },
})

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import SkeletonPlaceholder from 'src/components/SkeletonPlaceholder'
import Touchable from 'src/components/Touchable'
import ImageErrorIcon from 'src/icons/ImageErrorIcon'
import NftReceivedIcon from 'src/icons/NftReceivedIcon'
import NftSentIcon from 'src/icons/NftSentIcon'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { Nft, NftOrigin } from 'src/nfts/types'
import { getGatewayUrl, onImageLoad } from 'src/nfts/utils'
import useSelector from 'src/redux/useSelector'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { NftTransfer, TokenTransactionTypeV2 } from 'src/transactions/types'
import networkConfig from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'

function NftIconPlaceholder({ testID = 'NftIconPlaceHolder' }: { testID?: string }) {
  return (
    <SkeletonPlaceholder
      testID={testID}
      borderRadius={20} // Needs border radius to show on Android
      backgroundColor={colors.gray2}
      highlightColor={colors.white}
    >
      <View style={styles.circleIcon} />
    </SkeletonPlaceholder>
  )
}

function NftIcon({ nft }: { nft: Nft }) {
  const [loading, setLoading] = useState(true)
  const [imageLoadingError, setImageLoadingError] = useState(false)

  function handleLoadError() {
    onImageLoad(nft, NftOrigin.TransactionFeed, true)
    setImageLoadingError(true)
  }

  function handleLoadSuccess() {
    onImageLoad(nft, NftOrigin.TransactionFeed, false)
    setLoading(false)
  }

  return imageLoadingError ? (
    <View style={[styles.circleIcon, styles.errorCircleIcon]}>
      <ImageErrorIcon size={30} testID="NftFeedItem/NftErrorIcon" />
    </View>
  ) : (
    <FastImage
      source={{
        uri: getGatewayUrl(nft),
      }}
      style={styles.circleIcon}
      onLoadEnd={handleLoadSuccess}
      onError={handleLoadError}
      testID="NftFeedItem/NftIcon"
    >
      {loading && <NftIconPlaceholder />}
    </FastImage>
  )
}
interface Props {
  transaction: NftTransfer
}

function NftFeedItem({ transaction }: Props) {
  const { t } = useTranslation()
  const walletAddress = useSelector(walletAddressSelector)
  const nfts = transaction.nfts ?? ([] as Nft[])
  const showNftsInApp = getFeatureGate(StatsigFeatureGates.SHOW_IN_APP_NFT_VIEWER)

  const openNftTransactionDetails = () => {
    showNftsInApp
      ? navigate(Screens.NftsInfoCarousel, { nfts })
      : navigate(Screens.WebViewScreen, {
          uri: `${networkConfig.nftsValoraAppUrl}?address=${walletAddress}&hide-header=true`,
        })
    ValoraAnalytics.track(HomeEvents.transaction_feed_item_select)
  }

  return (
    <Touchable testID={'NftFeedItem'} disabled={false} onPress={openNftTransactionDetails}>
      <View style={styles.container}>
        {/* If enabled try to show the first image. Otherwise display the default icons */}
        {showNftsInApp && nfts.length > 0 && nfts[0].metadata?.image ? (
          <NftIcon nft={nfts[0]} />
        ) : transaction.type === TokenTransactionTypeV2.NftReceived ? (
          <NftReceivedIcon />
        ) : (
              <NftSentIcon />
            )}
        <View style={styles.descriptionContainer}>
          <Text style={styles.title}>
            {transaction.type === TokenTransactionTypeV2.NftReceived
              ? t('receivedNfts', { count: nfts.length ?? 0 })
              : t('sentNfts', { count: nfts.length ?? 0 })}
          </Text>
        </View>
      </View>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  circleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  container: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: variables.contentPadding,
  },
  descriptionContainer: {
    marginLeft: variables.contentPadding,
    width: '55%',
    justifyContent: 'center',
  },
  errorCircleIcon: {
    backgroundColor: colors.gray2,
    padding: 5,
  },
  title: {
    ...fontStyles.regular500,
  },
})

export default NftFeedItem

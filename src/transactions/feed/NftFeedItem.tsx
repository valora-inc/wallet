import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import IconWithNetworkBadge from 'src/components/IconWithNetworkBadge'
import Touchable from 'src/components/Touchable'
import ImageErrorIcon from 'src/icons/ImageErrorIcon'
import NftReceivedIcon from 'src/icons/NftReceivedIcon'
import NftSentIcon from 'src/icons/NftSentIcon'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import NftMedia from 'src/nfts/NftMedia'
import { Nft, NftOrigin } from 'src/nfts/types'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { NftTransfer, TokenTransactionTypeV2 } from 'src/transactions/types'

interface Props {
  transaction: NftTransfer
}

function NftFeedItem({ transaction }: Props) {
  const { t } = useTranslation()
  const nfts = transaction.nfts ?? ([] as Nft[])

  const openNftTransactionDetails = () => {
    navigate(Screens.NftsInfoCarousel, { nfts, networkId: transaction.networkId })
    ValoraAnalytics.track(HomeEvents.transaction_feed_item_select)
  }

  return (
    <Touchable testID={'NftFeedItem'} disabled={false} onPress={openNftTransactionDetails}>
      <View style={styles.container}>
        {/* Try to show the first image. Otherwise display the default icons */}
        <IconWithNetworkBadge networkId={transaction.networkId}>
          {nfts.length > 0 && nfts[0].metadata?.image ? (
            <NftMedia
              nft={nfts[0]}
              ErrorComponent={
                <View style={styles.errorCircleIcon}>
                  <ImageErrorIcon size={30} testID="NftFeedItem/NftErrorIcon" />
                </View>
              }
              borderRadius={20}
              width={40}
              height={40}
              testID="NftFeedItem/NftIcon"
              origin={NftOrigin.TransactionFeed}
              mediaType="image"
            />
          ) : transaction.type === TokenTransactionTypeV2.NftReceived ? (
            <NftReceivedIcon />
          ) : (
            <NftSentIcon />
          )}
        </IconWithNetworkBadge>
        <Text style={styles.title}>
          {transaction.type === TokenTransactionTypeV2.NftReceived
            ? t('receivedNft')
            : t('sentNft')}
        </Text>
      </View>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingVertical: Spacing.Small12,
    paddingHorizontal: variables.contentPadding,
  },
  errorCircleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typeScale.labelMedium,
    marginLeft: Spacing.Regular16,
  },
})

export default NftFeedItem

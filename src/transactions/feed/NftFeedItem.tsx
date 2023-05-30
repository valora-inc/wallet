import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Touchable from 'src/components/Touchable'
import NftReceivedIcon from 'src/icons/NftReceivedIcon'
import NftSentIcon from 'src/icons/NftSentIcon'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { NftTransfer, TokenTransactionTypeV2 } from 'src/transactions/types'

interface Props {
  transaction: NftTransfer
}

function NftFeedItem({ transaction }: Props) {
  const { t } = useTranslation()
  const { nfts } = transaction

  const openNftTransactionDetails = () => {
    navigate(Screens.NftsInfoCarousel, { nfts })
    ValoraAnalytics.track(HomeEvents.transaction_feed_item_select)
  }

  return (
    <Touchable testID={'NftFeedItem'} disabled={false} onPress={openNftTransactionDetails}>
      <View style={styles.container}>
        {transaction.type === TokenTransactionTypeV2.NftReceived ? (
          <NftReceivedIcon />
        ) : (
          <NftSentIcon />
        )}
        <View style={styles.descriptionContainer}>
          <Text style={styles.title}>
            {transaction.type === TokenTransactionTypeV2.NftReceived
              ? t('receivedNft')
              : t('sentNft')}
          </Text>
        </View>
      </View>
    </Touchable>
  )
}

const styles = StyleSheet.create({
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
  title: {
    ...fontStyles.regular500,
  },
})

export default NftFeedItem

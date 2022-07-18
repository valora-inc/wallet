import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import Touchable from 'src/components/Touchable'
import DepositIcon from 'src/icons/DepositIcon'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { NFTsTransaction } from 'src/transactions/types'
import networkConfig from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'

interface Props {
  transaction: NFTsTransaction
}

function NFTsTransactionItem({ transaction }: Props) {
  const { t } = useTranslation()
  const walletAddress = useSelector(walletAddressSelector)

  const openNftTransactionDetails = () => {
    navigate(Screens.WebViewScreen, {
      uri: `${networkConfig.nftsValoraAppUrl}?address=${walletAddress}&hide-header=true`,
    })
  }

  let isReceived: boolean = false

  for (let transfer of transaction.transfers) {
    if (transfer.tokenType === 'ERC-721') {
      if (transfer.toAddressHash === walletAddress) {
        isReceived = true
      }

      if (transfer.fromAddressHash === walletAddress) {
        isReceived = false
      }
    }
  }

  // TODO: change icon according to the event
  // TODO: add testing code

  return (
    <Touchable disabled={false} onPress={openNftTransactionDetails}>
      <View style={styles.container}>
        <View>{<DepositIcon />}</View>
        <View style={styles.descriptionContainer}>
          <Text style={styles.title} testID={'TransferFeedItem/title'}>
            {isReceived ? t('receivedNft') : t('sentNft')}
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

export default NFTsTransactionItem

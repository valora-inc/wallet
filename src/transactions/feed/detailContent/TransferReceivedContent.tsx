import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import HorizontalLine from 'src/components/HorizontalLine'
import TokenTotalLineItem from 'src/components/TokenTotalLineItem'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getRecipientFromAddress } from 'src/recipients/recipient'
import { recipientInfoSelector } from 'src/recipients/reducer'
import { useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { useTokenInfo } from 'src/tokens/hooks'
import CommentSection from 'src/transactions/CommentSection'
import TransferAvatars from 'src/transactions/TransferAvatars'
import UserSection from 'src/transactions/UserSection'
import { TokenTransfer } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import networkConfig from 'src/web3/networkConfig'

// Note that this is tested from TransactionDetailsScreen.test.tsx
function TransferReceivedContent({ transfer }: { transfer: TokenTransfer }) {
  const { amount, metadata, address } = transfer

  const { t } = useTranslation()
  const info = useSelector(recipientInfoSelector)

  const celoTokenId = useTokenInfo(networkConfig.currencyToTokenId[Currency.Celo])?.tokenId
  const celoEducationUri = useSelector((state) => state.app.celoEducationUri)

  const isCeloTx = amount.tokenId === celoTokenId
  const recipient = getRecipientFromAddress(address, info, metadata.title, metadata.image)

  const openLearnMore = () => {
    navigate(Screens.WebViewScreen, { uri: celoEducationUri! })
  }

  return (
    <>
      <UserSection
        type="received"
        recipient={recipient}
        avatar={<TransferAvatars type="received" recipient={recipient} />}
        testID="TransferReceived"
      />
      <CommentSection comment={metadata.comment} isSend={false} />
      {isCeloTx && celoEducationUri && (
        <TouchableOpacity onPress={openLearnMore} testID={'celoTxReceived/learnMore'}>
          <Text style={styles.learnMore}>{t('learnMore')}</Text>
        </TouchableOpacity>
      )}
      <HorizontalLine />
      <TokenTotalLineItem
        tokenAmount={new BigNumber(amount.value)}
        tokenId={amount.tokenId}
        localAmount={amount.localAmount}
        feeToAddInUsd={undefined}
        hideSign={true}
      />
    </>
  )
}

const styles = StyleSheet.create({
  learnMore: {
    ...fontStyles.small,
    color: colors.gray4,
    textDecorationLine: 'underline',
  },
})

export default TransferReceivedContent
